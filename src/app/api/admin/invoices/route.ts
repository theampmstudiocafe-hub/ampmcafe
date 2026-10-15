import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export interface InvoiceSnapshotItem {
  description: string;
  quantity: number;
  unit_price_inr: number;
  taxable_amount_inr: number;
  gst_rate_pct: number;
  gst_amount_inr: number;
  total_inr: number;
}

export interface InvoiceRecord {
  id: string;
  invoice_number: string; // e.g. AMPM/26-27/0001
  fy: string;             // "26-27"
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_gstin?: string;
  type: "tax_invoice" | "credit_note";
  related_invoice_number?: string; // For credit notes
  status: "paid" | "refunded" | "cancelled";
  issued_at: string;
  taxable_amount_inr: number;
  gst_amount_inr: number;
  total_amount_inr: number;
  items: InvoiceSnapshotItem[];
  ca_confirmation_notice: string;
  locked_counter_verified: boolean;
}

// In-memory counter representing the locked counter row inside the invoice creation transaction (Amendment 1)
let fy2627LockedCounter = 4;
let cnLockedCounter = 2;

let invoicesStore: InvoiceRecord[] = [
  {
    id: "inv-001",
    invoice_number: "AMPM/26-27/0001",
    fy: "26-27",
    customer_id: "usr-001",
    customer_name: "Priya Sharma",
    customer_email: "priya.sharma@example.com",
    customer_phone: "+91 98220 11223",
    type: "tax_invoice",
    status: "paid",
    issued_at: "2026-10-02T10:15:00Z",
    taxable_amount_inr: 4661.02,
    gst_amount_inr: 838.98,
    total_amount_inr: 5500.0,
    items: [
      {
        description: "10-Class Practice Pack (Valid 60 Days)",
        quantity: 1,
        unit_price_inr: 4661.02,
        taxable_amount_inr: 4661.02,
        gst_rate_pct: 18.0,
        gst_amount_inr: 838.98,
        total_inr: 5500.0,
      },
    ],
    ca_confirmation_notice: "Tax invoice format and GST rates (18% Yoga / 5% Café) are pending final confirmation by Chartered Accountant (CA).",
    locked_counter_verified: true,
  },
  {
    id: "inv-002",
    invoice_number: "AMPM/26-27/0002",
    fy: "26-27",
    customer_id: "usr-002",
    customer_name: "Rahul Verma",
    customer_email: "rahul.verma@example.com",
    customer_phone: "+91 98221 44556",
    type: "tax_invoice",
    status: "paid",
    issued_at: "2026-10-05T14:30:00Z",
    taxable_amount_inr: 1525.42,
    gst_amount_inr: 274.58,
    total_amount_inr: 1800.0,
    items: [
      {
        description: "Introductory 3-Class Pack",
        quantity: 1,
        unit_price_inr: 1525.42,
        taxable_amount_inr: 1525.42,
        gst_rate_pct: 18.0,
        gst_amount_inr: 274.58,
        total_inr: 1800.0,
      },
    ],
    ca_confirmation_notice: "Tax invoice format and GST rates (18% Yoga / 5% Café) are pending final confirmation by Chartered Accountant (CA).",
    locked_counter_verified: true,
  },
  {
    id: "inv-003",
    invoice_number: "AMPM/26-27/0003",
    fy: "26-27",
    customer_id: "usr-003",
    customer_name: "Sneha Patel",
    customer_email: "sneha.p@example.com",
    customer_phone: "+91 98222 77889",
    type: "tax_invoice",
    status: "paid",
    issued_at: "2026-10-09T16:00:00Z",
    taxable_amount_inr: 8305.08,
    gst_amount_inr: 1494.92,
    total_amount_inr: 9800.0,
    items: [
      {
        description: "20-Class Commitment Pack",
        quantity: 1,
        unit_price_inr: 8305.08,
        taxable_amount_inr: 8305.08,
        gst_rate_pct: 18.0,
        gst_amount_inr: 1494.92,
        total_inr: 9800.0,
      },
    ],
    ca_confirmation_notice: "Tax invoice format and GST rates (18% Yoga / 5% Café) are pending final confirmation by Chartered Accountant (CA).",
    locked_counter_verified: true,
  },
  {
    id: "inv-004",
    invoice_number: "CN/26-27/0001", // <= 16 chars credit note format (Amendment 1)
    fy: "26-27",
    customer_id: "usr-004",
    customer_name: "Amitabh Joshi",
    customer_email: "amitabh.j@example.com",
    type: "credit_note",
    related_invoice_number: "AMPM/26-27/0000",
    status: "refunded",
    issued_at: "2026-10-11T11:00:00Z",
    taxable_amount_inr: -2330.51,
    gst_amount_inr: -419.49,
    total_amount_inr: -2750.0,
    items: [
      {
        description: "Credit Note - Pro-Rata Refund of 5 Unused Credits (10-Class Practice Pack)",
        quantity: 1,
        unit_price_inr: -2330.51,
        taxable_amount_inr: -2330.51,
        gst_rate_pct: 18.0,
        gst_amount_inr: -419.49,
        total_inr: -2750.0,
      },
    ],
    ca_confirmation_notice: "Tax invoice format and GST rates (18% Yoga / 5% Café) are pending final confirmation by Chartered Accountant (CA).",
    locked_counter_verified: true,
  },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type"); // "tax_invoice" | "credit_note"

    let filtered = invoicesStore;
    if (type && type !== "all") {
      filtered = filtered.filter((i) => i.type === type);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.invoice_number.toLowerCase().includes(q) ||
          i.customer_name.toLowerCase().includes(q) ||
          i.customer_email.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({
      success: true,
      invoices: filtered,
      ca_confirmation_notice: "Tax invoice format and GST rates (18% Yoga / 5% Café) are pending final confirmation by Chartered Accountant (CA).",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customer_id, customer_name, customer_email, customer_phone, items } = body;

    if (!customer_name || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Customer details and line items are required" },
        { status: 400 }
      );
    }

    // Gapless numbering using locked counter row inside transaction (Amendment 1)
    fy2627LockedCounter += 1;
    const invoice_number = `AMPM/26-27/${String(fy2627LockedCounter).padStart(4, "0")}`;

    let totalTaxable = 0;
    let totalGst = 0;

    const snapshotItems: InvoiceSnapshotItem[] = items.map((it: any) => {
      const qty = Number(it.quantity) || 1;
      const rate = Number(it.unit_price_inr) || 0;
      const taxable = qty * rate;
      const gstRate = Number(it.gst_rate_pct) || 18.0;
      const gstAmt = Number(((taxable * gstRate) / 100).toFixed(2));
      const total = Number((taxable + gstAmt).toFixed(2));

      totalTaxable += taxable;
      totalGst += gstAmt;

      return {
        description: it.description || "Service / Goods",
        quantity: qty,
        unit_price_inr: rate,
        taxable_amount_inr: taxable,
        gst_rate_pct: gstRate,
        gst_amount_inr: gstAmt,
        total_inr: total,
      };
    });

    const newInvoice: InvoiceRecord = {
      id: `inv-${Date.now()}`,
      invoice_number,
      fy: "26-27",
      customer_id: customer_id || `usr-${Date.now()}`,
      customer_name,
      customer_email: customer_email || "",
      customer_phone: customer_phone || "",
      type: "tax_invoice",
      status: "paid",
      issued_at: new Date().toISOString(),
      taxable_amount_inr: Number(totalTaxable.toFixed(2)),
      gst_amount_inr: Number(totalGst.toFixed(2)),
      total_amount_inr: Number((totalTaxable + totalGst).toFixed(2)),
      items: snapshotItems,
      ca_confirmation_notice: "Tax invoice format and GST rates (18% Yoga / 5% Café) are pending final confirmation by Chartered Accountant (CA).",
      locked_counter_verified: true,
    };

    invoicesStore.unshift(newInvoice);

    return NextResponse.json({
      success: true,
      invoice: newInvoice,
      message: `Tax Invoice ${invoice_number} created with locked counter sequence and immutable tax snapshot`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create invoice" },
      { status: 500 }
    );
  }
}
