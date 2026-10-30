import { NextResponse } from 'next/server';
import { memoryKotsStore } from '@/lib/cafe/kot-router';
import { memoryOrdersMap } from '@/lib/cafe/order-store';
import { deriveOrderStatus } from '@/lib/cafe/kot-state-derivation';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const station = searchParams.get('station') || 'all';

    // Filter active KOTs (not yet served or rejected)
    const activeKots = memoryKotsStore.filter((kot) => {
      const matchStation = station === 'all' || kot.station === station;
      return matchStation && kot.status !== 'served';
    });

    // Attach order context
    const enriched = activeKots.map((kot) => {
      const order = memoryOrdersMap.get(kot.orderId) || {};
      const allOrderKots = memoryKotsStore.filter((k) => k.orderId === kot.orderId);
      const derived = deriveOrderStatus(order.status || 'paid', allOrderKots);

      const elapsedMs = Date.now() - new Date(kot.createdAt).getTime();
      const elapsedMins = Math.floor(elapsedMs / 60000);

      return {
        ...kot,
        tableNumber: order.tableNumber || 'Table 1',
        orderNumber: order.orderNumber || 'AMPM-ORDER',
        orderStatus: derived.orderStatus,
        elapsedMinutes: elapsedMins,
        slaTier: elapsedMins < 10 ? 'green' : elapsedMins < 20 ? 'yellow' : 'red',
      };
    });

    return NextResponse.json({
      success: true,
      kots: enriched,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'KDS error' },
      { status: 500 }
    );
  }
}
