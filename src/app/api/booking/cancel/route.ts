import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const CancelBookingSchema = z.object({
  bookingId: z.string().uuid(),
  reason: z.string().optional().default("Member initiated cancellation"),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const body = await req.json();
    const parsed = CancelBookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid payload" },
        { status: 400 }
      );
    }

    const { bookingId, reason } = parsed.data;
    const admin = createAdminClient();

    // 1. Fetch booking and session details
    const { data: booking, error: bookError } = await admin
      .from("bookings")
      .select(`
        *,
        class_sessions (
          id,
          start_time,
          class_types (name)
        )
      `)
      .eq("id", bookingId)
      .single();

    if (bookError || !booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    if (booking.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized: You do not own this booking." }, { status: 403 });
    }

    if (booking.status === "cancelled") {
      return NextResponse.json({ error: "This booking is already cancelled." }, { status: 400 });
    }

    // 2. Read configurable business rule for cancellation window
    const { data: windowSetting } = await admin
      .from("business_settings")
      .select("value")
      .eq("key", "cancellation_window_hours")
      .maybeSingle();

    const cancellationWindowHours = windowSetting?.value ? Number(windowSetting.value) : 12;

    const sessionStartTime = new Date((booking.class_sessions as any).start_time).getTime();
    const nowTime = Date.now();
    const hoursRemaining = (sessionStartTime - nowTime) / (1000 * 60 * 60);

    const isEligibleForRefund = hoursRemaining >= cancellationWindowHours && booking.credits_deducted > 0;

    if (isEligibleForRefund) {
      // Execute atomic refund procedure: refunds user_pack and writes cancellation_refund to credit_ledger
      await admin.rpc("refund_credits_for_cancellation", {
        p_booking_id: bookingId,
        p_reason: reason,
        p_actor_id: user.id,
      });

      return NextResponse.json({
        success: true,
        refunded: true,
        message: `Booking cancelled successfully. 1 class credit has been refunded to your pack (cancelled ${hoursRemaining.toFixed(1)}h prior).`,
      });
    } else {
      // Late cancellation: update booking status without credit refund
      await admin
        .from("bookings")
        .update({
          status: "cancelled",
          cancellation_reason: `${reason} (Late cancellation within ${cancellationWindowHours}h window)`,
          cancelled_at: new Date().toISOString(),
        })
        .eq("id", bookingId);

      return NextResponse.json({
        success: true,
        refunded: false,
        message: `Booking cancelled. As this cancellation is within the ${cancellationWindowHours}-hour policy window, the credit is forfeited.`,
      });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to cancel booking." }, { status: 500 });
  }
}
