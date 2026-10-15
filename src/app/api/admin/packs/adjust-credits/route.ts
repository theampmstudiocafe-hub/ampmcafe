import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      member_id,
      member_name,
      credit_delta, // e.g. +2, -1
      reason,
      staff_role = "front_desk", // in production, verified from session
      staff_name = "Front Desk Staff",
    } = body;

    if (!member_id || credit_delta === undefined || credit_delta === 0) {
      return NextResponse.json(
        { success: false, error: "Member ID and non-zero credit delta are required." },
        { status: 400 }
      );
    }

    const deltaNum = Number(credit_delta);

    // Track daily cumulative adjustments for front_desk per member (Fix 2)
    // Key: `${member_id}_${date}` -> total absolute credits adjusted today
    const today = new Date().toISOString().split("T")[0];
    const todayKey = `${member_id}_${today}`;

    // Seeded history / state tracker
    if (!(globalThis as any).__ampm_frontdesk_daily_adj) {
      (globalThis as any).__ampm_frontdesk_daily_adj = new Map<string, number>();
      // Seed Priya Sharma with 1 credit adjustment already made today to allow testing repeat behavior
      (globalThis as any).__ampm_frontdesk_daily_adj.set(`mem-01_${today}`, 1);
    }
    const dailyTracker: Map<string, number> = (globalThis as any).__ampm_frontdesk_daily_adj;

    // Enforce Fix 2: Front Desk Cumulative Daily Cap per Member
    if (staff_role === "front_desk") {
      const currentToday = dailyTracker.get(todayKey) || 0;
      const proposedTotal = currentToday + Math.abs(deltaNum);

      if (proposedTotal > 2) {
        return NextResponse.json(
          {
            success: false,
            error: `Front desk daily cumulative adjustment cap exceeded: Front desk is strictly capped at a maximum of ±2 credits per member per calendar day (Fix 2). Member has already received ${currentToday} credit adjustment(s) today (attempted: ${deltaNum > 0 ? "+" : ""}${deltaNum}, proposed daily total: ${proposedTotal}). Cumulative adjustments exceeding 2 credits/day require Manager or Owner authorization.`,
            current_today_credits: currentToday,
            attempted_credits: deltaNum,
            daily_cap: 2,
          },
          { status: 403 }
        );
      }
    }

    // Enforce mandatory reason
    if (!reason || typeof reason !== "string" || reason.trim().length < 5) {
      return NextResponse.json(
        {
          success: false,
          error: "A mandatory adjustment reason (minimum 5 characters) is required for audit compliance.",
        },
        { status: 400 }
      );
    }

    // Simulated before and after balance
    const balanceBefore = 4;
    const balanceAfter = Math.max(0, balanceBefore + deltaNum);

    const ledgerEntry = {
      id: crypto.randomUUID(),
      member_id,
      entry_type: "admin_adjustment",
      credits: deltaNum,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      reason: reason.trim(),
      created_by: staff_name,
      staff_role,
      created_at: new Date().toISOString(),
    };

    const auditEntry = {
      id: crypto.randomUUID(),
      action: "manual_credit_adjustment",
      actor_name: staff_name,
      actor_role: staff_role,
      target_member: member_name || member_id,
      credit_delta: deltaNum,
      reason: reason.trim(),
      balance_after: balanceAfter,
      timestamp: new Date().toISOString(),
    };

    // Commit cumulative daily count if front_desk
    if (staff_role === "front_desk") {
      const currentToday = dailyTracker.get(todayKey) || 0;
      dailyTracker.set(todayKey, currentToday + Math.abs(deltaNum));
    }

    console.log("[CREDIT LEDGER ENTRY]", ledgerEntry);
    console.log("[AUDIT LOG]", auditEntry);

    return NextResponse.json({
      success: true,
      member_id,
      credit_delta: deltaNum,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      cumulative_daily_total: staff_role === "front_desk" ? dailyTracker.get(todayKey) : undefined,
      daily_cap: staff_role === "front_desk" ? 2 : "unlimited",
      reason: reason.trim(),
      ledger_entry: ledgerEntry,
      audit_entry: auditEntry,
      message: `Successfully adjusted ${deltaNum > 0 ? "+" : ""}${deltaNum} credit(s). New balance: ${balanceAfter}.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to adjust credits" },
      { status: 500 }
    );
  }
}
