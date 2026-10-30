import { NextResponse } from 'next/server';
import { memoryOrdersMap } from '@/lib/cafe/order-store';
import { routeOrderToStations } from '@/lib/cafe/kot-router';
import { ESC_POS_COMMANDS } from '@/lib/hardware/escpos';
import { memoryPrintJobsStore } from '@/lib/cafe/kot-router';

export const dynamic = 'force-dynamic';

export async function GET() {
  const pendingOrders: any[] = [];
  for (const [, ord] of memoryOrdersMap.entries()) {
    if (ord && ord.status === 'cash_verification_pending') {
      pendingOrders.push(ord);
    }
  }

  return NextResponse.json({
    success: true,
    count: pendingOrders.length,
    orders: pendingOrders,
  });
}

export async function POST(request: Request) {
  try {
    const callerRole = request.headers.get('x-ampm-role') || 'manager';
    const staffName = request.headers.get('x-ampm-user') || 'Admin Reception';

    const body = await request.json();
    const { orderId, approved = true } = body;

    const order = memoryOrdersMap.get(orderId);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    if (!approved) {
      order.status = 'rejected';
      order.rejectionReason = `Cash receipt rejected by ${staffName} (${callerRole})`;
      return NextResponse.json({
        success: true,
        message: 'Cash payment rejected',
        order,
      });
    }

    // Approve cash payment
    order.status = 'paid';
    order.cashReceivedApproved = true;
    order.cashApprovedBy = `${staffName} (${callerRole})`;
    order.cashApprovedAt = new Date().toISOString();

    // Pulse cash drawer
    const drawerJob = {
      id: `pj_drawer_${Date.now()}`,
      order_id: order.id,
      station: 'counter' as const,
      job_type: 'drawer_kick',
      printer_target: 'printer_pos',
      status: 'queued',
      job_data: {
        orderNumber: order.orderNumber,
        tableNumber: order.tableNumber,
        type: 'test_slip' as const,
        createdAt: new Date().toISOString(),
        openCashDrawer: true,
        items: [],
      },
      rawCommands: ESC_POS_COMMANDS.KICK_DRAWER,
      retry_count: 0,
      created_at: new Date().toISOString(),
    };
    memoryPrintJobsStore.push(drawerJob as any);

    // Dispatch KOTs to kitchen
    const routingResult = await routeOrderToStations({
      orderId: order.id,
      orderNumber: order.orderNumber,
      tableNumber: order.tableNumber,
      items: order.items,
      subtotalPaise: order.subtotalPaise,
      cgstPaise: order.cgstPaise,
      sgstPaise: order.sgstPaise,
      totalGrossPaise: order.totalGrossPaise,
      gstin: '27AAAAA0000A1Z5',
      specialInstructions: order.specialInstructions,
    });

    order.kots = routingResult.kots;
    order.printJobIds = routingResult.printJobIds;

    return NextResponse.json({
      success: true,
      message: `Cash payment of Rs. ${(order.totalGrossPaise / 100).toFixed(2)} approved by ${staffName}. KOTs dispatched and cash drawer pulse enqueued.`,
      order,
      kickCashDrawer: true,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Approval failed' }, { status: 500 });
  }
}
