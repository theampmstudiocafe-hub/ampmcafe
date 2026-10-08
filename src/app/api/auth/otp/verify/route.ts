import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { OtpService } from "@/lib/services/otp-service";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";

const VerifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, "Code must be 6 digits"),
  purpose: z.enum(["signup", "recovery"]).default("signup"),
  fullName: z.string().min(2, "Name must be at least 2 characters").optional(),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  phone: z.string().optional(),
  whatsappOptIn: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = VerifyOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { email, otp, purpose, fullName, password, phone, whatsappOptIn } = parsed.data;

    // 1. Verify OTP code & single-use consumption
    const verifyResult = OtpService.verifyOtp(email, otp, purpose);
    if (!verifyResult.valid) {
      return NextResponse.json(
        { error: verifyResult.error || "Invalid verification code" },
        { status: 400 }
      );
    }

    // 2. Handle Signup Flow
    if (purpose === "signup") {
      if (!fullName || !password) {
        return NextResponse.json(
          { error: "Full name and password are required for account creation" },
          { status: 400 }
        );
      }

      const adminClient = createAdminClient();

      // Check if user already exists
      const { data: existingUser } = await adminClient.auth.admin.listUsers();
      const userExists = existingUser?.users?.some((u) => u.email?.toLowerCase() === email.toLowerCase());

      if (userExists) {
        return NextResponse.json(
          { error: "An account with this email already exists. Please log in." },
          { status: 400 }
        );
      }

      // Create confirmed user in Supabase Auth
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
        },
      });

      if (authError || !authData.user) {
        return NextResponse.json(
          { error: authError?.message || "Failed to create user account" },
          { status: 500 }
        );
      }

      const userId = authData.user.id;
      const firstName = fullName.trim().split(" ")[0] || "Member";
      const safeDisplayName = `${firstName}_${Math.random().toString(36).substring(2, 6)}`;

      // Clean phone if provided
      const cleanPhone = phone ? phone.replace(/\D/g, "") : null;

      // Insert Profile record (isolated PII)
      const { error: profileError } = await adminClient.from("profiles").insert({
        id: userId,
        full_name: fullName,
        display_name: safeDisplayName,
        email: email.toLowerCase(),
        phone: cleanPhone,
        whatsapp_opt_in: Boolean(whatsappOptIn),
      });

      if (profileError) {
        console.error("[Profile Creation Error]", profileError);
      }

      // Assign default 'member' role (or 'admin' if first seed email)
      const isInitialAdmin =
        email.toLowerCase() === "admin@theampmstudio.com" ||
        email.toLowerCase() === "admin@pranapune.com";
      const roleToAssign = isInitialAdmin ? "admin" : "member";

      await adminClient.from("user_roles").insert({
        user_id: userId,
        role: roleToAssign,
      });

      // Sign the user in via server client to set HTTP-only session cookies
      const serverClient = await createServerClient();
      const { error: signInError } = await serverClient.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.warn("[Auto-Login Warning]", signInError.message);
      }

      return NextResponse.json({
        success: true,
        message: "Account verified and created successfully",
        user: {
          id: userId,
          email,
          fullName,
          displayName: safeDisplayName,
          role: roleToAssign,
        },
      });
    }

    // 3. Handle Recovery Flow (OTP validated)
    return NextResponse.json({
      success: true,
      message: "Code verified. You may now set a new password.",
      email,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "An error occurred during verification" },
      { status: 500 }
    );
  }
}
