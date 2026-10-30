import { cookies } from "next/headers";
import { createClient as createServerClient } from "@/lib/supabase/server";

export interface AppUserSession {
  id: string;
  email: string;
  fullName: string;
  displayName: string;
  role: string;
  roles: string[];
  department?: string;
  jobTitle?: string;
}

export const DEMO_PASSWORD = "demo1234";

export const DEMO_USERS: Record<string, AppUserSession> = {
  "owner@ampm.com": {
    id: "usr_owner_001",
    email: "owner@ampm.com",
    fullName: "Amrita Rao (Studio Owner)",
    displayName: "Amrita (Owner)",
    role: "owner",
    roles: ["owner", "admin"],
    department: "management",
    jobTitle: "Founder & Studio Owner",
  },
  "admin@ampm.com": {
    id: "usr_admin_002",
    email: "admin@ampm.com",
    fullName: "Aditi Sharma (Studio Admin)",
    displayName: "Aditi (Admin)",
    role: "admin",
    roles: ["admin"],
    department: "operations",
    jobTitle: "Studio Administrator",
  },
  "manager@ampm.com": {
    id: "usr_manager_003",
    email: "manager@ampm.com",
    fullName: "Vikram Mehta (Operations Manager)",
    displayName: "Vikram (Manager)",
    role: "manager",
    roles: ["manager"],
    department: "operations",
    jobTitle: "General Manager",
  },
  "frontdesk@ampm.com": {
    id: "usr_frontdesk_004",
    email: "frontdesk@ampm.com",
    fullName: "Pooja Patil (Front Desk)",
    displayName: "Pooja (FrontDesk)",
    role: "front_desk",
    roles: ["front_desk"],
    department: "front_desk",
    jobTitle: "Front Desk Receptionist",
  },
  "trainer@ampm.com": {
    id: "usr_trainer_005",
    email: "trainer@ampm.com",
    fullName: "Ananya Kulkarni (Senior Trainer)",
    displayName: "Ananya (Trainer)",
    role: "trainer",
    roles: ["trainer"],
    department: "studio",
    jobTitle: "Lead Yoga Instructor",
  },
  "kitchen@ampm.com": {
    id: "usr_kitchen_006",
    email: "kitchen@ampm.com",
    fullName: "Chef Arjun Kapoor (Head Chef)",
    displayName: "Arjun (Kitchen)",
    role: "kitchen_staff",
    roles: ["kitchen_staff"],
    department: "cafe",
    jobTitle: "Head Chef",
  },
  "inventory@ampm.com": {
    id: "usr_inventory_007",
    email: "inventory@ampm.com",
    fullName: "Karan Johar (Inventory Manager)",
    displayName: "Karan (Inventory)",
    role: "inventory_staff",
    roles: ["inventory_staff"],
    department: "operations",
    jobTitle: "Inventory & Purchasing Lead",
  },
  "member@ampm.com": {
    id: "usr_member_008",
    email: "member@ampm.com",
    fullName: "Priya Sharma (Loyal Member)",
    displayName: "Priya",
    role: "member",
    roles: ["member"],
    department: "guest",
    jobTitle: "Yoga Member",
  },
  "trial@ampm.com": {
    id: "usr_trial_009",
    email: "trial@ampm.com",
    fullName: "Rhea Sen (Trial Member)",
    displayName: "Rhea",
    role: "member",
    roles: ["member"],
    department: "guest",
    jobTitle: "Trial Member",
  },
};

/**
 * Returns current authenticated user either from Supabase Auth or secure demo cookie fallback.
 */
export async function getSessionUser(): Promise<AppUserSession | null> {
  // 1. Try Supabase Auth
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (!error && data?.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, display_name")
        .eq("id", data.user.id)
        .single();

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
        : userRoles.includes("kitchen_staff")
        ? "kitchen_staff"
        : userRoles.includes("inventory_staff")
        ? "inventory_staff"
        : userRoles.includes("trainer")
        ? "trainer"
        : "member";

      return {
        id: data.user.id,
        email: data.user.email || "",
        fullName: profile?.full_name || "Member",
        displayName: profile?.display_name || "Member",
        role: primaryRole,
        roles: userRoles,
      };
    }
  } catch {
    // Supabase offline or unreachable, fall back to cookie
  }

  // 2. Cookie fallback for demo accounts
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("ampm_session_user");
    if (sessionCookie?.value) {
      const parsed = JSON.parse(decodeURIComponent(sessionCookie.value));
      if (parsed && parsed.email) {
        return parsed as AppUserSession;
      }
    }
  } catch {
    // Ignore error
  }

  return null;
}
