import { NextResponse } from 'next/server';
import { calculateOrderBill } from '@/lib/cafe/pricing-tax-engine';
import { routeOrderToStations } from '@/lib/cafe/kot-router';
import { memoryOrdersMap } from '@/lib/cafe/order-store';
import { lockTableOrderInProgress } from '@/lib/cafe/table-service';

export const dynamic = 'force-dynamic';

let posTerminalLockedCounter = 1;

export async function POST(request: Request) {
  try {
    const callerRole = request.headers.get('x-ampm-role') || 'front_desk';
    const staffName = request.headers.get('x-ampm-user') || 'Counter Cashier';

    const body = await request.json();
    const {
      terminalId = 'POS1',
      orderType = 'takeaway', // 'dine_in' | 'takeaway' | 'bar_counter'
      tableNumber,
      tableToken,
      items,
      tenderMode, // 'cash' | 'card_swipe' | 'counter_upi_qr'
      upiUtrReference,
      discountPercent = 0,
      discountReason,
      invoicingMode = 'per_terminal_series', // 'per_terminal_series' | 'provisional_slip' - Pending CA
      clientMutationId,
      notes,
      cashReceivedApproved = true,
      cashReceivedPaise,
      cashApprovedBy,
      customerName,
      customerGstin,
      specialInstructions,
    } = body;

    // Strict Studio / Cafe Separation: Reject any attempt to charge member yoga credits
    if (body.chargeMemberCredits || body.memberPackId || tenderMode === 'member_account') {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden: Studio class pack credits cannot be cross-billed or deducted for café orders (Strict Studio/Café Separation Policy)',
        },
        { status: 403 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'A valid items array is required' },
        { status: 400 }
      );
    }

    // Role-based discount caps
    const discount = Number(discountPercent) || 0;
    if (discount > 0) {
      if (!discountReason || discountReason.trim().length < 5) {
        return NextResponse.json(
          { success: false, error: 'A mandatory audit reason of at least 5 characters is required for any discount' },
          { status: 400 }
        );
      }

      if (callerRole === 'front_desk' && discount > 10) {
        return NextResponse.json(
          { success: false, error: 'Permission denied: Front Desk staff discount is capped at maximum 10%. Overrides require Manager or Owner.' },
          { status: 403 }
        );
      }

      if (callerRole === 'manager' && discount > 25) {
        return NextResponse.json(
          { success: false, error: 'Permission denied: Manager discount is capped at maximum 25%. Overrides require Owner.' },
          { status: 403 }
        );
      }
    }

    // Server-side calculation in integer paise
    const baseBill = calculateOrderBill(items);
    let finalSubtotalPaise = baseBill.subtotalPaise;

    if (discount > 0) {
      const discountPaise = Math.round((baseBill.subtotalPaise * discount) / 100);
      finalSubtotalPaise = baseBill.subtotalPaise - discountPaise;
    }

    const cgstPaise = Math.round((finalSubtotalPaise * 2.5) / 100);
    const sgstPaise = Math.round((finalSubtotalPaise * 2.5) / 100);
    const totalGrossPaise = finalSubtotalPaise + cgstPaise + sgstPaise;

    // Sequential invoice numbering based on Option 1 (Per-terminal distinct series) vs Option 2 (Provisional slip)
    posTerminalLockedCounter += 1;
    const invoiceNumber = invoicingMode === 'provisional_slip'
      ? `ORD-PROVISIONAL-${Date.now().toString().slice(-6)}`
      : `AMPM-${terminalId}/26-27/${String(posTerminalLockedCounter).padStart(4, '0')}`;

    const orderId = clientMutationId || `pos_ord_${Date.now()}`;
    const orderNumber = `POS-${terminalId}-${Date.now().toString().slice(-4)}`;

    const isCash = tenderMode === 'cash';
    const isApproved = !isCash || Boolean(cashReceivedApproved);
    const initialStatus = isApproved ? 'paid' : 'cash_verification_pending';
    const cashPaise = cashReceivedPaise || (isCash ? totalGrossPaise : 0);
    const changeDuePaise = isCash ? Math.max(0, cashPaise - totalGrossPaise) : 0;

    const orderRecord: any = {
      id: orderId,
      orderNumber,
      orderType,
      tableNumber: orderType === 'dine_in' ? tableNumber : `Counter (${orderType})`,
      tableToken: tableToken || null,
      status: initialStatus,
      source: 'counter_pos',
      tenderMode,
      cashReceivedApproved: isApproved,
      cashApprovedBy: isApproved ? (cashApprovedBy || staffName) : null,
      cashApprovedAt: isApproved ? new Date().toISOString() : null,
      cashReceivedPaise: isCash ? cashPaise : null,
      changeDuePaise: isCash ? changeDuePaise : null,
      customerName: customerName || null,
      customerGstin: customerGstin || null,
      specialInstructions: specialInstructions || notes || null,
      upiUtrReference: upiUtrReference || null,
      subtotalPaise: finalSubtotalPaise,
      discountPercent: discount,
      discountReason: discountReason || null,
      cgstPaise,
      sgstPaise,
      totalGrossPaise,
      invoiceNumber,
      items: baseBill.lineItems,
      createdBy: `${staffName} (${callerRole})`,
      createdAt: new Date().toISOString(),
    };

    memoryOrdersMap.set(orderId, orderRecord);

    // If dine-in, lock the table
    if (orderType === 'dine_in' && tableToken) {
      await lockTableOrderInProgress(tableToken, orderId);
    }

    let routingResult: any = { kots: [], printJobIds: [] };

    // Route items to KOT pipeline if approved
    if (isApproved) {
      routingResult = await routeOrderToStations({
        orderId,
        orderNumber,
        tableNumber: orderRecord.tableNumber,
        items: orderRecord.items,
        subtotalPaise: finalSubtotalPaise,
        cgstPaise,
        sgstPaise,
        totalGrossPaise,
        gstin: '27AAAAA0000A1Z5',
        specialInstructions: orderRecord.specialInstructions,
      });

      orderRecord.kots = routingResult.kots;
      orderRecord.printJobIds = routingResult.printJobIds;
    }

    return NextResponse.json({
      success: true,
      kickCashDrawer: isCash && isApproved,
      order: {
        id: orderId,
        orderNumber,
        invoiceNumber,
        tableNumber: orderRecord.tableNumber,
        status: orderRecord.status,
        tenderMode,
        cashReceivedApproved: orderRecord.cashReceivedApproved,
        cashReceivedPaise: orderRecord.cashReceivedPaise,
        changeDuePaise: orderRecord.changeDuePaise,
        customerName: orderRecord.customerName,
        customerGstin: orderRecord.customerGstin,
        subtotalPaise: finalSubtotalPaise,
        cgstPaise,
        sgstPaise,
        totalGrossPaise,
        kots: routingResult.kots,
        printJobIds: routingResult.printJobIds,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'POS billing failed' },
      { status: 500 }
    );
  }
}
