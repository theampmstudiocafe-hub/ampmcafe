import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Seeded/realistic audit log records of staff overrides and adjustments
    const auditLogs = [
      {
        id: "adj-01",
        type: "credit_adjustment",
        timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
        staff_actor: "Front Desk (Rhea M.)",
        staff_role: "front_desk",
        member_name: "Priya Sharma",
        member_id: "mem-01",
        delta: "+1",
        reason: "Studio AC failure in morning Vinyasa session (goodwill credit)",
        balance_after: 7,
      },
      {
        id: "adj-02",
        type: "cancellation_override",
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        staff_actor: "Front Desk (Rhea M.)",
        staff_role: "front_desk",
        member_name: "Aarav Kapoor",
        member_id: "mem-02",
        delta: "+1",
        reason: "Verified medical certificate from Sahyadri Hospital",
        balance_after: 15,
      },
      {
        id: "adj-03",
        type: "credit_adjustment",
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        staff_actor: "Studio Manager (Vikram)",
        staff_role: "manager",
        member_name: "Rohan Verma",
        member_id: "mem-04",
        delta: "+3",
        reason: "Annual membership renewal promotional bonus approved by Owner",
        balance_after: 4,
      },
      {
        id: "adj-04",
        type: "credit_adjustment",
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        staff_actor: "Front Desk (Rhea M.)",
        staff_role: "front_desk",
        member_name: "Priya Sharma",
        member_id: "mem-01",
        delta: "+1",
        reason: "Sound bath session ambient noise disruption complaint",
        balance_after: 8,
      },
    ];

    // Compute repeat adjustment counts per member (Fix 2)
    const memberAdjustmentCounts: Record<string, number> = {};
    auditLogs.forEach((log) => {
      memberAdjustmentCounts[log.member_id] = (memberAdjustmentCounts[log.member_id] || 0) + 1;
    });

    // Attach repeat flag to audit records
    const processedLogs = auditLogs.map((log) => {
      const count = memberAdjustmentCounts[log.member_id] || 1;
      const isRepeat = count > 1;
      return {
        ...log,
        is_repeat: isRepeat,
        repeat_count: count,
        repeat_warning: isRepeat
          ? `Repeat Adjustment Alert: Member ${log.member_name} has received ${count} staff adjustments. Review for potential policy abuse.`
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      report_title: "Owner Audit: Staff Overrides & Credit Adjustments",
      total_records: processedLogs.length,
      repeat_flagged_count: processedLogs.filter((r) => r.is_repeat).length,
      audit_records: processedLogs,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to load audit report" },
      { status: 500 }
    );
  }
}
