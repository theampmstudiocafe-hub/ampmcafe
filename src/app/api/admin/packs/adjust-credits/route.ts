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

    // Enforce Amendment 6: Front Desk Capped at max +/- 2 credits
    if (staff_role === "front_desk") {
      if (Math.abs(deltaNum) > 2) {
        return NextResponse.json(
          {
            success: false,
            error: `Front desk staff adjustments are strictly capped at maximum ±2 credits (attempted: ${deltaNum > 0 ? "+" : ""}${deltaNum}). Adjustments exceeding 2 credits require Manager or Owner authorization.`,
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

    console.log("[CREDIT LEDGER ENTRY]", ledgerEntry);
    console.log("[AUDIT LOG]", auditEntry);

    return NextResponse.json({
      success: true,
      member_id,
      credit_delta: deltaNum,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
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
