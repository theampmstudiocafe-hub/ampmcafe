import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Load .env.local manually
try {
  const envContent = fs.readFileSync(".env.local", "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [k, ...vParts] = trimmed.split("=");
    if (k && vParts.length) {
      process.env[k.trim()] = vParts.join("=").trim().replace(/^["']|["']$/g, "");
    }
  }
} catch (e) {
  // Ignore if not present
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wdrfrnzyocfkfcecbbuw.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkcmZybnp5b2Nma2ZjZWNiYnV3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTQ3NTc5NywiZXhwIjoyMTA3MDUxNzk3fQ.4cZd3A1KsoBC0db_-5fnQUtUt3wlvf_xn0W0oVkFQ30";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const DEMO_PASSWORD = "demo1234";

const DEMO_ACCOUNTS = [
  {
    email: "owner@ampm.com",
    fullName: "Amrita Rao (Studio Owner)",
    displayName: "Amrita (Owner)",
    role: "owner",
    department: "management",
    jobTitle: "Founder & Studio Owner",
  },
  {
    email: "admin@ampm.com",
    fullName: "Aditi Sharma (Studio Admin)",
    displayName: "Aditi (Admin)",
    role: "admin",
    department: "operations",
    jobTitle: "Studio Administrator",
  },
  {
    email: "manager@ampm.com",
    fullName: "Vikram Mehta (Operations Manager)",
    displayName: "Vikram (Manager)",
    role: "manager",
    department: "operations",
    jobTitle: "General Manager",
  },
  {
    email: "trainer@ampm.com",
    fullName: "Ananya Kulkarni (Senior Trainer)",
    displayName: "Ananya (Trainer)",
    role: "trainer",
    department: "studio",
    jobTitle: "Lead Yoga Instructor",
    trainerSlug: "ananya-kulkarni",
  },
  {
    email: "frontdesk@ampm.com",
    fullName: "Pooja Patil (Front Desk)",
    displayName: "Pooja (FrontDesk)",
    role: "front_desk",
    department: "front_desk",
    jobTitle: "Front Desk Concierge",
  },
  {
    email: "kitchen@ampm.com",
    fullName: "Rahul Joshi (Kitchen Lead)",
    displayName: "Rahul (Kitchen)",
    role: "kitchen_staff",
    department: "kitchen",
    jobTitle: "Head Chef",
  },
  {
    email: "inventory@ampm.com",
    fullName: "Karan Shinde (Inventory Lead)",
    displayName: "Karan (Inventory)",
    role: "inventory_staff",
    department: "inventory",
    jobTitle: "Inventory Manager",
  },
  {
    email: "member@ampm.com",
    fullName: "Tanvi Deshmukh (Active Member)",
    displayName: "Tanvi (Member)",
    role: "member",
    withCredits: true,
  },
  {
    email: "trial@ampm.com",
    fullName: "Rhea Kapoor (Trial Member)",
    displayName: "Rhea (Trial)",
    role: "member",
    withCredits: false,
  },
];

async function seedDemoAccounts() {
  console.log("=================================================");
  console.log("🧘 SEEDING DEMO ACCOUNTS FOR THE AM:PM STUDIO");
  console.log(`🔑 Master Password for all demo accounts: ${DEMO_PASSWORD}`);
  console.log("=================================================\n");

  // Fetch existing users
  const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error("Failed to list existing users:", listError.message);
    process.exit(1);
  }

  const existingMap = new Map();
  for (const u of existingUsers.users) {
    if (u.email) existingMap.set(u.email.toLowerCase(), u);
  }

  for (const account of DEMO_ACCOUNTS) {
    const normalizedEmail = account.email.toLowerCase();
    let userId;

    if (existingMap.has(normalizedEmail)) {
      const existing = existingMap.get(normalizedEmail);
      userId = existing.id;
      console.log(`[EXISTING] Updating password for ${normalizedEmail}...`);
      await supabase.auth.admin.updateUserById(userId, {
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: account.fullName },
      });
    } else {
      console.log(`[CREATE] Creating Supabase Auth user ${normalizedEmail}...`);
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: normalizedEmail,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: account.fullName },
      });

      if (createError || !newUser?.user) {
        console.error(`❌ Failed to create user ${normalizedEmail}:`, createError?.message);
        continue;
      }
      userId = newUser.user.id;
    }

    // Upsert Profile
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: userId,
        email: normalizedEmail,
        full_name: account.fullName,
        display_name: account.displayName,
        phone: "+91 98230 11000",
        whatsapp_opt_in: true,
        is_banned: false,
      },
      { onConflict: "id" }
    );
    if (profileError) {
      console.error(`❌ Failed profile for ${normalizedEmail}:`, profileError.message);
    }

    // Upsert Role
    const { error: roleError } = await supabase.from("user_roles").upsert(
      {
        user_id: userId,
        role: account.role,
      },
      { onConflict: "user_id,role" }
    );
    if (roleError) {
      console.error(`❌ Failed role for ${normalizedEmail}:`, roleError.message);
    }

    // Link trainer record if applicable
    if (account.trainerSlug) {
      await supabase
        .from("trainers")
        .update({ user_id: userId })
        .eq("slug", account.trainerSlug);
      console.log(`  ↪ Linked to trainer profile: ${account.trainerSlug}`);
    }

    // Upsert staff_members record if staff
    if (account.department) {
      const empId = `EMP-${account.role.toUpperCase().replace("_", "")}-01`;
      await supabase.from("staff_members").upsert(
        {
          user_id: userId,
          employee_id: empId,
          department: account.department,
          job_title: account.jobTitle,
          is_active: true,
        },
        { onConflict: "employee_id" }
      );
    }

    // Seed active credit pack for member@ampm.com
    if (account.withCredits) {
      // Find pack type
      const { data: packType } = await supabase
        .from("pack_types")
        .select("id")
        .eq("name", "10-Class Practice Pack")
        .maybeSingle();

      const packTypeId = packType?.id || "22222222-2222-2222-2222-222222222202";

      // Check if pack already exists
      const { data: existingPack } = await supabase
        .from("user_packs")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!existingPack) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 90);

        const { data: newPack, error: packErr } = await supabase
          .from("user_packs")
          .insert({
            user_id: userId,
            pack_type_id: packTypeId,
            initial_credits: 10,
            remaining_credits: 10,
            expires_at: expiresAt.toISOString(),
            status: "active",
          })
          .select("id")
          .single();

        if (packErr) {
          console.error("❌ Failed to seed user pack:", packErr.message);
        } else if (newPack) {
          await supabase.from("credit_ledger").insert({
            user_id: userId,
            user_pack_id: newPack.id,
            amount: 10,
            entry_type: "purchase",
            reason: "Initial Demo 10-Class Practice Pack",
            balance_after: 10,
            created_by: userId,
          });
          console.log(`  ↪ Granted 10 credits (Pack ID: ${newPack.id})`);
        }
      }
    }

    console.log(`✅ [READY] ${normalizedEmail.padEnd(24)} | Role: ${account.role.padEnd(16)} | Password: ${DEMO_PASSWORD}`);
  }

  console.log("\n✨ All 9 demo accounts seeded and ready for login!");
}

seedDemoAccounts().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
