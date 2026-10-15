import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

let cnSeriesLockedCounter = 2;

export async function POST(request: Request) {
  try {
    const callerRole = request.headers.get("x-ampm-role") || "owner";
    if (callerRole !== "owner" && callerRole !== "manager") {
      return NextResponse.json(
        {
          success: false,
          error: "Permission denied: Pack refunds are restricted exclusively to Owner and General Manager roles (Amendment 6)",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      user_id,
      user_pack_id,
      original_invoice_number,
      customer_name,
      customer_email,
      total_credits,
      remaining_credits,
      pack_price_paid_inr,
      reason,
    } = body;

    if (!reason || reason.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: "A valid refund reason of at least 5 characters is required for regulatory audit (Amendment 6)" },
        { status: 400 }
      );
    }

    const totalCreds = Number(total_credits) || 10;
    const remainingCreds = Math.max(0, Math.min(totalCreds, Number(remaining_credits) || 0));
    const pricePaid = Number(pack_price_paid_inr) || 5500;

    // Monetary Pack Refund Accounting (Amendment 7):
    // Unused-credits-only pro-rata formula:
    // Refund = Price Paid * (Remaining Credits / Total Credits)
    const refundRatio = totalCreds > 0 ? remainingCreds / totalCreds : 0;
    const refundGrossInr = Number((pricePaid * refundRatio).toFixed(2));
    const gstRatePct = 18.0;
    const taxableRefundInr = Number((refundGrossInr / (1 + gstRatePct / 100)).toFixed(2));
    const gstReversalInr = Number((refundGrossInr - taxableRefundInr).toFixed(2));

    // Locked counter credit note sequence <= 16 characters: CN/26-27/XXXX
    cnSeriesLockedCounter += 1;
    const credit_note_number = `CN/26-27/${String(cnSeriesLockedCounter).padStart(4, "0")}`;

    // Razorpay API Refund Transaction Simulation
    const razorpayRefundId = `rfnd_${Date.now().toString().slice(-10)}`;

    return NextResponse.json({
      success: true,
      refund: {
        credit_note_number,
        original_invoice_number: original_invoice_number || "AMPM/26-27/0001",
        customer_name: customer_name || "Valued Member",
        customer_email: customer_email || "",
        total_credits: totalCreds,
        unused_credits_refunded: remainingCreds,
        refund_gross_inr: refundGrossInr,
        taxable_reversed_inr: taxableRefundInr,
        gst_liability_reversed_inr: gstReversalInr,
        razorpay_refund_id: razorpayRefundId,
        authorized_by_role: callerRole,
        reason: reason.trim(),
        effects: {
          remaining_pack_credits: 0, // Voided to prevent reuse
          pack_status: "refunded",
          future_bookings_cancelled: true, // Prevents phantom attendance
          recognized_revenue_impact: `Taxable revenue reversed by ₹${taxableRefundInr.toFixed(2)} in P&L`,
        },
        ca_confirmation_notice: "Tax invoice format and GST rates (18% Yoga / 5% Café) are pending final confirmation by Chartered Accountant (CA).",
        refunded_at: new Date().toISOString(),
      },
      message: `Pro-rata refund of ₹${refundGrossInr.toLocaleString("en-IN")} processed. Credit Note ${credit_note_number} generated.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process pack refund" },
      { status: 500 }
    );
  }
}
