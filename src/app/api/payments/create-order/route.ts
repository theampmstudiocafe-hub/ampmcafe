import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { paymentProvider } from "@/lib/providers/payment/razorpay-provider";

const CreateOrderSchema = z.object({
  itemType: z.enum(["pack_purchase", "event_ticket"]),
  itemId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = CreateOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid payload" },
        { status: 400 }
      );
    }

    const { itemType, itemId } = parsed.data;
    const admin = createAdminClient();

    let amountInr = 0;
    let description = "";

    if (itemType === "pack_purchase") {
      const { data: packType, error: packError } = await admin
        .from("pack_types")
        .select("*")
        .eq("id", itemId)
        .eq("active", true)
        .single();

      if (packError || !packType) {
        return NextResponse.json({ error: "Selected pack is not available." }, { status: 404 });
      }

      amountInr = packType.price_inr;
      description = `Purchase of ${packType.name}`;
    } else {
      const { data: event, error: eventError } = await admin
        .from("events")
        .select("*")
        .eq("id", itemId)
        .eq("is_published", true)
        .single();

      if (eventError || !event) {
        return NextResponse.json({ error: "Selected event is not available." }, { status: 404 });
      }

      amountInr = event.price_inr;
      description = `Ticket for ${event.title}`;
    }

    const receipt = `RCPT_${Date.now().toString().slice(-8)}`;

    // Create server-side order with Razorpay
    const orderResult = await paymentProvider.createOrder({
      amountInr,
      receipt,
      userId: user.id,
      itemType,
      itemId,
      notes: {
        description,
        userEmail: user.email || "",
      },
    });

    // Record created payment in DB
    await admin.from("payments").insert({
      user_id: user.id,
      provider: "razorpay",
      provider_order_id: orderResult.orderId,
      amount_inr: amountInr,
      currency: "INR",
      status: "created",
      item_type: itemType,
      item_id: itemId,
      metadata: {
        receipt,
        description,
      },
    });

    return NextResponse.json({
      success: true,
      order: orderResult,
      amountInr,
      user: {
        email: user.email,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to create payment order" },
      { status: 500 }
    );
  }
}
