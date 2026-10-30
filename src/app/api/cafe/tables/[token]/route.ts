import { NextResponse } from 'next/server';
import { getTableByToken } from '@/lib/cafe/table-service';
import { getAllMenuItems } from '@/lib/cafe/menu-store';

export const dynamic = 'force-dynamic';

// Rate limit map: key = `${ip}-${token}` -> timestamps array
const rateLimitMap: Map<string, number[]> = new Map();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimitKey = `${ip}-${token}`;

    // Sliding window rate limiting: max 30 requests/minute per device/token
    const now = Date.now();
    const windowStart = now - 60000;
    const history = (rateLimitMap.get(rateLimitKey) || []).filter((t) => t > windowStart);
    if (history.length >= 30) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded for this table session. Please wait.' },
        { status: 429 }
      );
    }
    history.push(now);
    rateLimitMap.set(rateLimitKey, history);

    const table = await getTableByToken(token);
    if (!table) {
      return NextResponse.json(
        { success: false, error: 'Invalid or inactive table QR code.' },
        { status: 404 }
      );
    }

    const menuItems = getAllMenuItems();
    const featuredItem = menuItems[0];

    return NextResponse.json({
      success: true,
      table: {
        id: table.id,
        tableNumber: table.table_number,
        token: table.qr_code_token,
        capacity: table.capacity,
        status: table.status,
        activeOrderId: table.active_order_id,
      },
      featuredItem,
      menuItems,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Server error' },
      { status: 500 }
    );
  }
}
