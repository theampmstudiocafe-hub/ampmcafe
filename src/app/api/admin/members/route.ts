import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase() || "";
    const filter = searchParams.get("filter") || "all";
    const callerRole = request.headers.get("x-ampm-role") || "front_desk"; // In production, verified from session JWT

    const isTrainer = callerRole === "trainer";

    // Seeded/realistic members database for THE AM:PM STUDIO
    const membersRaw = [
      {
        id: "mem-01",
        display_name: "Priya Sharma",
        email: "priya.sharma@gmail.com",
        phone: "+91 98230 11223",
        date_joined: "2026-01-15",
        lifetime_spend_inr: 16800,
        trial_status: "used",
        moderation_status: "active",
        attendance: {
          total_booked: 24,
          attended: 22,
          cancelled_in_window: 2,
          late_cancelled_no_show: 0,
        },
        emergency_contact: {
          name: "Rajesh Sharma (Spouse)",
          phone: "+91 98230 99887",
        },
        active_packs: [
          {
            pack_id: "p-10",
            name: "10-Class Practice Pack",
            credits_remaining: 6,
            total_credits: 10,
            expires_at: "2026-11-20T23:59:59Z",
          },
        ],
        recent_bookings: [
          {
            session_title: "Morning Solar Vinyasa",
            date: "2026-10-15",
            status: "attended",
          },
        ],
      },
      {
        id: "mem-02",
        display_name: "Aarav Kapoor",
        email: "aarav.k@gmail.com",
        phone: "+91 98220 33445",
        date_joined: "2026-02-01",
        lifetime_spend_inr: 11000,
        trial_status: "used",
        moderation_status: "active",
        attendance: {
          total_booked: 15,
          attended: 13,
          cancelled_in_window: 1,
          late_cancelled_no_show: 1,
        },
        emergency_contact: {
          name: "Sunita K. (Mother)",
          phone: "+91 98220 88776",
        },
        active_packs: [
          {
            pack_id: "p-20",
            name: "20-Class Commitment Pack",
            credits_remaining: 14,
            total_credits: 20,
            expires_at: "2026-12-15T23:59:59Z",
          },
        ],
        recent_bookings: [
          {
            session_title: "Ashtanga Mysore Primary",
            date: "2026-10-14",
            status: "attended",
          },
        ],
      },
      {
        id: "mem-03",
        display_name: "Meera Deshmukh",
        email: "meera.d@outlook.com",
        phone: "+91 98211 44556",
        date_joined: "2026-10-10",
        lifetime_spend_inr: 0,
        trial_status: "eligible",
        moderation_status: "active",
        attendance: {
          total_booked: 1,
          attended: 0,
          cancelled_in_window: 0,
          late_cancelled_no_show: 0,
        },
        emergency_contact: {
          name: "Vikram D. (Brother)",
          phone: "+91 98211 11223",
        },
        active_packs: [],
        recent_bookings: [
          {
            session_title: "Evening Lunar Yin",
            date: "2026-10-15",
            status: "confirmed",
          },
        ],
      },
      {
        id: "mem-04",
        display_name: "Rohan Verma",
        email: "rohan.v@gmail.com",
        phone: "+91 98219 77889",
        date_joined: "2026-03-12",
        lifetime_spend_inr: 5500,
        trial_status: "flagged_duplicate",
        moderation_status: "muted",
        muted_until: "2026-10-18T10:00:00Z",
        attendance: {
          total_booked: 8,
          attended: 5,
          cancelled_in_window: 1,
          late_cancelled_no_show: 2,
        },
        emergency_contact: {
          name: "Anita V. (Wife)",
          phone: "+91 98219 44332",
        },
        active_packs: [
          {
            pack_id: "p-03",
            name: "Introductory 3-Class Pack",
            credits_remaining: 1,
            total_credits: 3,
            expires_at: "2026-10-25T23:59:59Z",
          },
        ],
        recent_bookings: [
          {
            session_title: "Pranayama & Breathwork",
            date: "2026-10-12",
            status: "cancelled",
          },
        ],
      },
    ];

    // Filter by search query
    let filtered = membersRaw.filter((m) => {
      const matchSearch =
        m.display_name.toLowerCase().includes(search) ||
        m.email.toLowerCase().includes(search) ||
        m.phone.includes(search);

      if (!matchSearch) return false;

      if (filter === "active_pack") return m.active_packs.length > 0;
      if (filter === "trial") return m.trial_status !== "used";
      if (filter === "flagged") return m.trial_status === "flagged_duplicate";
      if (filter === "moderated") return m.moderation_status !== "active";

      return true;
    });

    // Role-based privacy masking:
    // If caller is a trainer, strictly nullify email, phone, and lifetime spend
    const sanitized = filtered.map((m) => {
      if (isTrainer) {
        return {
          id: m.id,
          display_name: m.display_name,
          email: null, // Strictly hidden from trainers
          phone: null, // Strictly hidden from trainers
          lifetime_spend_inr: null, // Strictly hidden from trainers
          date_joined: m.date_joined,
          trial_status: m.trial_status,
          moderation_status: m.moderation_status,
          attendance: m.attendance,
          emergency_contact: m.emergency_contact, // permitted for duty of care in class
          active_packs: m.active_packs.map((p) => ({
            name: p.name,
            credits_remaining: p.credits_remaining,
          })),
          recent_bookings: m.recent_bookings,
        };
      }

      // Owner, Manager, Front Desk see complete dossier
      return m;
    });

    return NextResponse.json({
      success: true,
      members: sanitized,
      caller_role: callerRole,
      trainer_privacy_applied: isTrainer,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch members directory" },
      { status: 500 }
    );
  }
}
