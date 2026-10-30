import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    try {
      const supabase = await createServerClient();
      await supabase.auth.signOut();
    } catch {}

    const response = NextResponse.json({ success: true, message: "Logged out successfully" });
    response.cookies.delete("ampm_session_user");
    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to log out" }, { status: 500 });
  }
}
