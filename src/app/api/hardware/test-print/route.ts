import { NextResponse } from 'next/server';
import { memoryPrintJobsStore } from '@/lib/cafe/kot-router';
import { renderStructuredJobToAscii, StructuredPrintJobData, ESC_POS_COMMANDS } from '@/lib/hardware/escpos';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { target = 'printer_pos', action = 'test_print' } = body;

    const isCashDrawer = action === 'kick_drawer' || target === 'cash_drawer';
    const targetPrinter = isCashDrawer ? 'printer_pos' : target;

    const width = targetPrinter === 'printer_pos' ? 32 : 48;
    const station = targetPrinter === 'printer_food'
      ? 'food'
      : targetPrinter === 'printer_bev'
      ? 'beverage'
      : targetPrinter === 'printer_dessert'
      ? 'dessert'
      : undefined;

    const testPayload: StructuredPrintJobData = {
      orderNumber: `TEST-${Date.now().toString().slice(-4)}`,
      tableNumber: 'TEST',
      station,
      type: 'test_slip',
      createdAt: new Date().toISOString(),
      openCashDrawer: isCashDrawer,
      items: [
        { name: 'Hardware Line Test Item', quantity: 1, unitPricePaise: 0 },
      ],
    };

    const renderedText = renderStructuredJobToAscii(testPayload, width);

    const job = {
      id: `print_test_${Date.now()}`,
      orderId: 'test_order',
      target: targetPrinter,
      status: 'queued' as const,
      data: testPayload,
      renderedText,
      rawCommands: isCashDrawer ? ESC_POS_COMMANDS.KICK_DRAWER : undefined,
      retryCount: 0,
      createdAt: new Date().toISOString(),
    };

    memoryPrintJobsStore.push(job);

    return NextResponse.json({
      success: true,
      message: isCashDrawer ? 'Cash drawer kick signal enqueued.' : `Test print enqueued for ${targetPrinter}.`,
      jobId: job.id,
      preview: renderedText,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to dispatch test print' },
      { status: 400 }
    );
  }
}
