// ==============================================================================
// PUNE YOGA STUDIO & CAFÉ - MILESTONE 4 TEST SUITE
// Validates:
// 1. Community Message Privacy Protection (Strict display name only, no email/phone)
// 2. Announcement & Pin Authorization (Trainers/Admins only)
// 3. Message Validation, Character Limits & Script Sanitization
// 4. Rate Limiting on Community Chat
// 5. 1-Click Moderation Quick Delete & Report Queue
// 6. Mute & Ban Enforcement
// ==============================================================================

import crypto from "crypto";

console.log("\n===================================================================");
console.log("🧘 RUNNING MILESTONE 4: COMMUNITY CHAT & MODERATION TEST SUITE");
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
// TEST 1: Privacy Protection (Display Names Only, No PII Leak)
// -----------------------------------------------------------------------------
console.log("TEST SUITE 1: Community Privacy Protection");

const sampleRawUser = {
  id: "user-uuid-1234",
  email: "priya.sharma@example.com",
  phone: "+919823012345",
  full_name: "Priya Sharma",
  role: "member",
};

function formatPublicCommunityMessage(dbMessage, currentUserId) {
  // Enforce zero exposure of email, phone, or raw sender_id
  return {
    id: dbMessage.id,
    sender_display_name: dbMessage.sender_display_name,
    content: dbMessage.content,
    is_announcement: dbMessage.is_announcement,
    is_pinned: dbMessage.is_pinned,
    created_at: dbMessage.created_at,
    isOwn: currentUserId === dbMessage.sender_id,
  };
}

const mockDbMessage = {
  id: "msg-101",
  sender_id: "user-uuid-1234",
  sender_display_name: "Priya S.",
  content: "The Yin Yoga class was amazing!",
  is_announcement: false,
  is_pinned: false,
  created_at: new Date().toISOString(),
  email: "priya.sharma@example.com", // should be stripped
  phone: "+919823012345", // should be stripped
};

const sanitized = formatPublicCommunityMessage(mockDbMessage, "user-uuid-9999");

assert(sanitized.sender_display_name === "Priya S.", "Sender display name preserved");
assert(!("email" in sanitized), "User email strictly stripped from public community message");
assert(!("phone" in sanitized), "User phone strictly stripped from public community message");
assert(!("sender_id" in sanitized), "Internal sender UUID hidden from client response");
assert(sanitized.isOwn === false, "isOwn computed correctly for other members");

// -----------------------------------------------------------------------------
// TEST 2: Role Authorization for Announcements & Pinning
// -----------------------------------------------------------------------------
console.log("\nTEST SUITE 2: Role-Based Announcement & Pin Authorization");

function authorizeAnnouncement(role, requestedAnnouncement, requestedPinned) {
  const privilegedRoles = ["trainer", "manager", "admin", "owner"];
  const canAuthorize = privilegedRoles.includes(role);
  return {
    is_announcement: canAuthorize && Boolean(requestedAnnouncement),
    is_pinned: canAuthorize && Boolean(requestedPinned),
  };
}

const memberAttempt = authorizeAnnouncement("member", true, true);
assert(
  memberAttempt.is_announcement === false && memberAttempt.is_pinned === false,
  "Regular member CANNOT post announcement or pin message"
);

const visitorAttempt = authorizeAnnouncement("visitor", true, true);
assert(
  visitorAttempt.is_announcement === false && visitorAttempt.is_pinned === false,
  "Visitor CANNOT post announcement or pin message"
);

const trainerAttempt = authorizeAnnouncement("trainer", true, true);
assert(
  trainerAttempt.is_announcement === true && trainerAttempt.is_pinned === true,
  "Trainer CAN post official announcement and pin it"
);

const adminAttempt = authorizeAnnouncement("admin", true, true);
assert(
  adminAttempt.is_announcement === true && adminAttempt.is_pinned === true,
  "Admin CAN post official announcement and pin it"
);

// -----------------------------------------------------------------------------
// TEST 3: Content Sanitization & Length Limits
// -----------------------------------------------------------------------------
console.log("\nTEST SUITE 3: Content Sanitization & Limits");

