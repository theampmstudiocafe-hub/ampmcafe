import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { OtpService } from "@/lib/services/otp-service";
import { notificationService } from "@/lib/providers/notification";
import { checkRateLimit } from "@/lib/services/rate-limiter";

const SendOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
  purpose: z.enum(["signup", "recovery"]).default("signup"),
  metadata: z.record(z.any()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const body = await req.json();
    const parsed = SendOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid payload" },
        { status: 400 }
      );
    }

    const { email, purpose, metadata } = parsed.data;

    // Rate limiting: max 5 OTP requests per IP per 15 minutes
    const ipLimit = checkRateLimit({
      key: `otp_ip_${ip}`,
      limit: 5,
      windowSeconds: 900,
    });

    if (!ipLimit.success) {
      return NextResponse.json(
        { error: "Too many requests from this network. Please try again later." },
        { status: 429 }
      );
    }

    // Generate OTP & enforce per-email 60s cooldown
    const { otp, cooldownSeconds } = OtpService.createOtp(email, purpose, metadata);

    // Send through Email Provider (Custom SMTP on verified client domain)
    const sendResult = await notificationService.send({
      recipientEmail: email,
      template: "otp_verification",
      variables: {
        otp,
        purpose,
      },
    });

    if (!sendResult.success) {
      return NextResponse.json(
        { error: sendResult.error || "Failed to deliver verification code." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `A 6-digit verification code has been sent to ${email}`,
      cooldownSeconds,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "An unexpected error occurred" },
      { status: 400 }
    );
  }
}
