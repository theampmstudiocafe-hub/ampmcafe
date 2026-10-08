import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { OtpService } from "@/lib/services/otp-service";
import { createAdminClient } from "@/lib/supabase/admin";

const ResetPasswordSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, "Code must be 6 digits"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ResetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid payload" },
        { status: 400 }
      );
    }

    const { email, otp, newPassword } = parsed.data;

    // 1. Verify single-use OTP
    const verifyResult = OtpService.verifyOtp(email, otp, "recovery");
    if (!verifyResult.valid) {
      return NextResponse.json(
        { error: verifyResult.error || "Invalid or expired recovery code" },
        { status: 400 }
      );
    }

    // 2. Find user in Supabase Auth
    const adminClient = createAdminClient();
    const { data: userList } = await adminClient.auth.admin.listUsers();
    const targetUser = userList?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (!targetUser) {
      return NextResponse.json(
        { error: "No account found matching this email address." },
        { status: 404 }
      );
    }

    // 3. Update password and invalidate all prior sessions
    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      targetUser.id,
      { password: newPassword }
    );

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || "Failed to update password." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Your password has been reset successfully. Please log in with your new credentials.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "An unexpected error occurred during password reset" },
      { status: 500 }
    );
  }
}
