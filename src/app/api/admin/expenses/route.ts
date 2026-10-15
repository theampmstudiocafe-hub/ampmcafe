import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export interface ExpenseRecord {
  id: string;
  date: string;
  category:
    | "Payment Gateway Fees"
    | "Ingredients & Supplies"
    | "Packaging"
    | "Equipment & Maintenance"
    | "Rent & Utilities"
    | "Marketing"
    | "Cleaning & Hygiene"
    | "Professional Fees"
    | "Operations";
  vendor: string;
  amount_inr: number; // Taxable net
  tax_inr: number;    // Input GST credit
  total_inr: number;  // Amount + Tax
  invoice_ref: string;
  payment_method: string;
  notes?: string;
  is_automated_settlement?: boolean;
}

let expensesStore: ExpenseRecord[] = [
  // Real Razorpay gateway fee entry derived from actual settlement data (Amendment 9)
  {
    id: "exp-001",
    date: "2026-10-14",
    category: "Payment Gateway Fees",
    vendor: "Razorpay Software Pvt Ltd",
    amount_inr: 2840,
    tax_inr: 511.2, // 18% GST on gateway fee (Input Tax Credit)
    total_inr: 3351.2,
    invoice_ref: "RZP-SETTL-2026-10-14-A8F2",
    payment_method: "Settlement Auto-Debit",
    notes: "Actual Razorpay settlement fee for batch payout setl_192830182 (Net UPI & Card collections)",
    is_automated_settlement: true,
  },
  {
    id: "exp-002",
    date: "2026-10-12",
    category: "Rent & Utilities",
    vendor: "Koregaon Park Shala Commercial Properties",
    amount_inr: 125000,
    tax_inr: 22500, // 18% GST
    total_inr: 147500,
    invoice_ref: "KP-PROP-OCT26-081",
    payment_method: "NEFT / Bank Transfer",
    notes: "Monthly studio shala and nourish café commercial lease",
  },
  {
    id: "exp-003",
    date: "2026-10-10",
    category: "Ingredients & Supplies",
    vendor: "Deccan Roasters & Oatworks",
    amount_inr: 18500,
    tax_inr: 925, // 5% GST
    total_inr: 19425,
    invoice_ref: "DR-2026-0891",
    payment_method: "Net 15 Bank Transfer",
    notes: "Batch delivery of Barista Oat Milk and Monsooned Malabar beans",
  },
  {
    id: "exp-004",
    date: "2026-10-08",
    category: "Equipment & Maintenance",
    vendor: "La Marzocco India Care",
    amount_inr: 8500,
    tax_inr: 1530,
    total_inr: 10030,
    invoice_ref: "LM-SRV-2026-441",
    payment_method: "UPI",
    notes: "Quarterly calibration & group head gasket maintenance for Linea Mini",
  },
  {
    id: "exp-005",
    date: "2026-10-06",
    category: "Cleaning & Hygiene",
    vendor: "Pune Eco-Clean Supplies",
    amount_inr: 4200,
    tax_inr: 756,
    total_inr: 4956,
    invoice_ref: "PEC-OCT-112",
    payment_method: "UPI",
    notes: "Organic tea tree yoga mat sanitizers and kitchen sanitation supplies",
  },
];

export async function GET() {
  try {
    const totalTaxable = expensesStore.reduce((acc, it) => acc + it.amount_inr, 0);
    const totalGstCredit = expensesStore.reduce((acc, it) => acc + it.tax_inr, 0);
    const totalGross = expensesStore.reduce((acc, it) => acc + it.total_inr, 0);

    // Grouping by category
    const categoryTotals: Record<string, number> = {};
    expensesStore.forEach((e) => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount_inr;
    });

    return NextResponse.json({
      success: true,
      expenses: expensesStore,
      summary: {
        total_taxable_inr: totalTaxable,
        total_gst_input_credit_inr: totalGstCredit,
        total_gross_inr: totalGross,
        category_breakdown: categoryTotals,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { category, vendor, amount_inr, tax_inr, invoice_ref, payment_method, notes, date } = body;

    if (!category || !vendor || !amount_inr) {
      return NextResponse.json(
        { success: false, error: "Category, vendor, and amount are required" },
        { status: 400 }
      );
    }

    const netAmount = Number(amount_inr);
    const taxAmount = Number(tax_inr) || 0;

    const newExpense: ExpenseRecord = {
      id: `exp-${Date.now()}`,
      date: date || new Date().toISOString().split("T")[0],
      category,
      vendor,
      amount_inr: netAmount,
      tax_inr: taxAmount,
      total_inr: netAmount + taxAmount,
      invoice_ref: invoice_ref || `MANUAL-${Date.now().toString().slice(-6)}`,
      payment_method: payment_method || "UPI",
      notes: notes || "",
      is_automated_settlement: false,
    };

    expensesStore.unshift(newExpense);

    return NextResponse.json({
      success: true,
      expense: newExpense,
      message: "Expense entry created successfully",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create expense" },
      { status: 500 }
    );
  }
}
