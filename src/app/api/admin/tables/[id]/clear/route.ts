import { NextResponse } from 'next/server';
import { manualClearTable } from '@/lib/cafe/table-service';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const callerRole = request.headers.get('x-ampm-role') || 'front_desk';
    const staffName = request.headers.get('x-ampm-user') || 'Staff';

    const result = await manualClearTable(id, `${staffName} (${callerRole})`);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to clear table' },
      { status: 500 }
    );
  }
}
