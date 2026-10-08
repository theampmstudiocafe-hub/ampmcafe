import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const admin = createAdminClient();

    // 1. Fetch upcoming bookings
    const { data: bookings } = await admin
      .from("bookings")
      .select(`
        id,
        booking_type,
        status,
        is_trial,
        credits_deducted,
        created_at,
        class_sessions (
          id,
          room,
          start_time,
          end_time,
          class_types (name, duration_minutes, color_hex),
          trainers (name, slug)
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // 2. Fetch active packs
    const { data: userPacks } = await admin
      .from("user_packs")
      .select(`
        id,
        initial_credits,
        remaining_credits,
        expires_at,
        status,
        pack_types (name, validity_days, price_inr)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // 3. Fetch credit ledger records
    const { data: ledgerEntries } = await admin
      .from("credit_ledger")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    // 4. Check trial usage
    const { data: trial } = await admin
      .from("trial_usage")
      .select("id, is_flagged_duplicate, is_revoked")
      .eq("user_id", user.id)
      .maybeSingle();

    const hasUsedTrial = Boolean(trial && !trial.is_revoked);
    const totalCredits = userPacks?.reduce((acc, p) => p.status === "active" ? acc + p.remaining_credits : acc, 0) || 0;

    return NextResponse.json({
      success: true,
      data: {
        bookings: bookings || [],
        userPacks: userPacks || [],
        ledgerEntries: ledgerEntries || [],
        hasUsedTrial,
        totalCredits,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to load member records" }, { status: 500 });
  }
}
