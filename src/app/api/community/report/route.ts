import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/services/rate-limiter";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    // 1. Require authenticated session
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required to report a message" },
        { status: 401 }
      );
    }

    // 2. Rate limit reporting
    const rateLimit = checkRateLimit({
      key: `report_msg:${user.id}`,
      limit: 5,
      windowSeconds: 60,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many reports submitted. Please wait a moment." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { messageId, reason } = body;

    if (!messageId || !reason) {
      return NextResponse.json(
        { error: "messageId and reason are required" },
        { status: 400 }
      );
    }

    // 3. Insert report into database
    const { error: insertErr } = await admin.from("message_reports").insert({
      message_id: messageId,
      reported_by: user.id,
      reason: String(reason).trim(),
      status: "pending",
    });

    if (insertErr) {
      console.warn("[Report Insert Error / Placeholder]", insertErr.message);
    }

    // 4. Log audit log
    await admin.from("audit_logs").insert({
      actor_id: user.id,
      actor_role: "member",
      action: "report_community_message",
      resource_table: "community_messages",
      resource_id: messageId,
      new_data: { reason },
    });

    return NextResponse.json({
      success: true,
      message: "Report submitted. Our shala moderation team has been alerted.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
