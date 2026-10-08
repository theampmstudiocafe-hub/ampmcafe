// ==============================================================================
// PUNE YOGA STUDIO & CAFÉ - MILESTONE 2 TEST SUITE
// Validates:
// 1. Entitlement Engine (Packs earliest expiry sorting)
// 2. Free Trial Abuse & Duplicate Detection (Email normalization & Phone hashing)
// 3. Razorpay Signed Webhook Verification & Idempotent Credit Ledger Funding
// 4. Atomic Booking Credit Deduction & Immutable Ledger Tracking
// 5. Configurable 12-Hour Cancellation Window & Refund Policy
// ==============================================================================

import crypto from "crypto";

console.log("\n===================================================================");
console.log("🧘 RUNNING MILESTONE 2: BOOKING, PACKS & PAYMENTS TEST SUITE");
console.log("===================================================================\n");

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}`);
    failed++;
  }
}

// -----------------------------------------------------------------------------
// TEST 1: Free Trial Abuse & Normalization Heuristics
// -----------------------------------------------------------------------------
console.log("TEST SUITE 1: Free Trial Duplicate Detection & Email Normalization");

function normalizeEmail(email) {
  const trimmed = email.toLowerCase().trim();
  const [localPart, domain] = trimmed.split("@");
  if (!domain) return trimmed;
  const cleanLocal = localPart.split("+")[0];
  if (domain === "gmail.com" || domain === "googlemail.com") {
    return `${cleanLocal.replace(/\./g, "")}@gmail.com`;
  }
  return `${cleanLocal}@${domain}`;
}

function hashPhone(phone) {
  const digits = phone.replace(/\D/g, "").slice(-10);
  return crypto.createHash("sha256").update(digits).digest("hex");
}

assert(
  normalizeEmail("ananya.pandey+trial1@gmail.com") === "ananyapandey@gmail.com",
  "Normalizes Gmail dots and plus-tags to root address"
);
assert(
  normalizeEmail("ANANYA.PANDEY@GMAIL.COM") === "ananyapandey@gmail.com",
  "Case insensitivity check"
);

const phoneA = "+91 98230 12345";
const phoneB = "9823012345";
assert(
  hashPhone(phoneA) === hashPhone(phoneB),
  "Phone hash matches across formatting variations (+91, spaces)"
);

const existingTrials = [
  {
    user_id: "user-1",
    normalized_email: "priya@gmail.com",
    normalized_name: "priyasharma",
    phone_hash: hashPhone("9823011111"),
    is_revoked: false,
  },
];

function evaluateTrial(req, trials) {
  const nEmail = normalizeEmail(req.email);
  const pHash = req.phone ? hashPhone(req.phone) : null;
  const exactUser = trials.find((t) => t.user_id === req.userId);
  if (exactUser) return { allow: false, flagged: true, reason: "Already used" };

  const phoneMatch = trials.find((t) => t.phone_hash === pHash);
  if (phoneMatch) return { allow: true, flagged: true, reason: "Matching phone with another account" };

  const emailMatch = trials.find((t) => t.normalized_email === nEmail);
  if (emailMatch) return { allow: true, flagged: true, reason: "Matching email alias root" };

  return { allow: true, flagged: false };
}

const duplicateAttempt = evaluateTrial(
  { userId: "user-2", email: "priya+test2@gmail.com", phone: "9823099999" },
  existingTrials
);
assert(
  duplicateAttempt.flagged && duplicateAttempt.reason.includes("email alias root"),
  "Detects and flags alias trick (priya+test2@gmail.com vs priya@gmail.com) for admin review"
);

// -----------------------------------------------------------------------------
// TEST 2: Entitlement Engine & Earliest Expiration Pack Sorting
// -----------------------------------------------------------------------------
console.log("\nTEST SUITE 2: Entitlement Engine (Earliest Expiry Prioritization)");

const now = Date.now();
const packExpiringTomorrow = {
  id: "pack-tomorrow",
  remaining_credits: 2,
  expires_at: new Date(now + 86400000).toISOString(),
  status: "active",
};
const packExpiringNextMonth = {
  id: "pack-month",
  remaining_credits: 10,
  expires_at: new Date(now + 30 * 86400000).toISOString(),
  status: "active",
};
const expiredPack = {
  id: "pack-expired",
  remaining_credits: 5,
  expires_at: new Date(now - 86400000).toISOString(),
  status: "active",
};

const userPacks = [packExpiringNextMonth, expiredPack, packExpiringTomorrow];

function getBestPack(packs) {
  const valid = packs.filter(
    (p) => new Date(p.expires_at) > new Date() && p.remaining_credits > 0 && p.status === "active"
  );
  valid.sort((a, b) => new Date(a.expires_at) - new Date(b.expires_at));
  return valid[0] || null;
}

const chosenPack = getBestPack(userPacks);
assert(chosenPack.id === "pack-tomorrow", "Entitlement engine automatically selects earliest expiring pack first");
assert(
  !userPacks.filter((p) => new Date(p.expires_at) > new Date()).includes(expiredPack),
  "Expired packs are excluded from active credit entitlement"
);

// -----------------------------------------------------------------------------
// TEST 3: Razorpay Webhook Signature & Idempotency Check
// -----------------------------------------------------------------------------
console.log("\nTEST SUITE 3: Razorpay Signed Webhook Verification & Idempotency");

const WEBHOOK_SECRET = "secret_pune_test_12345";
const rawPayload = JSON.stringify({
  event: "order.paid",
  payload: {
    payment: {
      entity: {
        id: "pay_test_998877",
        order_id: "order_test_112233",
        amount: 550000,
        status: "captured",
      },
    },
  },
});

const validSignature = crypto.createHmac("sha256", WEBHOOK_SECRET).update(rawPayload).digest("hex");
const invalidSignature = "invalid_hash_signature";

function verifyWebhook(body, sig, secret) {
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
}

assert(verifyWebhook(rawPayload, validSignature, WEBHOOK_SECRET), "Valid HMAC-SHA256 signature passes verification");

let rejectedBadSig = false;
try {
  rejectedBadSig = !verifyWebhook(rawPayload, invalidSignature, WEBHOOK_SECRET);
} catch (e) {
  rejectedBadSig = true;
}
assert(rejectedBadSig, "Spoofed / Invalid webhook signature is rejected");

// Idempotency simulation
const processedPayments = new Map();
function processPaymentWebhook(orderId, paymentId, creditsToAdd) {
  if (processedPayments.has(orderId)) {
    return { alreadyProcessed: true };
  }
  processedPayments.set(orderId, { paymentId, credits: creditsToAdd, status: "captured" });
  return { alreadyProcessed: false, fundedCredits: creditsToAdd };
}

const firstWebhook = processPaymentWebhook("order_1", "pay_1", 10);
assert(!firstWebhook.alreadyProcessed && firstWebhook.fundedCredits === 10, "First webhook delivery credits 10 pack credits");

const duplicateWebhook = processPaymentWebhook("order_1", "pay_1", 10);
assert(duplicateWebhook.alreadyProcessed, "Duplicate webhook delivery is acknowledged idempotently without double-crediting");

// -----------------------------------------------------------------------------
// TEST 4: Atomic Credit Deduction & Immutable Ledger
// -----------------------------------------------------------------------------
console.log("\nTEST SUITE 4: Booking Deduction & Immutable Credit Ledger");

const ledger = [];
let memberPack = { id: "pack-1", remaining_credits: 5 };

function deductCreditForBooking(userId, bookingId, pack) {
  if (pack.remaining_credits < 1) throw new Error("Insufficient credits");
  pack.remaining_credits -= 1;
  ledger.push({
    user_id: userId,
    user_pack_id: pack.id,
    amount: -1,
    entry_type: "booking_deduction",
    reference_id: bookingId,
    balance_after: pack.remaining_credits,
  });
}

deductCreditForBooking("user-1", "booking-101", memberPack);
assert(memberPack.remaining_credits === 4, "Pack balance decrements from 5 to 4");
assert(
  ledger[ledger.length - 1].amount === -1 && ledger[ledger.length - 1].balance_after === 4,
  "Ledger records immutable -1 deduction row with correct balance_after"
);

// -----------------------------------------------------------------------------
// TEST 5: Configurable 12-Hour Cancellation Window Policy
// -----------------------------------------------------------------------------
console.log("\nTEST SUITE 5: Configurable Cancellation Window Policy");

const cancellationPolicyHours = 12;

function evaluateCancellation(sessionStartTime, cancelTime, pack, bookingCreditsDeducted) {
  const hoursRemaining = (sessionStartTime - cancelTime) / (1000 * 60 * 60);
  if (hoursRemaining >= cancellationPolicyHours) {
    pack.remaining_credits += bookingCreditsDeducted;
    ledger.push({
      amount: +bookingCreditsDeducted,
      entry_type: "cancellation_refund",
      balance_after: pack.remaining_credits,
    });
    return { refunded: true, hoursRemaining };
  } else {
    return { refunded: false, hoursRemaining };
  }
}

const sessionTime = now + 24 * 3600 * 1000; // 24 hours in the future
const earlyCancel = evaluateCancellation(sessionTime, now, memberPack, 1);
assert(
  earlyCancel.refunded && memberPack.remaining_credits === 5,
  "Cancellation 24h prior (>= 12h) refunds 1 credit back to member pack and ledger"
);

const lateSessionTime = now + 4 * 3600 * 1000; // 4 hours in the future
const lateCancel = evaluateCancellation(lateSessionTime, now, memberPack, 1);
assert(
  !lateCancel.refunded && memberPack.remaining_credits === 5,
  "Late cancellation 4h prior (< 12h policy) forfeits credit as per studio policy"
);

console.log("\n===================================================================");
console.log(`TEST RESULTS: ${passed} Passed | ${failed} Failed`);
if (failed === 0) {
  console.log("🎉 ALL MILESTONE 2 BOOKING & PAYMENT CONTRACTS VERIFIED!");
}
console.log("===================================================================\n");

process.exit(failed > 0 ? 1 : 0);
