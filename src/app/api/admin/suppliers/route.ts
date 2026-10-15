import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export interface SupplierRecord {
  id: string;
  name: string;
  contact_name: string;
  email: string;
  phone: string;
  gstin: string;
  payment_terms: string;
  lead_time_days: number;
  category: string;
  address: string;
  is_active: boolean;
  total_pos: number;
  active_pos: number;
  total_spend_inr: number;
}

export async function GET() {
  try {
    // Realistic Pune organic, wellness & artisan suppliers
    const suppliers: SupplierRecord[] = [
      {
        id: "sup-001",
        name: "Sahyadri Bio-Farms & Dairy",
        contact_name: "Sachin Kadam",
        email: "orders@sahyadribiofarms.com",
        phone: "+91 98220 33441",
        gstin: "27AABCS1429B1Z2",
        payment_terms: "Net 15",
        lead_time_days: 2,
        category: "Fresh Produce & Organic Dairy",
        address: "Wagholi Road, Pune 412207",
        is_active: true,
        total_pos: 14,
        active_pos: 1,
        total_spend_inr: 84200,
      },
      {
        id: "sup-002",
        name: "Kyoto Botanicals India",
        contact_name: "Aiko Tanaka",
        email: "supplies@kyotobotanicals.in",
        phone: "+91 98110 55662",
        gstin: "27AAECK9921D1Z8",
        payment_terms: "Immediate / Prepaid",
        lead_time_days: 5,
        category: "Ceremonial Matcha & Botanicals",
        address: "Koregaon Park North Main Rd, Pune 411001",
        is_active: true,
        total_pos: 6,
        active_pos: 0,
        total_spend_inr: 45600,
      },
      {
        id: "sup-003",
        name: "Deccan Roasters & Oatworks",
        contact_name: "Tanvi Jog",
        email: "wholesale@deccanroasters.com",
        phone: "+91 98231 77883",
        gstin: "27AAEFD5512E1Z3",
        payment_terms: "Net 30",
        lead_time_days: 3,
        category: "Artisan Coffee Beans & Oat Milk",
        address: "Senapati Bapat Rd, Pune 411016",
        is_active: true,
        total_pos: 18,
        active_pos: 2,
        total_spend_inr: 112500,
      },
      {
        id: "sup-004",
        name: "Satara Valley Agro Organics",
        contact_name: "Mahesh Bhosale",
        email: "sales@sataravalleyagro.in",
        phone: "+91 98224 88994",
        gstin: "27AAJFS3391K1Z1",
        payment_terms: "Net 15",
        lead_time_days: 2,
        category: "Quinoa, Nuts, Seeds & Cold Pressed Oils",
        address: "Gultekdi Market Yard, Pune 411037",
        is_active: true,
        total_pos: 9,
        active_pos: 1,
        total_spend_inr: 63800,
      },
      {
        id: "sup-005",
        name: "Prana Essentials Wellness Co",
        contact_name: "Ritika Sethi",
        email: "orders@pranawellness.co.in",
        phone: "+91 98235 66775",
        gstin: "27AAGCP8823M1Z9",
        payment_terms: "Net 30",
        lead_time_days: 4,
        category: "Ayurvedic Herbs, Ashwagandha & Spices",
        address: "FC Road, Shivajinagar, Pune 411005",
        is_active: true,
        total_pos: 5,
        active_pos: 0,
        total_spend_inr: 31400,
      },
    ];

    return NextResponse.json({
      success: true,
      suppliers,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch suppliers" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, contact_name, email, phone, gstin, payment_terms, lead_time_days, category, address } = body;

    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: "Supplier name and email are required" },
        { status: 400 }
      );
    }

    const newSupplier: SupplierRecord = {
      id: `sup-${Date.now()}`,
      name,
      contact_name: contact_name || "",
      email,
      phone: phone || "",
      gstin: gstin || "",
      payment_terms: payment_terms || "Net 15",
      lead_time_days: Number(lead_time_days) || 2,
      category: category || "General Goods",
      address: address || "",
      is_active: true,
      total_pos: 0,
      active_pos: 0,
      total_spend_inr: 0,
    };

    return NextResponse.json({
      success: true,
      supplier: newSupplier,
      message: "Supplier onboarded successfully",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create supplier" },
      { status: 500 }
    );
  }
}