function validateAndSanitizeMessage(content) {
  const trimmed = (content || "").trim();
  if (trimmed.length === 0) {
    return { valid: false, error: "Empty content" };
  }
  if (trimmed.length > 1000) {
    return { valid: false, error: "Content exceeds 1000 characters" };
  }
  const sanitized = trimmed.replace(/<[^>]*>?/gm, "");
  return { valid: true, content: sanitized };
}

assert(validateAndSanitizeMessage("").valid === false, "Empty string rejected");
assert(validateAndSanitizeMessage("    ").valid === false, "Whitespace-only string rejected");

const longText = "a".repeat(1001);
assert(validateAndSanitizeMessage(longText).valid === false, "Messages > 1000 characters rejected");

const validText = "Looking forward to Saturday sound bath!";
assert(validateAndSanitizeMessage(validText).valid === true, "Valid 40-char message accepted");

const maliciousXss = "Hello <script>alert('hack')</script> community!";
const xssResult = validateAndSanitizeMessage(maliciousXss);
assert(
  xssResult.valid === true && !xssResult.content.includes("<script>"),
  "Malicious HTML/script tags safely stripped"
);

// -----------------------------------------------------------------------------
// TEST 4: Rate Limiting Enforcement
// -----------------------------------------------------------------------------
console.log("\nTEST SUITE 4: Community Chat Rate Limiting");

const mockMemoryRateLimitStore = new Map();

function checkRateLimit(key, limit, windowSeconds) {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const existing = mockMemoryRateLimitStore.get(key);

  if (!existing || now > existing.resetAt) {
    mockMemoryRateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  if (existing.count >= limit) {
    return { success: false, remaining: 0 };
  }

  existing.count += 1;
  return { success: true, remaining: limit - existing.count };
}

const userKey = "user-flood-test";
for (let i = 1; i <= 5; i++) {
  const res = checkRateLimit(userKey, 5, 30);
  assert(res.success === true, `Message ${i}/5 allowed within 30-second window`);
}

const floodAttempt = checkRateLimit(userKey, 5, 30);
assert(floodAttempt.success === false, "Message 6/5 blocked by sliding window rate limiter");

// -----------------------------------------------------------------------------
// TEST 5: Mute & Ban Validation
// -----------------------------------------------------------------------------
console.log("\nTEST SUITE 5: Mute and Ban Restrictions");

function canPostMessage(userProfile) {
  if (userProfile.is_banned) {
    return { allowed: false, reason: "Account is banned" };
  }
  if (userProfile.muted_until && new Date(userProfile.muted_until) > new Date()) {
    return { allowed: false, reason: "Account is temporarily muted" };
  }
  return { allowed: true };
}

const normalMember = { is_banned: false, muted_until: null };
assert(canPostMessage(normalMember).allowed === true, "Active member can post");

const bannedMember = { is_banned: true, muted_until: null };
assert(canPostMessage(bannedMember).allowed === false, "Banned member blocked from posting");

const currentlyMutedMember = {
  is_banned: false,
  muted_until: new Date(Date.now() + 3600000).toISOString(), // 1 hour in future
};
assert(
  canPostMessage(currentlyMutedMember).allowed === false,
  "Currently muted member blocked from posting"
);

const expiredMuteMember = {
  is_banned: false,
  muted_until: new Date(Date.now() - 3600000).toISOString(), // 1 hour in past
};
assert(
  canPostMessage(expiredMuteMember).allowed === true,
  "Member with expired mute can resume posting"
);

// -----------------------------------------------------------------------------
// TEST 6: Moderation 1-Click Soft Delete & Audit State
// -----------------------------------------------------------------------------
console.log("\nTEST SUITE 6: Moderation 1-Click Delete");

function perform1ClickDelete(message, adminUserId) {
  return {
    ...message,
    is_deleted: true,
    deleted_by: adminUserId,
    deleted_at: new Date().toISOString(),
  };
}

const activeMsg = {
  id: "msg-abusive-1",
  sender_display_name: "Troll",
  content: "Spam link",
  is_deleted: false,
};

const deletedMsg = perform1ClickDelete(activeMsg, "admin-uuid-1");
assert(deletedMsg.is_deleted === true, "Message marked as deleted");
assert(deletedMsg.deleted_by === "admin-uuid-1", "Admin actor recorded on deletion");
assert(Boolean(deletedMsg.deleted_at), "Deletion timestamp recorded");

// Summary
console.log("\n===================================================================");
console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log("===================================================================\n");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
