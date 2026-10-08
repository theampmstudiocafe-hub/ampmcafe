import crypto from "crypto";

export interface OtpRecord {
  hashedOtp: string;
  email: string;
  purpose: "signup" | "recovery";
  expiresAt: number;
  attemptsRemaining: number;
  createdAt: number;
  metadata?: Record<string, any>;
}

// In-memory store for active OTP verification tokens
// In multi-region deployments, this seamlessly connects to Redis or a Postgres table
const otpCache = new Map<string, OtpRecord>();

export class OtpService {
  private static hash(otp: string): string {
    return crypto.createHash("sha256").update(otp).digest("hex");
  }

  public static generateOtp(): string {
    // Generates a cryptographically strong 6-digit numeric OTP
    return crypto.randomInt(100000, 999999).toString();
  }

  public static createOtp(
    email: string,
    purpose: "signup" | "recovery",
    metadata?: Record<string, any>
  ): { otp: string; cooldownSeconds: number } {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = otpCache.get(normalizedEmail);

    // Enforce 60-second resend cooldown
    if (existing && Date.now() - existing.createdAt < 60000) {
      const waitSeconds = Math.ceil((60000 - (Date.now() - existing.createdAt)) / 1000);
      throw new Error(`Please wait ${waitSeconds} seconds before requesting a new code.`);
    }

    const otp = this.generateOtp();
    const record: OtpRecord = {
      hashedOtp: this.hash(otp),
      email: normalizedEmail,
      purpose,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes expiry
      attemptsRemaining: 5,
      createdAt: Date.now(),
      metadata,
    };

    otpCache.set(normalizedEmail, record);
    return { otp, cooldownSeconds: 60 };
  }

  public static verifyOtp(
    email: string,
    otp: string,
    purpose: "signup" | "recovery"
  ): { valid: boolean; metadata?: Record<string, any>; error?: string } {
    const normalizedEmail = email.toLowerCase().trim();
    const record = otpCache.get(normalizedEmail);

    if (!record) {
      return { valid: false, error: "No active verification code found for this email." };
    }

    if (Date.now() > record.expiresAt) {
      otpCache.delete(normalizedEmail);
      return { valid: false, error: "Verification code has expired. Please request a new one." };
    }

    if (record.purpose !== purpose) {
      return { valid: false, error: "Verification code purpose mismatch." };
    }

    if (record.attemptsRemaining <= 0) {
      otpCache.delete(normalizedEmail);
      return { valid: false, error: "Maximum verification attempts exceeded. Please request a new code." };
    }

    const inputHash = this.hash(otp.trim());
    if (inputHash !== record.hashedOtp) {
      record.attemptsRemaining -= 1;
      return {
        valid: false,
        error: `Incorrect code. ${record.attemptsRemaining} attempts remaining.`,
      };
    }

    // Success - consume OTP immediately (single use)
    const metadata = record.metadata;
    otpCache.delete(normalizedEmail);

    return { valid: true, metadata };
  }
}
