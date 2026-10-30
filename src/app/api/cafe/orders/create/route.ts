import { NextResponse } from 'next/server';
import { reserveTableAtomic } from '@/lib/cafe/table-service';
import { calculateOrderBill } from '@/lib/cafe/pricing-tax-engine';
import { memoryOrdersMap } from '@/lib/cafe/order-store';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      tableToken,
      items,
      idempotencyKey,
      specialInstructions,
    } = body;

    if (!tableToken || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Table token and valid items array are required.' },
        { status: 400 }
      );
    }

    // Server-side calculated bill (client prices are strictly ignored)
    const bill = calculateOrderBill(items);

    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const orderNumber = `AMPM-20261026-${String(Math.floor(1000 + Math.random() * 9000))}`;

    // 1. Atomic table hold reservation (4 min TTL)
    const reserveResult = await reserveTableAtomic(tableToken, orderId, 4);
    if (!reserveResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: reserveResult.error || 'Table is not available for reservation.',
        },
        { status: 409 }
      );
    }

    // 2. Razorpay Order Creation (Test mode / Production)
    const razorpayOrderId = `order_${Date.now()}_test`;

    const orderRecord = {
      id: orderId,
      orderNumber,
      tableToken,
      tableId: reserveResult.table?.id || 'table-001',
      tableNumber: reserveResult.table?.table_number || 'Table 1',
      status: 'payment_pending',
      subtotalPaise: bill.subtotalPaise,
      serviceChargePaise: bill.serviceChargePaise,
      taxGstPaise: bill.totalGstPaise,
      cgstPaise: bill.cgstPaise,
      sgstPaise: bill.sgstPaise,
      totalGrossPaise: bill.totalGrossPaise,
      items: bill.lineItems,
      idempotencyKey: idempotencyKey || orderId,
      razorpayOrderId,
      specialInstructions: specialInstructions || null,
      createdAt: new Date().toISOString(),
    };

    memoryOrdersMap.set(orderId, orderRecord);
    if (razorpayOrderId) {
      memoryOrdersMap.set(razorpayOrderId, orderRecord);
    }

    return NextResponse.json({
      success: true,
      order: {
        id: orderId,
        orderNumber,
        tableNumber: orderRecord.tableNumber,
        subtotalPaise: bill.subtotalPaise,
        cgstPaise: bill.cgstPaise,
        sgstPaise: bill.sgstPaise,
        totalGrossPaise: bill.totalGrossPaise,
        razorpayOrderId,
        status: 'payment_pending',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}
