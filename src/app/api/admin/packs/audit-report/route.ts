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
    ];

    return NextResponse.json({
      success: true,
      report_title: "Owner Audit: Staff Overrides & Credit Adjustments",
      audit_records: auditLogs,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to load audit report" },
      { status: 500 }
    );
  }
}
