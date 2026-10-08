import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notificationService } from "@/lib/providers/notification";

const BookPrivateSlotSchema = z.object({
  slotId: z.string().uuid(),
});

export async function GET() {
  try {
    const admin = createAdminClient();
    const { data: slots, error } = await admin
      .from("one_on_one_slots")
      .select(`
        id,
        start_time,
        end_time,
        price_inr,
        is_booked,
        trainers (
          id,
          name,
          slug,
          specialties,
          media_urls
        )
      `)
      .eq("is_booked", false)
      .gte("start_time", new Date().toISOString())
      .order("start_time", { ascending: true });

    if (error) {
      return NextResponse.json({ error: "Failed to fetch private slots" }, { status: 500 });
    }

    return NextResponse.json({ success: true, slots: slots || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = BookPrivateSlotSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid slot selection" }, { status: 400 });
    }

    const { slotId } = parsed.data;
    const admin = createAdminClient();

    // Lock and verify slot
    const { data: slot, error: slotError } = await admin
      .from("one_on_one_slots")
      .select(`
        *,
        trainers (name)
      `)
      .eq("id", slotId)
      .eq("is_booked", false)
      .single();

    if (slotError || !slot) {
      return NextResponse.json({ error: "Selected slot is no longer available." }, { status: 404 });
    }

    // Mark slot booked
    await admin
      .from("one_on_one_slots")
      .update({ is_booked: true })
      .eq("id", slotId);

    // Create booking record
    const { data: booking, error: bookError } = await admin
      .from("bookings")
      .insert({
        user_id: user.id,
        booking_type: "one_on_one",
        one_on_one_slot_id: slotId,
        status: "confirmed",
        credits_deducted: 0,
      })
      .select("id")
      .single();

    if (bookError) {
      // Rollback slot
      await admin.from("one_on_one_slots").update({ is_booked: false }).eq("id", slotId);
      return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `1-on-1 private session confirmed with ${(slot.trainers as any)?.name}!`,
      bookingId: booking?.id,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to book private slot" }, { status: 500 });
  }
}
