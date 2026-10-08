import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const admin = createAdminClient();
    const { data: packs, error } = await admin
      .from("pack_types")
      .select("*")
      .eq("active", true)
      .order("display_order", { ascending: true });

    if (error) {
      return NextResponse.json({ error: "Failed to fetch pack types" }, { status: 500 });
    }

    return NextResponse.json({ success: true, packs: packs || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
