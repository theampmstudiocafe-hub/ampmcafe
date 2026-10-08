import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/services/rate-limiter";

const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid credentials" },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Rate limiting: 5 attempts per 10 minutes per email
    const loginLimit = checkRateLimit({
      key: `login_attempt_${normalizedEmail}`,
      limit: 5,
      windowSeconds: 600,
    });

    if (!loginLimit.success) {
      return NextResponse.json(
        { error: "Too many failed login attempts. Please wait 10 minutes before retrying." },
        { status: 429 }
      );
    }

    const supabase = await createServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error || !data.user) {
      return NextResponse.json(
        { error: "Invalid email or password. Please check your credentials." },
        { status: 401 }
      );
    }

    // Fetch user profile and roles
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, display_name, phone, whatsapp_opt_in, is_banned, muted_until")
      .eq("id", data.user.id)
      .single();

    if (profile?.is_banned) {
      // Invalidate session if banned
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: "This account has been suspended. Please contact studio administration." },
        { status: 403 }
      );
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id);

    const userRoles = roles?.map((r) => r.role) || ["member"];
    const primaryRole = userRoles.includes("owner")
      ? "owner"
      : userRoles.includes("admin")
      ? "admin"
      : userRoles.includes("manager")
      ? "manager"
      : userRoles.includes("front_desk")
      ? "front_desk"
      : userRoles.includes("trainer")
      ? "trainer"
      : "member";

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        fullName: profile?.full_name || "Member",
        displayName: profile?.display_name || "Member",
        role: primaryRole,
        roles: userRoles,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "An unexpected error occurred during login" },
      { status: 500 }
    );
  }
}
