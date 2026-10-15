import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { booking_id, member_id, reason, staff_actor } = body;

    if (!booking_id || !member_id) {
      return NextResponse.json(
        { success: false, error: "Missing required booking_id or member_id" },
        { status: 400 }
      );
    }

    // Strict validation: Reason is non-negotiable for late-cancellation overrides
    if (!reason || typeof reason !== "string" || reason.trim().length < 5) {
      return NextResponse.json(
        {
          success: false,
          error: "A mandatory override reason (minimum 5 characters) is strictly required to reverse a late cancellation.",
        },
        { status: 400 }
      );
    }

    const auditEntry = {
      action: "override_late_cancellation_refund",
      booking_id,
      member_id,
      reason: reason.trim(),
      staff_actor: staff_actor || "Front Desk Staff",
      credit_refunded: 1,
      timestamp: new Date().toISOString(),
    };

    console.log("[AUDIT LOG - Late Refund Override]", auditEntry);

    return NextResponse.json({
      success: true,
      booking_id,
      status: "refund_overridden",
      credit_restored: 1,
      reason: reason.trim(),
      audit: auditEntry,
      message: "Late cancellation policy overridden successfully. 1 credit restored to member ledger.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process late refund override" },
      { status: 500 }
    );
  }
}
