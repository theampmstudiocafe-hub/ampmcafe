import { NextResponse } from 'next/server';
import { memoryKotsStore, memoryPrintJobsStore } from '@/lib/cafe/kot-router';
import { memoryOrdersMap } from '@/lib/cafe/order-store';
import { deriveOrderStatus } from '@/lib/cafe/kot-state-derivation';
import { reopenTable } from '@/lib/cafe/table-service';
import { depleteStockForKot } from '@/lib/services/recipe-depletion-service';
import { renderStructuredJobToAscii } from '@/lib/hardware/escpos';

export const dynamic = 'force-dynamic';

let creditNoteSequenceCounter = 20;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { kotId, action, rejectionReason } = body;

    if (!kotId || !action) {
      return NextResponse.json(
        { success: false, error: 'kotId and action are required.' },
        { status: 400 }
      );
    }

    const kot = memoryKotsStore.find((k) => k.id === kotId);
    if (!kot) {
      return NextResponse.json(
        { success: false, error: `KOT ${kotId} not found.` },
        { status: 404 }
      );
    }

    const order = memoryOrdersMap.get(kot.orderId);
    let refundDetails: any = null;

    switch (action) {
      case 'accept':
        kot.status = 'accepted';
        kot.acceptedAt = new Date().toISOString();
        break;

      case 'start_prep':
        kot.status = 'preparing';
        kot.startedPrepAt = new Date().toISOString();
        // Execute per-KOT recipe stock depletion at preparation start
        if (kot.items && kot.items.length > 0) {
          kot.depletionResult = depleteStockForKot(
            kot.id,
            kot.kotNumber,
            kot.station,
            kot.items
          );
        }
        break;

      case 'ready':
        kot.status = 'ready';
        break;

      case 'serve':
        kot.status = 'served';
        kot.completedAt = new Date().toISOString();
        break;

      case 'handed_over_to_rider':
        kot.status = 'served';
        kot.riderHandedOverAt = new Date().toISOString();
        if (order) {
          order.riderHandedOverAt = kot.riderHandedOverAt;
        }
        break;

      case 'undo':
      case 'recall':
        if (kot.status === 'served') {
          kot.status = 'ready';
        } else if (kot.status === 'ready') {
          kot.status = 'preparing';
        } else if (kot.status === 'preparing') {
          kot.status = 'accepted';
        }
        kot.recalledAt = new Date().toISOString();
        break;

      case 'reprint_kot': {
        kot.reprintCount = (kot.reprintCount || 0) + 1;
        kot.reprintedAt = new Date().toISOString();
        if (!kot.originalPrintedAt) {
          kot.originalPrintedAt = kot.createdAt;
        }

        const printerTarget = kot.station === 'food'
          ? 'printer_food'
          : kot.station === 'beverage'
          ? 'printer_bev'
          : 'printer_dessert';

        const reprintPayload = {
          orderNumber: order?.orderNumber || kot.kotNumber,
          tableNumber: order?.tableNumber || 'Table 1',
          kotNumber: kot.kotNumber,
          station: kot.station,
          type: 'kot_ticket' as const,
          createdAt: kot.createdAt,
          reprintCount: kot.reprintCount,
          originalPrintedAt: kot.originalPrintedAt,
          reprintedAt: kot.reprintedAt,
          specialInstructions: order?.specialInstructions,
          items: (kot.items || []).map((it: any) => ({
            name: it.name,
            quantity: it.quantity,
            specialInstructions: it.specialInstructions,
            modifiers: it.modifiers?.map((m: any) => m.name || m),
          })),
        };

        const width = 48;
        const renderedText = renderStructuredJobToAscii(reprintPayload, width);

        const reprintJob = {
          id: `print_reprint_${Date.now()}`,
          orderId: kot.orderId,
          kotId: kot.id,
          target: printerTarget,
          status: 'queued' as const,
          data: reprintPayload,
          renderedText,
          retryCount: 0,
          createdAt: new Date().toISOString(),
        };

        memoryPrintJobsStore.push(reprintJob as any);
        kot.lastReprintJobId = reprintJob.id;
        break;
      }

      case 'reject': {
        kot.status = 'rejected';
        kot.rejectionReason = rejectionReason || 'Kitchen station unable to fulfill item';

        // Pro-rata refund calculation for rejected station items (including proportional 5% GST)
        const rejectedItemsSubtotal = (kot.items || []).reduce(
          (sum: number, item: any) => sum + (item.unitPricePaise || 0) * (item.quantity || 1),
          0
        );
        const rejectedGst = Math.round((rejectedItemsSubtotal * 5) / 100);
        const refundGrossPaise = rejectedItemsSubtotal + rejectedGst;

        creditNoteSequenceCounter += 1;
        const creditNoteNumber = `CN/26-27/${String(creditNoteSequenceCounter).padStart(4, '0')}`;
        const refundId = `rfnd_${Date.now().toString().slice(-10)}`;

        refundDetails = {
          refundId,
          creditNoteNumber,
          refundGrossPaise,
          taxableReversedPaise: rejectedItemsSubtotal,
          gstReversedPaise: rejectedGst,
          reason: kot.rejectionReason,
        };

        kot.refundDetails = refundDetails;
        break;
      }

      default:
        return NextResponse.json(
          { success: false, error: `Invalid action: ${action}` },
          { status: 400 }
        );
    }

    // Evaluate derived order status
    const allOrderKots = memoryKotsStore.filter((k) => k.orderId === kot.orderId);
    const derived = deriveOrderStatus(order?.status || 'paid', allOrderKots);

    if (order) {
      order.status = derived.orderStatus;
    }

    // If all non-rejected KOTs are served, reopen the table!
    let tableReopened = false;
    if (derived.allNonRejectedServed && order?.tableToken) {
      tableReopened = await reopenTable(order.tableToken);
    }

    return NextResponse.json({
      success: true,
      kot: {
        id: kot.id,
        status: kot.status,
        station: kot.station,
      },
      order: {
        id: order?.id,
        status: derived.orderStatus,
        allNonRejectedServed: derived.allNonRejectedServed,
        hasPartialRejection: derived.hasPartialRejection,
      },
      refundDetails,
      tableReopened,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Transition error' },
      { status: 500 }
    );
  }
}
