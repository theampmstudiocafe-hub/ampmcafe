import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

    // Seeded/realistic studio schedule and bookings roster for THE AM:PM STUDIO
    const sessions = [
      {
        id: "sess-vinyasa-am",
        title: "Morning Solar Vinyasa",
        slug: "vinyasa-flow",
        trainer_name: "Ananya Kulkarni",
        trainer_id: "33333333-3333-3333-3333-333333333301",
        room: "Surya Shala (Room 1)",
        start_time: `${date}T07:30:00+05:30`,
        end_time: `${date}T08:30:00+05:30`,
        capacity: 16,
        booked_count: 14,
        status: "active",
        attendees: [
          {
            booking_id: "bk-101",
            member_id: "mem-01",
            display_name: "Priya S.",
            email: "priya.sharma@gmail.com",
            phone: "+91 98230 11223",
            emergency_contact: { name: "Rajesh Sharma (Spouse)", phone: "+91 98230 99887" },
            booking_type: "class_pack",
            status: "attended",
            check_in_time: `${date}T07:22:10+05:30`,
            credits_used: 1,
            practice_notes: "Right shoulder recovery, prefers gentle adjustments",
          },
          {
            booking_id: "bk-102",
            member_id: "mem-02",
            display_name: "Aarav K.",
            email: "aarav.k@gmail.com",
            phone: "+91 98220 33445",
            emergency_contact: { name: "Sunita K. (Mother)", phone: "+91 98220 88776" },
            booking_type: "class_pack",
            status: "confirmed",
            credits_used: 1,
            practice_notes: "None",
          },
          {
            booking_id: "bk-103",
            member_id: "mem-03",
            display_name: "Meera D.",
            email: "meera.d@outlook.com",
            phone: "+91 98211 44556",
            emergency_contact: { name: "Vikram D. (Brother)", phone: "+91 98211 11223" },
            booking_type: "free_trial",
            status: "confirmed",
            credits_used: 0,
            practice_notes: "First time at studio",
          },
          {
            booking_id: "bk-104",
            member_id: "mem-04",
            display_name: "Rohan V.",
            email: "rohan.v@gmail.com",
            phone: "+91 98219 77889",
            emergency_contact: { name: "Anita V. (Wife)", phone: "+91 98219 44332" },
            booking_type: "class_pack",
            status: "cancelled",
            cancellation_reason: "Late cancellation within 4h window",
            credits_used: 1,
            practice_notes: "None",
          },
        ],
      },
      {
        id: "sess-ashtanga-am",
        title: "Ashtanga Mysore Primary",
        slug: "ashtanga-primary",
        trainer_name: "Rohan Deshmukh",
        trainer_id: "33333333-3333-3333-3333-333333333302",
        room: "Chandra Shala (Room 2)",
        start_time: `${date}T09:00:00+05:30`,
        end_time: `${date}T10:15:00+05:30`,
        capacity: 14,
        booked_count: 10,
        status: "active",
        attendees: [
          {
            booking_id: "bk-201",
            member_id: "mem-05",
            display_name: "Neha Joshi",
            email: "neha.j@gmail.com",
            phone: "+91 98233 44556",
            emergency_contact: { name: "Arjun J. (Husband)", phone: "+91 98233 99881" },
            booking_type: "class_pack",
            status: "confirmed",
            credits_used: 1,
            practice_notes: "Practicing full primary series",
          },
        ],
      },
      {
        id: "sess-yin-pm",
        title: "Evening Lunar Yin & Sound Bath",
        slug: "yin-sound-bath",
        trainer_name: "Maya Shenoy",
        trainer_id: "33333333-3333-3333-3333-333333333303",
        room: "Surya Shala (Room 1)",
        start_time: `${date}T18:30:00+05:30`,
        end_time: `${date}T19:45:00+05:30`,
        capacity: 18,
        booked_count: 16,
        status: "upcoming",
        attendees: [],
      },
    ];

    return NextResponse.json({
      success: true,
      date,
      sessions,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch bookings roster" },
      { status: 500 }
    );
  }
}
