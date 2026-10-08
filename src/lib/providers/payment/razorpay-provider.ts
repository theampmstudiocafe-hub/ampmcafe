import crypto from "crypto";
import Razorpay from "razorpay";
import { CreateOrderParams, PaymentOrderResult, PaymentProvider } from "./types";

export class RazorpayProvider implements PaymentProvider {
  private razorpay: Razorpay | null = null;
  private keyId: string;
  private keySecret: string;
  private webhookSecret: string;

  constructor() {
    this.keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || "";
    this.keySecret = process.env.RAZORPAY_KEY_SECRET || "";
    this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "";

    if (this.keyId && this.keySecret) {
      this.razorpay = new Razorpay({
        key_id: this.keyId,
        key_secret: this.keySecret,
      });
    }
  }

  public async createOrder(params: CreateOrderParams): Promise<PaymentOrderResult> {
    const amountInPaise = Math.round(params.amountInr * 100);

    if (!this.razorpay) {
      // Dev simulation order ID
      const mockOrderId = `order_sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      console.log(`[Razorpay DEV SIMULATION] Generated Order: ${mockOrderId} for ₹${params.amountInr}`);
      return {
        orderId: mockOrderId,
        amount: amountInPaise,
        currency: "INR",
        keyId: this.keyId || "rzp_test_mock",
      };
    }

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: params.receipt,
      notes: {
        itemType: params.itemType,
        itemId: params.itemId,
        userId: params.userId || "",
        ...params.notes,
      },
    };

    const order = await this.razorpay.orders.create(options);

    return {
      orderId: order.id,
      amount: typeof order.amount === "number" ? order.amount : Number(order.amount),
      currency: order.currency,
      keyId: this.keyId,
    };
  }

  public verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!this.webhookSecret) {
      console.warn("[Razorpay] Warning: RAZORPAY_WEBHOOK_SECRET is not configured.");
      return process.env.NODE_ENV !== "production";
    }

    const expectedSignature = crypto
      .createHmac("sha256", this.webhookSecret)
      .update(rawBody)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "utf8"),
      Buffer.from(signature, "utf8")
    );
  }

  public async processWebhookEvent(rawBody: string, signature: string): Promise<{ handled: boolean; eventType: string; payload?: any }> {
    const isValid = this.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      throw new Error("Invalid Razorpay webhook signature");
    }

    const payload = JSON.parse(rawBody);
    const eventType = payload.event;

    return {
      handled: true,
      eventType,
      payload,
    };
  }

  public async refundPayment(paymentId: string, amountInr: number, reason: string): Promise<{ refundId: string }> {
    if (!this.razorpay) {
      return { refundId: `rfnd_sim_${Date.now()}` };
    }

    const refund = await this.razorpay.payments.refund(paymentId, {
      amount: Math.round(amountInr * 100),
      notes: { reason },
    });

    return { refundId: refund.id };
  }
}

export const paymentProvider = new RazorpayProvider();
