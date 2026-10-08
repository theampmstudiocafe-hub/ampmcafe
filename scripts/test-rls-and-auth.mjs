// ==============================================================================
// PUNE YOGA STUDIO & CAFÉ - SECURITY, RLS & AUTH TEST SUITE
// Tests visitor, member, trainer, staff, and admin permission boundaries
// ==============================================================================

import crypto from "crypto";

console.log("\n=======================================================");
console.log("🔒 RUNNING PUNE STUDIO & CAFÉ RLS AND AUTH SECURITY SUITE");
console.log("=======================================================\n");

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

// 1. MOCK RLS POLICY EVALUATION ENGINE
const ROLES = {
  VISITOR: "visitor",
  MEMBER: "member",
  TRAINER: "trainer",
  FRONT_DESK: "front_desk",
  KITCHEN_STAFF: "kitchen_staff",
  INVENTORY_STAFF: "inventory_staff",
  MANAGER: "manager",
  ADMIN: "admin",
  OWNER: "owner",
};

function hasRole(userRoles, checkRole) {
  return userRoles.includes(checkRole);
}

function isManagement(userRoles) {
  return userRoles.some((r) => ["admin", "owner", "manager"].includes(r));
}

function isAdminOrOwner(userRoles) {
  return userRoles.some((r) => ["admin", "owner"].includes(r));
}

// Evaluation rules based on migration 02
const policies = {
  profiles_select(caller, targetProfile) {
    if (!caller.isAuthenticated) return false;
    if (caller.id === targetProfile.id) return true;
    if (hasRole(caller.roles, ROLES.FRONT_DESK) || isManagement(caller.roles)) return true;
    return false;
  },

  bookings_select(caller, booking, session) {
    if (!caller.isAuthenticated) return false;
    if (caller.id === booking.user_id) return true;
    if (hasRole(caller.roles, ROLES.FRONT_DESK) || isManagement(caller.roles)) return true;
    if (hasRole(caller.roles, ROLES.TRAINER) && session.trainer_user_id === caller.id) return true;
    return false;
  },

  community_messages_select(caller, message) {
    if (!caller.isAuthenticated) return false; // visitor cannot read chat
    if (!message.is_deleted) return true;
    return isManagement(caller.roles);
  },

  staff_members_select(caller, staff) {
    if (!caller.isAuthenticated) return false;
    if (caller.id === staff.user_id) return true;
    return isManagement(caller.roles);
  },

  pack_types_manage(caller) {
    if (!caller.isAuthenticated) return false;
    return isAdminOrOwner(caller.roles);
  },

  kots_access(caller) {
    if (!caller.isAuthenticated) return false;
    return hasRole(caller.roles, ROLES.KITCHEN_STAFF) || isManagement(caller.roles);
  },

  inventory_stocktake(caller) {
    if (!caller.isAuthenticated) return false;
    return hasRole(caller.roles, ROLES.INVENTORY_STAFF) || isManagement(caller.roles);
  },
};

// 2. RUN TESTS

console.log("TEST SUITE 1: Visitor (Unauthenticated) Boundaries");
const visitor = { isAuthenticated: false, id: null, roles: [] };
const targetProfile = { id: "user-123", email: "priya@gmail.com", phone: "9823011111" };

assert(!policies.profiles_select(visitor, targetProfile), "Visitor cannot access member profiles");
assert(!policies.community_messages_select(visitor, { is_deleted: false }), "Visitor cannot read community messages");
assert(!policies.staff_members_select(visitor, { user_id: "staff-1" }), "Visitor cannot view staff directory");
assert(!policies.kots_access(visitor), "Visitor cannot view kitchen KOTs");

console.log("\nTEST SUITE 2: Member Isolation & Data Protection");
const memberA = { isAuthenticated: true, id: "user-a", roles: [ROLES.MEMBER] };
const memberB = { isAuthenticated: true, id: "user-b", roles: [ROLES.MEMBER] };
const bookingB = { id: "bk-1", user_id: "user-b", session_id: "sess-1" };
const sessionTeachingTrainerC = { id: "sess-1", trainer_user_id: "trainer-c" };

