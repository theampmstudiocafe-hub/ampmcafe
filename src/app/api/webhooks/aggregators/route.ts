import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { normalizeAggregatorOrder, IngestedAggregatorOrder } from '@/lib/adapters/aggregator-adapter';
import { routeOrderToStations } from '@/lib/cafe/kot-router';
import { memoryOrdersMap } from '@/lib/cafe/order-store';

export const dynamic = 'force-dynamic';

const processedAggregatorOrders = new Set<string>();

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-aggregator-signature') || 'test_sig';
    const channelHeader = request.headers.get('x-aggregator-channel') || 'zomato';

    const payload: IngestedAggregatorOrder = JSON.parse(rawBody);

    if (!payload.externalOrderId || !payload.items || payload.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid aggregator order payload' },
        { status: 400 }
      );
    }

    // Idempotency: Deduplicate on externalOrderId
    if (processedAggregatorOrders.has(payload.externalOrderId)) {
      return NextResponse.json({
        success: true,
        status: 'acknowledged',
        message: 'Order already processed (idempotent duplicate)',
        externalOrderId: payload.externalOrderId,
      });
    }

    processedAggregatorOrders.add(payload.externalOrderId);

    // Normalize order and resolve item mappings
    const normalized = normalizeAggregatorOrder({
      ...payload,
      channel: (payload.channel || channelHeader) as 'zomato' | 'swiggy',
    });

    const orderId = `agg_ord_${Date.now()}`;
    const orderRecord: any = {
      id: orderId,
      orderNumber: normalized.orderNumber,
      externalOrderId: normalized.externalOrderId,
      source: normalized.channel,
      tableNumber: `${normalized.channel.toUpperCase()} Delivery`,
      status: 'paid', // Aggregators guarantee collection
      subtotalPaise: payload.totalCustomerPaidPaise || 38000,
      totalGrossPaise: payload.totalCustomerPaidPaise || 38000,
      aggregatorCommissionPaise: normalized.aggregatorCommissionPaise, // Nullable until settlement
      aggregatorPayoutPaise: normalized.aggregatorPayoutPaise,         // Nullable until settlement
      items: normalized.itemsForKot,
      hasUnmappedItems: normalized.hasUnmappedItems,
      unmappedItemNames: normalized.unmappedItemNames,
      createdAt: new Date().toISOString(),
    };

    memoryOrdersMap.set(orderId, orderRecord);

    // Dispatch items into station KOT router
    const routingResult = await routeOrderToStations({
      orderId,
      orderNumber: normalized.orderNumber,
      tableNumber: orderRecord.tableNumber,
      items: normalized.itemsForKot,
      totalGrossPaise: orderRecord.totalGrossPaise,
      gstin: '27AAAAA0000A1Z5',
    });

    orderRecord.kots = routingResult.kots;
    orderRecord.printJobIds = routingResult.printJobIds;

    // Acknowledge immediately within aggregator SLA (< 500ms)
    return NextResponse.json({
      success: true,
      status: 'acknowledged',
      externalOrderId: normalized.externalOrderId,
      orderNumber: normalized.orderNumber,
      hasUnmappedItems: normalized.hasUnmappedItems,
      unmappedItems: normalized.unmappedItemNames,
      kotsCount: routingResult.kots.length,
      statutoryNotice: 'Aggregator GST under Section 9(5) CGST Act marked Pending CA Confirmation',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Aggregator webhook error' },
      { status: 500 }
    );
  }
}
