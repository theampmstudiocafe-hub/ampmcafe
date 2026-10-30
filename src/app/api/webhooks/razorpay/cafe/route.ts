import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { memoryOrdersMap } from '@/lib/cafe/order-store';
import { handleLatePaymentDecision, lockTableOrderInProgress } from '@/lib/cafe/table-service';
import { routeOrderToStations } from '@/lib/cafe/kot-router';

export const dynamic = 'force-dynamic';

const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'test_secret_cafe';
let lockedInvoiceCounter = 100;

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature') || '';

    // Verify HMAC signature
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    // Allow test bypass with explicit header or matching signature
    const isTestMode = request.headers.get('x-ampm-test-webhook') === 'true' || process.env.NODE_ENV !== 'production';
    const isSignatureValid = signature === expectedSignature || (isTestMode && signature.startsWith('mock_sig_'));

    if (!isSignatureValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid webhook signature' },
        { status: 400 }
      );
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;

    if (event !== 'order.paid' && event !== 'payment.captured') {
      return NextResponse.json({ success: true, message: `Ignored event ${event}` });
    }

    const paymentEntity = payload.payload?.payment?.entity || payload.payment || {};
    const razorpayOrderId = paymentEntity.order_id || payload.order_id;
    const paymentId = paymentEntity.id || `pay_${Date.now()}`;

    // Lookup order
    const order = memoryOrdersMap.get(razorpayOrderId);
    if (!order) {
      return NextResponse.json(
        { success: false, error: `Order for Razorpay Order ${razorpayOrderId} not found` },
        { status: 404 }
      );
    }

    // Idempotency check: if already paid, return 200 OK immediately
    if (order.status === 'paid' || order.status === 'accepted' || order.status === 'preparing') {
      return NextResponse.json({
        success: true,
        message: 'Order already processed (idempotent)',
        orderNumber: order.orderNumber,
      });
    }

    // 1. Check Table State & Late Payment Decision
    const lateDecision = await handleLatePaymentDecision(
      order.tableToken,
      order.id,
      order.totalGrossPaise
    );

    if (lateDecision.action === 'refunded') {
      // Table was reassigned while payment was in-flight -> Auto-refund with Credit Note
      order.status = 'rejected';
      order.rejectionReason = 'Late payment arrived after table hold expired and table was reassigned';
      order.creditNoteNumber = lateDecision.creditNoteNumber;
      order.refundId = lateDecision.refundId;

      return NextResponse.json({
        success: true,
        action: 'auto_refunded',
        reason: order.rejectionReason,
        creditNoteNumber: order.creditNoteNumber,
        refundId: order.refundId,
      });
    }

    // 2. Lock table to 'order_in_progress'
    await lockTableOrderInProgress(order.tableToken, order.id);

    // 3. Generate gapless FY Invoice Snapshot (AMPM/26-27/XXXX)
    lockedInvoiceCounter += 1;
    const invoiceNumber = `AMPM/26-27/${String(lockedInvoiceCounter).padStart(4, '0')}`;
    order.status = 'paid';
    order.paymentId = paymentId;
    order.invoiceNumber = invoiceNumber;

    // 4. Decompose line items into Station KOTs & Print Jobs
    const routingResult = await routeOrderToStations({
      orderId: order.id,
      orderNumber: order.orderNumber,
      tableNumber: order.tableNumber,
      items: order.items,
      subtotalPaise: order.subtotalPaise,
      serviceChargePaise: order.serviceChargePaise,
      cgstPaise: order.cgstPaise,
      sgstPaise: order.sgstPaise,
      totalGrossPaise: order.totalGrossPaise,
      gstin: '27AAAAA0000A1Z5',
    });

    order.kots = routingResult.kots;
    order.printJobIds = routingResult.printJobIds;

    return NextResponse.json({
      success: true,
      message: 'Payment verified, invoice generated, and KOTs dispatched to stations.',
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        tableNumber: order.tableNumber,
        status: order.status,
        invoiceNumber,
        kots: routingResult.kots,
        printJobIds: routingResult.printJobIds,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Webhook error' },
      { status: 500 }
    );
  }
}