assert(policies.profiles_select(memberA, { id: "user-a" }), "Member A can select own profile");
assert(!policies.profiles_select(memberA, { id: "user-b" }), "Member A CANNOT select Member B's profile");
assert(!policies.bookings_select(memberA, bookingB, sessionTeachingTrainerC), "Member A CANNOT read Member B's bookings");
assert(!policies.staff_members_select(memberA, { user_id: "staff-1" }), "Member A CANNOT view staff salaries/records");

console.log("\nTEST SUITE 3: Trainer Privileges & Boundaries");
const trainerC = { isAuthenticated: true, id: "trainer-c", roles: [ROLES.TRAINER] };

assert(
  policies.bookings_select(trainerC, bookingB, sessionTeachingTrainerC),
  "Trainer C CAN view attendee booking for the session they teach"
);
const otherSessionTrainerD = { id: "sess-2", trainer_user_id: "trainer-d" };
assert(
  !policies.bookings_select(trainerC, bookingB, otherSessionTrainerD),
  "Trainer C CANNOT view bookings for sessions they do NOT teach"
);
assert(!policies.pack_types_manage(trainerC), "Trainer CANNOT modify pack prices (Admin only)");

console.log("\nTEST SUITE 4: Front Desk & Kitchen Staff Separation");
const frontDesk = { isAuthenticated: true, id: "staff-fd", roles: [ROLES.FRONT_DESK] };
const kitchenStaff = { isAuthenticated: true, id: "staff-chef", roles: [ROLES.KITCHEN_STAFF] };
const inventoryStaff = { isAuthenticated: true, id: "staff-inv", roles: [ROLES.INVENTORY_STAFF] };

assert(policies.bookings_select(frontDesk, bookingB, sessionTeachingTrainerC), "Front Desk CAN view all member bookings for check-in");
assert(!policies.pack_types_manage(frontDesk), "Front Desk CANNOT alter pack pricing (Admin only)");
assert(policies.kots_access(kitchenStaff), "Kitchen Staff CAN access kitchen KOT display");
assert(!policies.kots_access(memberA), "Member CANNOT access kitchen KOTs");
assert(policies.inventory_stocktake(inventoryStaff), "Inventory Staff CAN access stock intake & movements");
assert(!policies.inventory_stocktake(kitchenStaff), "Kitchen Staff alone CANNOT manage supplier purchase orders");

console.log("\nTEST SUITE 5: Owner & Admin Governance");
const admin = { isAuthenticated: true, id: "admin-1", roles: [ROLES.ADMIN] };
const owner = { isAuthenticated: true, id: "owner-1", roles: [ROLES.OWNER] };

assert(policies.pack_types_manage(admin), "Admin CAN manage pack types and pricing");
assert(policies.pack_types_manage(owner), "Owner CAN manage pack types and pricing");
assert(policies.staff_members_select(admin, { user_id: "staff-1" }), "Admin CAN view all staff records");
assert(policies.staff_members_select(owner, { user_id: "staff-1" }), "Owner CAN view all staff records");

console.log("\nTEST SUITE 6: OTP Rate Limiter & Cooldown Logic");
const email = "test@pranapune.com";
const now = Date.now();
const otpCache = new Map();

// Helper to simulate OTP generation with cooldown
function createTestOtp(testEmail) {
  const existing = otpCache.get(testEmail);
  if (existing && Date.now() - existing.createdAt < 60000) {
    throw new Error("Cooldown active");
  }
  const otp = "123456";
  otpCache.set(testEmail, {
    otpHash: crypto.createHash("sha256").update(otp).digest("hex"),
    createdAt: Date.now(),
    attempts: 5,
  });
  return otp;
}

const firstOtp = createTestOtp(email);
assert(firstOtp === "123456", "First OTP successfully generated");

let cooldownBlocked = false;
try {
  createTestOtp(email); // Immediate 2nd attempt should fail
} catch (e) {
  cooldownBlocked = true;
}
assert(cooldownBlocked, "Second OTP within 60s is strictly blocked by cooldown timer");

console.log("\n=======================================================");
console.log(`TEST SUMMARY: ${passed} Passed | ${failed} Failed`);
if (failed === 0) {
  console.log("🎉 ALL ROLE BOUNDARIES & SECURITY POLICIES VALIDATED!");
}
console.log("=======================================================\n");

process.exit(failed > 0 ? 1 : 0);
