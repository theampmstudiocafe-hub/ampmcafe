import { NextRequest, NextResponse } from "next/server";
import { paymentProvider } from "@/lib/providers/payment/razorpay-provider";
import { createAdminClient } from "@/lib/supabase/admin";
import { notificationService } from "@/lib/providers/notification";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";

    // 1. Verify HMAC-SHA256 signature
    const isValid = paymentProvider.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.error("[Razorpay Webhook] Invalid signature received");
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;
    console.log(`[Razorpay Webhook Event] ${eventType}`);

    const admin = createAdminClient();

    // 2. Process order.paid or payment.captured
    if (eventType === "order.paid" || eventType === "payment.captured") {
      const paymentEntity = event.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id;
      const paymentId = paymentEntity?.id;

      if (!orderId) {
        return NextResponse.json({ received: true });
      }

      // Check existing payment in DB
      const { data: existingPayment, error: findError } = await admin
        .from("payments")
        .select("*")
        .eq("provider_order_id", orderId)
        .single();

      if (findError || !existingPayment) {
        console.warn(`[Razorpay Webhook] Payment record for order ${orderId} not found`);
        return NextResponse.json({ received: true });
      }

      // Idempotency: if already captured, do not credit twice
      if (existingPayment.status === "captured") {
        console.log(`[Razorpay Webhook] Order ${orderId} is already marked captured. Skipping.`);
        return NextResponse.json({ received: true, message: "Already processed" });
      }

      // Update payment to captured
      await admin
        .from("payments")
        .update({
          status: "captured",
          provider_payment_id: paymentId,
          provider_signature: signature,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingPayment.id);

      // If pack purchase, credit user pack & ledger via atomic stored procedure
      if (existingPayment.item_type === "pack_purchase" && existingPayment.user_id) {
        const { data: userPackId, error: procError } = await admin.rpc("record_pack_purchase", {
          p_user_id: existingPayment.user_id,
          p_pack_type_id: existingPayment.item_id,
          p_payment_id: existingPayment.id,
        });

        if (procError) {
          console.error("[Razorpay Webhook] Stored procedure record_pack_purchase failed:", procError);
        } else {
          console.log(`[Razorpay Webhook] Successfully created user_pack ${userPackId}`);
        }

        // Generate Invoice record
        const invoiceNumber = `PUNE-INV-${Date.now().toString().slice(-6)}`;
        await admin.from("invoices").insert({
          payment_id: existingPayment.id,
          user_id: existingPayment.user_id,
          invoice_number: invoiceNumber,
          subtotal_inr: existingPayment.amount_inr,
          tax_gst_inr: 0,
          total_inr: existingPayment.amount_inr,
        });

        // Audit log
        await admin.from("audit_logs").insert({
          actor_id: existingPayment.user_id,
          actor_role: "member",
          action: "pack.purchase.webhook",
          resource_table: "payments",
          resource_id: existingPayment.id,
          new_data: {
            orderId,
            paymentId,
            amountInr: existingPayment.amount_inr,
          },
        });
      }
    } else if (eventType === "payment.failed") {
      const paymentEntity = event.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id;
      if (orderId) {
        await admin
          .from("payments")
          .update({
            status: "failed",
            updated_at: new Date().toISOString(),
          })
          .eq("provider_order_id", orderId);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("[Razorpay Webhook Error]", err);
    return NextResponse.json({ error: "Internal processing error" }, { status: 500 });
  }
}
