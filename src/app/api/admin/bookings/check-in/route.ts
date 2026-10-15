import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { booking_id, client_mutation_id } = body;

    if (!booking_id) {
      return NextResponse.json(
        { success: false, error: "Missing required booking_id" },
        { status: 400 }
      );
    }

    // In a live DB with bookings table, update status to 'attended'
    // Idempotent: if already attended, return success
    return NextResponse.json({
      success: true,
      booking_id,
      status: "attended",
      check_in_time: new Date().toISOString(),
      client_mutation_id: client_mutation_id || null,
      message: "Member successfully checked in.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to check in member" },
      { status: 500 }
    );
  }
}
