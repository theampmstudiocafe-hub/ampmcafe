import { NextResponse } from 'next/server';
import { reconcileCafeTables } from '@/lib/cafe/table-service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const alertMinutes = Number(searchParams.get('alert_minutes')) || 5;

    const stats = await reconcileCafeTables(alertMinutes);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      reconciliation: {
        expiredHoldsReleased: stats.expiredHoldsReleased,
        unacceptedOrdersAlertedCount: stats.unacceptedOrdersAlerted.length,
        unacceptedOrdersAlerted: stats.unacceptedOrdersAlerted,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Reconciliation failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
