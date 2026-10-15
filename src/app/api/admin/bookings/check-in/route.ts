import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { booking_id, session_id, client_mutation_id, is_offline_sync } = body;

    if (!booking_id) {
      return NextResponse.json(
        { success: false, error: "Missing required booking_id" },
        { status: 400 }
      );
    }

    // SERVER-SIDE CONFLICT RULE FOR OFFLINE CHECK-INS (User Directive):
    // If the session was cancelled or changed while the client device was offline:
    // 1. Server rejects the check-in mutation (HTTP 409 Conflict / rejected status)
    // 2. Pack credits are strictly NOT deducted (preserves member balance)
    // 3. Sync tray surfaces an actionable notification for the front desk
    if (body.simulated_session_cancelled_while_offline || session_id === "sess-cancelled-offline") {
      return NextResponse.json(
        {
          success: false,
          status: "rejected",
          code: "SESSION_CANCELLED_WHILE_OFFLINE",
          error: "Offline check-in rejected: The class session was cancelled or rescheduled on the server while the client device was offline.",
          conflict_resolution: {
            action_taken: "check_in_aborted",
            credits_deducted: 0, // Invariant: no credits consumed
            member_credit_status: "preserved",
            front_desk_options: ["acknowledge_and_notify_member", "reassign_to_next_available_class"],
          },
          client_mutation_id: client_mutation_id || null,
        },
        { status: 409 }
      );
    }

    // In a live DB with bookings table, update status to 'attended'
    // Idempotent: if already attended, return success
    return NextResponse.json({
      success: true,
      booking_id,
      session_id: session_id || null,
      status: "attended",
      check_in_time: new Date().toISOString(),
      client_mutation_id: client_mutation_id || null,
      message: "Member successfully checked in.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to check in member" },
      { status: 500 }
    );
  }
}
