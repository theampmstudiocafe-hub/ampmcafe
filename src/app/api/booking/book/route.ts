import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { TrialAbuseService } from "@/lib/services/trial-abuse-service";
import { EntitlementService } from "@/lib/services/entitlement-service";
import { notificationService } from "@/lib/providers/notification";

const BookSessionSchema = z.object({
  sessionId: z.string().uuid(),
  paymentOption: z.enum(["trial", "pack_credit"]),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required to book a spot." }, { status: 401 });
    }

    const body = await req.json();
    const parsed = BookSessionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid payload" },
        { status: 400 }
      );
    }

    const { sessionId, paymentOption } = parsed.data;
    const admin = createAdminClient();

    // 1. Fetch user profile
    const { data: profile } = await admin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Member profile not found." }, { status: 404 });
    }

    if (profile.is_banned) {
      return NextResponse.json({ error: "Account suspended from booking." }, { status: 403 });
    }

    // 2. Fetch session details
    const { data: session, error: sessError } = await admin
      .from("class_sessions")
      .select(`
        id,
        room,
        start_time,
        end_time,
        capacity,
        status,
        class_types!inner (id, name, duration_minutes),
        trainers!inner (id, name)
      `)
      .eq("id", sessionId)
      .single();

    if (sessError || !session) {
      return NextResponse.json({ error: "Class session not found." }, { status: 404 });
    }

    if (session.status === "cancelled") {
      return NextResponse.json({ error: "This session has been cancelled." }, { status: 400 });
    }

    // Check capacity
    const { count: bookedCount } = await admin
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("session_id", sessionId)
      .eq("status", "confirmed");

    if ((bookedCount || 0) >= session.capacity) {
      return NextResponse.json(
        { error: "This session is currently full. Please choose another slot or join the waitlist." },
        { status: 409 }
      );
    }

    // Check if user is already booked in this session
    const { data: existingBooking } = await admin
      .from("bookings")
      .select("id")
      .eq("session_id", sessionId)
      .eq("user_id", user.id)
      .eq("status", "confirmed")
      .maybeSingle();

    if (existingBooking) {
      return NextResponse.json(
        { error: "You are already booked for this class session." },
        { status: 400 }
      );
    }

    let bookingId = "";

    // 3. TRIAL FLOW
    if (paymentOption === "trial") {
      // Fetch historical trials to check duplicates
      const { data: allTrials } = await admin
        .from("trial_usage")
        .select("user_id, normalized_email, normalized_name, phone_hash, is_revoked");

      const checkResult = TrialAbuseService.evaluateTrial(
        {
          userId: user.id,
          email: profile.email,
          fullName: profile.full_name,
          phone: profile.phone,
        },
        allTrials || []
      );

      if (checkResult.isDuplicate) {
        return NextResponse.json(
          { error: checkResult.reason || "You have already used your complimentary free trial class." },
          { status: 400 }
        );
      }

      // Create trial booking
      const { data: newBooking, error: bookError } = await admin
        .from("bookings")
        .insert({
          user_id: user.id,
          booking_type: "class_session",
          session_id: sessionId,
          status: "confirmed",
          is_trial: true,
          credits_deducted: 0,
        })
        .select("id")
        .single();

      if (bookError || !newBooking) {
        return NextResponse.json({ error: "Failed to create trial booking." }, { status: 500 });
      }

      bookingId = newBooking.id;

      // Record trial usage with duplicate flags if suspected
      await admin.from("trial_usage").insert({
        user_id: user.id,
        booking_id: bookingId,
        phone_hash: checkResult.phoneHash,
        normalized_email: checkResult.normalizedEmail,
        normalized_name: checkResult.normalizedName,
        is_flagged_duplicate: checkResult.isFlagged,
        flag_reason: checkResult.reason || null,
      });
    }

    // 4. PACK CREDIT FLOW
    if (paymentOption === "pack_credit") {
      const { data: userPacks } = await admin
        .from("user_packs")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active");

      const classTypeId = (session.class_types as any).id;
      const entitlement = EntitlementService.evaluateBookingEligibility({
        userId: user.id,
        classTypeId,
        hasUsedTrial: true,
        userPacks: userPacks || [],
      });

      if (!entitlement.hasActiveCredits || !entitlement.activePack) {
        return NextResponse.json(
          { error: "You do not have any active class credits. Please purchase a class pack." },
          { status: 402 }
        );
      }

      // Call stored procedure to atomically deduct credit and record in credit_ledger
      const { data: rpcBookingId, error: rpcError } = await admin.rpc("deduct_credits_for_booking", {
        p_user_id: user.id,
        p_session_id: sessionId,
        p_user_pack_id: entitlement.activePack.id,
      });

      if (rpcError || !rpcBookingId) {
        console.error("[Booking RPC Error]", rpcError);
        return NextResponse.json(
          { error: rpcError?.message || "Failed to deduct credits for booking." },
          { status: 500 }
        );
      }

      bookingId = rpcBookingId;
    }

    // 5. Send confirmation notification (Email + WhatsApp fallback if opted in)
    const formattedDate = new Date(session.start_time).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const className = (session.class_types as any)?.name || "Yoga Session";
    const trainerName = (session.trainers as any)?.name || "Instructor";

    await notificationService.send({
      recipientUserId: user.id,
      recipientEmail: profile.email,
      recipientPhone: profile.phone || undefined,
      template: "booking_confirmed",
      variables: {
        className,
        trainerName,
        sessionTime: formattedDate,
        room: session.room,
      },
      allowWhatsAppFallbackToEmail: true,
    });

    return NextResponse.json({
      success: true,
      message: `Your spot in ${className} is confirmed!`,
      bookingId,
      sessionDetails: {
        className,
        trainerName,
        formattedDate,
        room: session.room,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to process booking" }, { status: 500 });
  }
}
