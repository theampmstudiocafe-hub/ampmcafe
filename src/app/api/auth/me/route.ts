import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, display_name, email, phone, whatsapp_opt_in, avatar_url, is_banned, muted_until")
      .eq("id", user.id)
      .single();

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const roleList = roles?.map((r) => r.role) || ["member"];
    const primaryRole = roleList.includes("owner")
      ? "owner"
      : roleList.includes("admin")
      ? "admin"
      : roleList.includes("manager")
      ? "manager"
      : roleList.includes("front_desk")
      ? "front_desk"
      : roleList.includes("trainer")
      ? "trainer"
      : "member";

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: profile?.full_name || "Member",
        displayName: profile?.display_name || "Member",
        phone: profile?.phone || null,
        whatsappOptIn: Boolean(profile?.whatsapp_opt_in),
        isBanned: Boolean(profile?.is_banned),
        role: primaryRole,
        roles: roleList,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
