import { UserPack } from "@/types/database.types";

export interface EntitlementCheckResult {
  hasEligibleTrial: boolean;
  hasActiveCredits: boolean;
  activePack: UserPack | null;
  totalRemainingCredits: number;
  availableOptions: Array<"trial" | "pack_credit" | "drop_in">;
  dropInPriceInr: number;
}

export class EntitlementService {
  /**
   * Evaluates user eligibility to book a class session
   */
  public static evaluateBookingEligibility(params: {
    userId: string;
    classTypeId: string;
    hasUsedTrial: boolean;
    userPacks: UserPack[];
    defaultDropInPriceInr?: number;
  }): EntitlementCheckResult {
    const { hasUsedTrial, userPacks, defaultDropInPriceInr = 700 } = params;
    const now = new Date();

    // Filter valid packs: active, not expired, credits > 0
    const validPacks = userPacks.filter((pack) => {
      const isNotExpired = new Date(pack.expires_at) > now;
      const hasCredits = pack.remaining_credits > 0;
      const isActive = pack.status === "active";
      return isNotExpired && hasCredits && isActive;
    });

    // Sort by earliest expiration date first to optimize member value
    validPacks.sort((a, b) => new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime());

    const activePack = validPacks[0] || null;
    const totalRemainingCredits = validPacks.reduce((sum, p) => sum + p.remaining_credits, 0);

    const hasEligibleTrial = !hasUsedTrial;
    const hasActiveCredits = validPacks.length > 0 && totalRemainingCredits > 0;

    const availableOptions: Array<"trial" | "pack_credit" | "drop_in"> = [];
    if (hasEligibleTrial) availableOptions.push("trial");
    if (hasActiveCredits) availableOptions.push("pack_credit");
    availableOptions.push("drop_in");

    return {
      hasEligibleTrial,
      hasActiveCredits,
      activePack,
      totalRemainingCredits,
      availableOptions,
      dropInPriceInr: defaultDropInPriceInr,
    };
  }
}
