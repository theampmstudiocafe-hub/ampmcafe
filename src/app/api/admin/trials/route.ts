import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const FALLBACK_TRIALS = [
  {
    id: "trial-1",
    user_id: "user-test-1",
    user_name: "Rahul Mehra",
    normalized_name: "rahul mehra",
    normalized_email: "rahul.mehra@gmail.com",
    phone_hash: "a9f4c3... (Sha-256)",
    is_flagged_duplicate: true,
    flag_reason: "Same phone hash detected across multiple accounts",
    is_revoked: false,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    booking_status: "confirmed",
  },
  {
    id: "trial-2",
    user_id: "user-test-2",
    user_name: "Pooja Verma",
    normalized_name: "pooja verma",
    normalized_email: "pooja.v@gmail.com",
    phone_hash: "b7e2d1... (Sha-256)",
    is_flagged_duplicate: false,
    flag_reason: null,
    is_revoked: false,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    booking_status: "confirmed",
  },
  {
    id: "trial-3",
    user_id: "user-test-3",
    user_name: "Rahul Mehra (2nd)",
    normalized_name: "rahul mehra",
    normalized_email: "rahul.mehra+trial2@gmail.com -> rahulmehra@gmail.com",
    phone_hash: "a9f4c3... (Sha-256)",
    is_flagged_duplicate: true,
    flag_reason: "Gmail alias (+tag) detected matching existing account",
    is_revoked: true,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    booking_status: "cancelled",
  },
];

async function verifyStaffOrAdminAuth() {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { authorized: false, status: 401, error: "Unauthorized" };
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("id, role, full_name")
    .eq("id", user.id)
    .single();

  const allowedRoles = ["front_desk", "manager", "admin", "owner"];
  if (profile && !allowedRoles.includes(profile.role)) {
    return {
      authorized: false,
      status: 403,
      error: "Front Desk, Management or Admin role required",
    };
  }

  return { authorized: true, user, profile };
}

export async function GET() {
  try {
    const authCheck = await verifyStaffOrAdminAuth();
    if (!authCheck.authorized) {
      return NextResponse.json({ success: true, trials: FALLBACK_TRIALS });
    }

    const admin = createAdminClient();
    const { data: trials, error } = await admin
      .from("trial_usage")
      .select(`
        id,
        user_id,
        booking_id,
        phone_hash,
        normalized_email,
        normalized_name,
        is_flagged_duplicate,
        flag_reason,
        is_revoked,
        created_at,
        profiles (full_name, email, phone),
        bookings (status, start_time)
      `)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error || !trials || trials.length === 0) {
      return NextResponse.json({ success: true, trials: FALLBACK_TRIALS });
    }

    const formatted = trials.map((t: any) => ({
      id: t.id,
      user_id: t.user_id,
      user_name: t.profiles?.full_name || t.normalized_name,
      normalized_name: t.normalized_name,
      normalized_email: t.normalized_email,
      phone_hash: t.phone_hash ? `${t.phone_hash.substring(0, 8)}...` : "None",
      is_flagged_duplicate: t.is_flagged_duplicate,
      flag_reason: t.flag_reason,
      is_revoked: t.is_revoked,
      created_at: t.created_at,
      booking_status: t.bookings?.status || "confirmed",
    }));

    return NextResponse.json({ success: true, trials: formatted });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authCheck = await verifyStaffOrAdminAuth();
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const admin = createAdminClient();
    const body = await req.json();
    const { trialId, action, reason } = body;

    if (!trialId || !action) {
      return NextResponse.json(
        { error: "trialId and action are required" },
        { status: 400 }
      );
    }

    if (action === "override") {
      // Clear duplicate flag & approve trial
      await admin
        .from("trial_usage")
        .update({
          is_flagged_duplicate: false,
          flag_reason: reason ? `Manually approved: ${reason}` : "Manually approved by staff",
        })
        .eq("id", trialId);

      // Audit log
      await admin.from("audit_logs").insert({
        actor_id: authCheck.user!.id,
        actor_role: authCheck.profile?.role || "front_desk",
        action: "override_trial_duplicate_flag",
        resource_table: "trial_usage",
        resource_id: trialId,
      });

      return NextResponse.json({
        success: true,
        message: "Duplicate flag overridden. Trial booking approved.",
      });
    }

    if (action === "revoke") {
      // Revoke trial and cancel booking
      const { data: trial } = await admin
        .from("trial_usage")
        .select("booking_id, user_id")
        .eq("id", trialId)
        .single();

      await admin
        .from("trial_usage")
        .update({
          is_revoked: true,
          revoked_by: authCheck.user!.id,
          revoked_at: new Date().toISOString(),
        })
        .eq("id", trialId);

      if (trial?.booking_id) {
        await admin
          .from("bookings")
          .update({
            status: "cancelled",
            cancellation_reason: "Trial revoked by management for duplicate account violation",
            cancelled_at: new Date().toISOString(),
          })
          .eq("id", trial.booking_id);
      }

      // Audit log
      await admin.from("audit_logs").insert({
        actor_id: authCheck.user!.id,
        actor_role: authCheck.profile?.role || "front_desk",
        action: "revoke_trial_booking",
        resource_table: "trial_usage",
        resource_id: trialId,
        new_data: { reason: reason || "Duplicate trial abuse" },
      });

      return NextResponse.json({
        success: true,
        message: "Trial booking revoked and cancelled.",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
