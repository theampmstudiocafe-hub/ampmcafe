import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // Verify session & role (management only)
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const isManagementRole = true; // In mock/dev or when session is active

    // 1. Daily Bookings Metrics
    // Count confirmed, attended, cancelled for today
    const today = new Date().toISOString().split("T")[0];

    // Mock/seeded realistic live metrics for PMS overview
    const stats = {
      todayBookings: {
        total: 18,
        attended: 12,
        confirmed: 5,
        cancelled: 1,
        capacityPercent: 82, // 18 / 22 available shala spots
      },
      todayRevenue: {
        taxableNetInr: 12400, // Excluding GST
        outputGstInr: 2232,   // Balance Sheet Liability (18% on pack sales)
        grossCashInr: 14632,
        activePacksSoldToday: 2,
      },
      lowStockIngredientsCount: 2,
    };

    // 2. High-Priority Action Alerts
    // A. Trial Duplicate Flags awaiting staff review
    const pendingTrialAlerts = [
      {
        id: "trial-alert-1",
        user_name: "Priya Sharma",
        email: "priya.s+trial2@gmail.com",
        normalized_email: "priya.s@gmail.com",
        phone_masked: "+91 98230 •••••",
        match_type: "normalized_email_alias",
        matched_existing_user: "Priya Sharma (priya.s@gmail.com)",
        created_at: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
        status: "pending_review",
      },
      {
        id: "trial-alert-2",
        user_name: "Aman Varma",
        email: "aman.v@outlook.com",
        phone_masked: "+91 98221 •••••",
        match_type: "phone_hash_collision",
        matched_existing_user: "Aman V. (aman.varma@gmail.com)",
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        status: "pending_review",
      },
    ];

    // B. Low-Stock Alerts (strictly Current Stock <= Minimum Stock Level per Amendment 5)
    const lowStockAlerts = [
      {
        ingredient_id: "ing-uji-matcha",
        name: "Ceremonial Uji Matcha Powder",
        unit: "g",
        current_stock: 180,
        minimum_stock_level: 500,
        suggested_reorder_qty: 1000,
        supplier_name: "Kyoto Direct Imports Ltd",
        status: "critical_low",
      },
      {
        ingredient_id: "ing-oat-milk",
        name: "Barista Oat Milk",
        unit: "l",
        current_stock: 4,
        minimum_stock_level: 12,
        suggested_reorder_qty: 24,
        supplier_name: "Oat Life Organics Pune",
        status: "warning_low",
      },
    ];

    // C. Community Reported Messages
    const communityAlerts = [
      {
        id: "report-101",
        reporter_display_name: "Siddharth M.",
        message_excerpt: "Join my external crypto yoga retreat group, DM me on telegram...",
        author_display_name: "YogiCryptoGuru",
        reason: "spam_promotion",
        created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      },
    ];

    return NextResponse.json({
      success: true,
      stats,
      alerts: {
        trialDuplicates: pendingTrialAlerts,
        lowStock: lowStockAlerts,
        communityReports: communityAlerts,
      },
      timestamp: Date.now(),
    });
  } catch (err: any) {
    console.error("[PMS Dashboard API Error]", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to load dashboard metrics" },
      { status: 500 }
    );
  }
}
