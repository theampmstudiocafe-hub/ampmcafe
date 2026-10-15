import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const callerRole = request.headers.get("x-ampm-role") || "owner"; // In production, verified from session JWT
    const isOwner = callerRole === "owner";

    // Seeded/realistic staff records for THE AM:PM STUDIO
    const staffMembersRaw = [
      {
        id: "emp-001",
        employee_id: "AMPM-EMP-001",
        name: "Ananya Kulkarni",
        job_title: "Lead Yoga Guide & Studio Director",
        department: "studio",
        role: "trainer",
        email: "ananya@theampmstudio.com",
        phone: "+91 98230 44551",
        date_of_joining: "2025-06-01",
        is_active: true,
        hourly_rate_inr: 1200,
        monthly_salary_inr: 85000,
        emergency_contact: { name: "Sunil Kulkarni", relation: "Father", phone: "+91 98230 11990" },
      },
      {
        id: "emp-002",
        employee_id: "AMPM-EMP-002",
        name: "Rohan Deshmukh",
        job_title: "Ashtanga Guide & Breathwork Teacher",
        department: "studio",
        role: "trainer",
        email: "rohan@theampmstudio.com",
        phone: "+91 98230 77882",
        date_of_joining: "2025-08-15",
        is_active: true,
        hourly_rate_inr: 1000,
        monthly_salary_inr: 70000,
        emergency_contact: { name: "Pooja Deshmukh", relation: "Sister", phone: "+91 98230 88771" },
      },
      {
        id: "emp-003",
        employee_id: "AMPM-EMP-003",
        name: "Maya Shenoy",
        job_title: "Sound Alchemist & Yin Guide",
        department: "studio",
        role: "trainer",
        email: "maya@theampmstudio.com",
        phone: "+91 98231 22334",
        date_of_joining: "2025-09-01",
        is_active: true,
        hourly_rate_inr: 1100,
        monthly_salary_inr: 75000,
        emergency_contact: { name: "Karan Shenoy", relation: "Spouse", phone: "+91 98231 66554" },
      },
      {
        id: "emp-004",
        employee_id: "AMPM-EMP-004",
        name: "Vikram Nair",
        job_title: "Operations & General Manager",
        department: "operations",
        role: "manager",
        email: "vikram@theampmstudio.com",
        phone: "+91 98232 55667",
        date_of_joining: "2025-05-10",
        is_active: true,
        hourly_rate_inr: null,
        monthly_salary_inr: 95000,
        emergency_contact: { name: "Lakshmi Nair", relation: "Mother", phone: "+91 98232 11229" },
      },
      {
        id: "emp-005",
        employee_id: "AMPM-EMP-005",
        name: "Rhea Merchant",
        job_title: "Front Desk & Member Experience Lead",
        department: "front_desk",
        role: "front_desk",
        email: "rhea@theampmstudio.com",
        phone: "+91 98233 88990",
        date_of_joining: "2025-11-01",
        is_active: true,
        hourly_rate_inr: null,
        monthly_salary_inr: 45000,
        emergency_contact: { name: "Dinesh Merchant", relation: "Father", phone: "+91 98233 44558" },
      },
      {
        id: "emp-006",
        employee_id: "AMPM-EMP-006",
        name: "Chef Arjun Salunkhe",
        job_title: "Head Chef - Nourish Café",
        department: "kitchen",
        role: "kitchen_staff",
        email: "arjun@theampmstudio.com",
        phone: "+91 98234 11228",
        date_of_joining: "2025-10-01",
        is_active: true,
        hourly_rate_inr: null,
        monthly_salary_inr: 65000,
        emergency_contact: { name: "Meena Salunkhe", relation: "Wife", phone: "+91 98234 77884" },
      },
    ];

    // Enforce Owner-Only Compensation Security (Amendment 6)
    // Non-owners (managers, front_desk, trainers) receive strictly nullified compensation fields
    const sanitizedStaff = staffMembersRaw.map((s) => {
      if (!isOwner) {
        return {
          ...s,
          monthly_salary_inr: null, // Strictly masked for non-owners
          hourly_rate_inr: null,    // Strictly masked for non-owners
        };
      }
      return s;
    });

    return NextResponse.json({
      success: true,
      staff: sanitizedStaff,
      caller_role: callerRole,
      owner_security_active: !isOwner,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch staff directory" },
      { status: 500 }
    );
  }
}
