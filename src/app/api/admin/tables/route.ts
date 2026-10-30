import { NextResponse } from 'next/server';
import { getAllTables, createOrUpdateTable } from '@/lib/cafe/table-service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const tables = await getAllTables();
    return NextResponse.json({
      success: true,
      tables,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to list tables' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const callerRole = request.headers.get('x-ampm-role') || 'manager';
    if (callerRole !== 'owner' && callerRole !== 'manager') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only Owner and Managers can configure dining tables.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { tableNumber, capacity, qrCodeToken } = body;

    if (!tableNumber || !capacity) {
      return NextResponse.json(
        { success: false, error: 'tableNumber and capacity are required' },
        { status: 400 }
      );
    }

    const table = await createOrUpdateTable({
      tableNumber,
      capacity: Number(capacity),
      qrCodeToken,
    });

    return NextResponse.json({
      success: true,
      table,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to create table' },
      { status: 500 }
    );
  }
}
