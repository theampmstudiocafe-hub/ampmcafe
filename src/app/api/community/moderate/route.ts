import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    // 1. Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Verify staff/management/trainer permissions
    const { data: profile } = await admin
      .from("profiles")
      .select("id, full_name, role")
      .eq("id", user.id)
      .single();

    const allowedRoles = ["trainer", "front_desk", "manager", "admin", "owner"];
    if (!profile || !allowedRoles.includes(profile.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions to execute moderation actions" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action, messageId, targetUserId, reason, durationMinutes } = body;

    // ACTION: 1-Click Quick Delete Message
    if (action === "delete") {
      if (!messageId) {
        return NextResponse.json({ error: "messageId required" }, { status: 400 });
      }

      await admin
        .from("community_messages")
        .update({
          is_deleted: true,
          deleted_by: user.id,
          deleted_at: new Date().toISOString(),
        })
        .eq("id", messageId);

      // Resolve pending reports
      await admin
        .from("message_reports")
        .update({
          status: "action_taken",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("message_id", messageId);

      // Audit log
      await admin.from("audit_logs").insert({
        actor_id: user.id,
        actor_role: profile.role,
        action: "delete_community_message",
        resource_table: "community_messages",
        resource_id: messageId,
        new_data: { reason: reason || "1-click moderation delete" },
      });

      return NextResponse.json({
        success: true,
        message: "Message deleted from community chat.",
      });
    }

    // ACTION: Toggle Pin / Unpin
    if (action === "toggle_pin") {
      if (!messageId) {
        return NextResponse.json({ error: "messageId required" }, { status: 400 });
      }

      const { data: currentMsg } = await admin
        .from("community_messages")
        .select("is_pinned")
        .eq("id", messageId)
        .single();

      const newPinned = !currentMsg?.is_pinned;

      await admin
        .from("community_messages")
        .update({ is_pinned: newPinned })
        .eq("id", messageId);

      return NextResponse.json({
        success: true,
        isPinned: newPinned,
        message: newPinned ? "Announcement pinned." : "Announcement unpinned.",
      });
    }

    // ACTION: Mute Member
    if (action === "mute") {
      const minutes = Number(durationMinutes) || 60; // default 1 hour
      const mutedUntil = new Date(Date.now() + minutes * 60000).toISOString();

      let targetId = targetUserId;
      if (!targetId && messageId) {
        const { data: msg } = await admin
          .from("community_messages")
          .select("sender_id")
          .eq("id", messageId)
          .single();
        targetId = msg?.sender_id;
      }

      if (!targetId) {
        return NextResponse.json(
          { error: "Target user could not be identified" },
          { status: 400 }
        );
      }

      await admin
        .from("profiles")
        .update({ muted_until: mutedUntil })
        .eq("id", targetId);

      await admin.from("moderation_actions").insert({
        target_user_id: targetId,
        action_by: user.id,
        action_type: "mute",
        reason: reason || "Temporary mute for community policy violation",
        duration_minutes: minutes,
      });

      return NextResponse.json({
        success: true,
        message: `Member muted for ${minutes} minutes.`,
        mutedUntil,
      });
    }

    // ACTION: Ban Member
    if (action === "ban") {
      let targetId = targetUserId;
      if (!targetId && messageId) {
        const { data: msg } = await admin
          .from("community_messages")
          .select("sender_id")
          .eq("id", messageId)
          .single();
        targetId = msg?.sender_id;
      }

      if (!targetId) {
        return NextResponse.json(
          { error: "Target user could not be identified" },
          { status: 400 }
        );
      }

      await admin.from("profiles").update({ is_banned: true }).eq("id", targetId);

      await admin.from("moderation_actions").insert({
        target_user_id: targetId,
        action_by: user.id,
        action_type: "ban",
        reason: reason || "Permanent ban from community chat",
      });

      return NextResponse.json({
        success: true,
        message: "Member permanently banned from community chat.",
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
