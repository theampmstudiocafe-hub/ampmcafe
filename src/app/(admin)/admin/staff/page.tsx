"use client";

import React, { useState, useEffect } from "react";
import {
  UserCheck,
  Search,
  Filter,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Eye,
  EyeOff,
  Briefcase,
  Phone,
  Mail,
  Calendar,
  IndianRupee,
  Lock,
  Sparkles,
  Users,
  CheckCircle2,
  Clock,
  HeartHandshake,
} from "lucide-react";

interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
}

interface StaffMember {
  id: string;
  employee_id: string;
  name: string;
  job_title: string;
  department: string;
  role: string;
  email: string;
  phone: string;
  date_of_joining: string;
  is_active: boolean;
  hourly_rate_inr: number | null;
  monthly_salary_inr: number | null;
  emergency_contact: EmergencyContact;
}

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [isOwnerView, setIsOwnerView] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  const fetchStaff = () => {
    setLoading(true);
    const headers: Record<string, string> = {
      "x-ampm-role": isOwnerView ? "owner" : "manager",
    };

    fetch("/api/admin/staff", { headers })
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          setStaff(res.staff);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStaff();
  }, [isOwnerView]);

  const filteredStaff = staff.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(search.toLowerCase()) ||
      member.job_title.toLowerCase().includes(search.toLowerCase()) ||
      member.employee_id.toLowerCase().includes(search.toLowerCase());
    const matchesDept =
      departmentFilter === "all" || member.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-900 text-[11px] font-semibold uppercase tracking-wider border border-emerald-200 mb-2">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            Human Resources & Governance
          </div>
          <h1 className="text-3xl font-serif text-stone-900">
            Staff & Practitioner Directory
          </h1>
          <p className="text-xs text-stone-500 font-light mt-1">
            Certified yoga guides, sound alchemists, front desk hosts, and kitchen crew. Compensation strictly restricted to owner role.
          </p>
        </div>

        {/* Role View Toggle: Owner vs Non-Owner */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-stone-100 p-1.5 rounded-xl border border-stone-200 text-xs">
            <span className="text-[11px] font-medium text-stone-600 pl-1">
              Viewer Role:
            </span>
            <button
              onClick={() => setIsOwnerView(true)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all text-xs flex items-center gap-1.5 ${
                isOwnerView
                  ? "bg-stone-900 text-stone-50 shadow-sm"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Owner (Unlocked)
            </button>
            <button
              onClick={() => setIsOwnerView(false)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all text-xs flex items-center gap-1.5 ${
                !isOwnerView
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              Staff / Manager (Masked)
            </button>
          </div>
        </div>
      </div>

      {/* Security Banner if Masked */}
      {!isOwnerView && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            <span className="font-semibold">Security Governance Active (Amendment 6):</span>{" "}
            You are viewing the staff directory with non-owner credentials. Base salaries and hourly rates are strictly redacted at the API boundary to safeguard payroll confidentiality.
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, title, or employee ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {[
            { id: "all", label: "All Departments" },
            { id: "studio", label: "Studio Guides" },
            { id: "front_desk", label: "Front Desk" },
            { id: "kitchen", label: "Nourish Café" },
            { id: "operations", label: "Operations" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDepartmentFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                departmentFilter === tab.id
                  ? "bg-stone-900 text-stone-100"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Grid / Table */}
      {loading ? (
        <div className="py-20 text-center text-xs text-stone-400 animate-pulse">
          Loading practitioner and staff records...
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-stone-200 bg-stone-50/50">
          <Users className="w-8 h-8 text-stone-300 mx-auto mb-2" />
          <p className="text-sm font-serif text-stone-700">No staff members found</p>
          <p className="text-xs text-stone-400 mt-1">Try adjusting your search query or department filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStaff.map((member) => (
            <div
              key={member.id}
              onClick={() => setSelectedStaff(member)}
              className="group p-5 rounded-2xl bg-white border border-stone-200/80 hover:border-stone-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="text-[10px] font-mono tracking-wider text-stone-400 uppercase">
                      {member.employee_id}
                    </span>
                    <h3 className="text-base font-serif font-medium text-stone-900 group-hover:text-amber-900 transition-colors">
                      {member.name}
                    </h3>
                    <p className="text-xs text-stone-500 font-light mt-0.5">
                      {member.job_title}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wide border ${
                      member.department === "studio"
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : member.department === "kitchen"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : member.department === "front_desk"
                        ? "bg-blue-50 text-blue-800 border-blue-200"
                        : "bg-purple-50 text-purple-800 border-purple-200"
                    }`}
                  >
                    {member.department.replace("_", " ")}
                  </span>
                </div>

                <div className="space-y-1.5 py-3 border-t border-b border-stone-100 text-xs text-stone-600">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                    <span>{member.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                    <span>Joined: {new Date(member.date_of_joining).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</span>
                  </div>
                </div>
              </div>

              {/* Compensation Section */}
              <div className="mt-4 pt-3 flex items-center justify-between text-xs">
                <span className="text-[11px] text-stone-400">Compensation:</span>
                {isOwnerView ? (
                  <div className="text-right">
                    {member.monthly_salary_inr ? (
                      <div className="font-semibold text-stone-900">
                        ₹{member.monthly_salary_inr.toLocaleString("en-IN")}/mo
                      </div>
                    ) : null}
                    {member.hourly_rate_inr ? (
                      <div className="text-[10px] text-stone-500">
                        ₹{member.hourly_rate_inr.toLocaleString("en-IN")}/hr (class)
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-stone-100 text-stone-400 text-[11px] font-mono">
                    <Lock className="w-3 h-3" />
                    Owner Confidential
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Staff Dossier Drawer */}
      {selectedStaff && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-md bg-white h-full shadow-2xl p-6 overflow-y-auto space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-start justify-between pb-4 border-b border-stone-200">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
                    {selectedStaff.employee_id}
                  </span>
                  <h2 className="text-xl font-serif font-medium text-stone-900">
                    {selectedStaff.name}
                  </h2>
                  <p className="text-xs text-stone-500">{selectedStaff.job_title}</p>
                </div>
                <button
                  onClick={() => setSelectedStaff(null)}
                  className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                  Employment Details
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                    <span className="text-stone-400 block text-[10px]">Department</span>
                    <span className="font-medium text-stone-800 capitalize">
                      {selectedStaff.department.replace("_", " ")}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                    <span className="text-stone-400 block text-[10px]">Status</span>
                    <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                      <CheckCircle2 className="w-3 h-3" /> Active
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                    <span className="text-stone-400 block text-[10px]">Date of Joining</span>
                    <span className="font-medium text-stone-800">
                      {new Date(selectedStaff.date_of_joining).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                    <span className="text-stone-400 block text-[10px]">System Role</span>
                    <span className="font-medium text-stone-800 font-mono">
                      {selectedStaff.role}
                    </span>
                  </div>
                </div>

                <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400 pt-2">
                  Emergency Contact (Duty of Care)
                </h4>
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-100 text-xs space-y-1">
                  <div className="font-medium text-stone-800">
                    {selectedStaff.emergency_contact.name} ({selectedStaff.emergency_contact.relation})
                  </div>
                  <div className="text-stone-500 font-mono text-[11px]">
                    {selectedStaff.emergency_contact.phone}
                  </div>
                </div>

                <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400 pt-2">
                  Compensation Package
                </h4>
                {isOwnerView ? (
                  <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-stone-600">Base Monthly Salary:</span>
                      <span className="font-semibold text-stone-900">
                        {selectedStaff.monthly_salary_inr
                          ? `₹${selectedStaff.monthly_salary_inr.toLocaleString("en-IN")}`
                          : "N/A"}
                      </span>
                    </div>
                    {selectedStaff.hourly_rate_inr && (
                      <div className="flex justify-between items-center pt-1 border-t border-emerald-200/50">
                        <span className="text-stone-600">Class Rate (Hourly):</span>
                        <span className="font-semibold text-stone-900">
                          ₹{selectedStaff.hourly_rate_inr.toLocaleString("en-IN")}/hr
                        </span>
                      </div>
                    )}
                    <div className="text-[10px] text-emerald-800 pt-1">
                      Visible exclusively to owner credentials.
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-stone-100 border border-stone-200 text-center text-xs text-stone-500 flex flex-col items-center gap-1">
                    <Lock className="w-4 h-4 text-stone-400" />
                    <span className="font-medium text-stone-700">Compensation Redacted</span>
                    <span className="text-[11px]">Owner role required to view salary and rate structures.</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setSelectedStaff(null)}
              className="w-full py-2.5 rounded-xl bg-stone-900 text-stone-50 text-xs font-medium hover:bg-stone-800 transition-colors"
            >
              Close Dossier
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
