import crypto from "crypto";

export interface DuplicateCheckParams {
  userId: string;
  email: string;
  fullName: string;
  phone?: string | null;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  isFlagged: boolean;
  reason?: string;
  normalizedEmail: string;
  normalizedName: string;
  phoneHash: string | null;
}

export class TrialAbuseService {
  /**
   * Normalizes an email address to strip alias suffixes and dots for common providers
   * e.g., 'ananya.p+test@gmail.com' -> 'ananyap@gmail.com'
   */
  public static normalizeEmail(email: string): string {
    const trimmed = email.toLowerCase().trim();
    const [localPart, domain] = trimmed.split("@");
    if (!domain) return trimmed;

    // Remove anything after '+' in local part
    const cleanLocal = localPart.split("+")[0];

    // Remove dots for gmail/googlemail
    if (domain === "gmail.com" || domain === "googlemail.com") {
      const dotlessLocal = cleanLocal.replace(/\./g, "");
      return `${dotlessLocal}@gmail.com`;
    }

    return `${cleanLocal}@${domain}`;
  }

  /**
   * Normalizes a name for fuzzy/exact duplicate matching
   */
  public static normalizeName(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, "");
  }

  /**
   * Generates a one-way SHA-256 hash of a cleaned 10-digit phone number
   */
  public static hashPhone(phone: string): string {
    const digitsOnly = phone.replace(/\D/g, "");
    const last10 = digitsOnly.slice(-10);
    return crypto.createHash("sha256").update(last10).digest("hex");
  }

  /**
   * Evaluates whether a trial request shows duplicate patterns against historical records
   */
  public static evaluateTrial(
    params: DuplicateCheckParams,
    existingTrials: Array<{
      user_id: string;
      normalized_email: string;
      normalized_name: string;
      phone_hash: string | null;
      is_revoked: boolean;
    }>
  ): DuplicateCheckResult {
    const normalizedEmail = this.normalizeEmail(params.email);
    const normalizedName = this.normalizeName(params.fullName);
    const phoneHash = params.phone ? this.hashPhone(params.phone) : null;

    // 1. Direct check: same user_id already claimed trial
    const exactUserMatch = existingTrials.find((t) => t.user_id === params.userId);
    if (exactUserMatch) {
      return {
        isDuplicate: true,
        isFlagged: true,
        reason: "Trial already claimed by this member account.",
        normalizedEmail,
        normalizedName,
        phoneHash,
      };
    }

    // 2. Exact phone number match with another account
    if (phoneHash) {
      const phoneMatch = existingTrials.find((t) => t.phone_hash === phoneHash && !t.is_revoked);
      if (phoneMatch) {
        return {
          isDuplicate: false, // Don't block hard to prevent friction, but flag for admin
          isFlagged: true,
          reason: `Phone number matches previously used trial (Account ${phoneMatch.user_id.slice(0, 6)}...).`,
          normalizedEmail,
          normalizedName,
          phoneHash,
        };
      }
    }

    // 3. Stems/normalized email match (different aliases or dot variations)
    const emailMatch = existingTrials.find((t) => t.normalized_email === normalizedEmail && !t.is_revoked);
    if (emailMatch) {
      return {
        isDuplicate: false,
        isFlagged: true,
        reason: "Email root alias was previously used for a free trial class.",
        normalizedEmail,
        normalizedName,
        phoneHash,
      };
    }

    // 4. Clean new user
    return {
      isDuplicate: false,
      isFlagged: false,
      normalizedEmail,
      normalizedName,
      phoneHash,
    };
  }
}
