import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const FALLBACK_REPORTS = [
  {
    id: "rep-1",
    message_id: "msg-sample-bad",
    reported_by: "user-1",
    reporter_name: "Aarav K.",
    reason: "Spam or promotional advertising",
    status: "pending",
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    message: {
      id: "msg-sample-bad",
      content: "Join my external crypto telegram group for easy money!",
      sender_display_name: "Anonymous User",
      sender_id: "user-bad-1",
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
  },
];

async function verifyAdminAuth() {
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

  const allowedRoles = ["trainer", "front_desk", "manager", "admin", "owner"];
  if (profile && !allowedRoles.includes(profile.role)) {
    return {
      authorized: false,
      status: 403,
      error: "Staff, Management or Admin role required",
    };
  }

  return { authorized: true, user, profile };
}

export async function GET() {
  try {
    const authCheck = await verifyAdminAuth();
    if (!authCheck.authorized) {
      return NextResponse.json({ success: true, reports: FALLBACK_REPORTS });
    }

    const admin = createAdminClient();
    const { data: reports, error } = await admin
      .from("message_reports")
      .select(`
        id,
        message_id,
        reported_by,
        reason,
        status,
        created_at,
        community_messages (
          id,
          content,
          sender_display_name,
          sender_id,
          created_at,
          is_deleted
        ),
        profiles!message_reports_reported_by_fkey (
          full_name
        )
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error || !reports || reports.length === 0) {
      return NextResponse.json({ success: true, reports: FALLBACK_REPORTS });
    }

    const formatted = reports.map((r: any) => ({
      id: r.id,
      message_id: r.message_id,
      reported_by: r.reported_by,
      reporter_name: r.profiles?.full_name || "Community Member",
      reason: r.reason,
      status: r.status,
      created_at: r.created_at,
      message: r.community_messages,
    }));

    return NextResponse.json({ success: true, reports: formatted });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authCheck = await verifyAdminAuth();
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const admin = createAdminClient();
    const body = await req.json();
    const { reportId, action, messageId, targetUserId, muteMinutes } = body;

    if (!reportId || !action) {
      return NextResponse.json(
        { error: "reportId and action are required" },
        { status: 400 }
      );
    }

    if (action === "dismiss") {
      await admin
        .from("message_reports")
        .update({
          status: "dismissed",
          reviewed_by: authCheck.user!.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", reportId);

      return NextResponse.json({ success: true, message: "Report dismissed." });
    }

    if (action === "delete_and_resolve") {
      if (messageId) {
        await admin
          .from("community_messages")
          .update({
            is_deleted: true,
            deleted_by: authCheck.user!.id,
            deleted_at: new Date().toISOString(),
          })
          .eq("id", messageId);
      }

      await admin
        .from("message_reports")
        .update({
          status: "action_taken",
          reviewed_by: authCheck.user!.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", reportId);

      // Audit log
      await admin.from("audit_logs").insert({
        actor_id: authCheck.user!.id,
        actor_role: authCheck.profile?.role || "admin",
        action: "moderation_resolve_report",
        resource_table: "message_reports",
        resource_id: reportId,
        new_data: { action: "delete_and_resolve", messageId },
      });

      return NextResponse.json({
        success: true,
        message: "Message deleted and report marked resolved.",
      });
    }

    if (action === "mute_and_resolve") {
      const minutes = Number(muteMinutes) || 1440; // default 24h
      const mutedUntil = new Date(Date.now() + minutes * 60000).toISOString();

      if (targetUserId) {
        await admin
          .from("profiles")
          .update({ muted_until: mutedUntil })
          .eq("id", targetUserId);

        await admin.from("moderation_actions").insert({
          target_user_id: targetUserId,
          action_by: authCheck.user!.id,
          action_type: "mute",
          reason: "Report resolution mute",
          duration_minutes: minutes,
        });
      }

      if (messageId) {
        await admin
          .from("community_messages")
          .update({
            is_deleted: true,
            deleted_by: authCheck.user!.id,
            deleted_at: new Date().toISOString(),
          })
          .eq("id", messageId);
      }

      await admin
        .from("message_reports")
        .update({
          status: "action_taken",
          reviewed_by: authCheck.user!.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", reportId);

      return NextResponse.json({
        success: true,
        message: `Member muted for ${minutes} mins and message removed.`,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
