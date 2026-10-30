import { NextResponse } from 'next/server';
import { toggleItemAvailability, getAllMenuItems } from '@/lib/cafe/menu-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    success: true,
    items: getAllMenuItems(),
  });
}

export async function POST(request: Request) {
  try {
    const callerRole = request.headers.get('x-ampm-role') || 'kitchen_staff';
    const body = await request.json();
    const { itemId, modifierId } = body;

    if (!itemId) {
      return NextResponse.json(
        { success: false, error: 'itemId is required' },
        { status: 400 }
      );
    }

    const result = toggleItemAvailability(itemId, modifierId);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: `Item or modifier not found: ${itemId}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      itemId,
      modifierId: modifierId || null,
      isAvailable: result.isAvailable,
      updatedByRole: callerRole,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to toggle availability' },
      { status: 500 }
    );
  }
}
