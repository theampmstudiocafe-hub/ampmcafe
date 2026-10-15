"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Layers,
  Calendar,
  IndianRupee,
  Phone,
  Mail,
  ChevronRight,
  X,
  PlusCircle,
  MinusCircle,
  Eye,
  CheckCircle2,
  Clock,
} from "lucide-react";

export default function AdminMembersPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [isTrainerMode, setIsTrainerMode] = useState(false);

  const fetchMembers = () => {
    setLoading(true);
    const headers: Record<string, string> = {};
    if (isTrainerMode) {
      headers["x-ampm-role"] = "trainer";
    }

    fetch(`/api/admin/members?search=${encodeURIComponent(search)}&filter=${filter}`, {
      headers,
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          setMembers(res.members);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMembers();
  }, [search, filter, isTrainerMode]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-900 text-[11px] font-semibold uppercase tracking-wider border border-amber-200 mb-2">
            <Users className="w-3.5 h-3.5 text-amber-600" />
            Members & Studio Community
          </div>
          <h1 className="text-3xl font-serif text-stone-900">
            Members Directory
          </h1>
          <p className="text-xs text-stone-500 font-light mt-1">
            Complete member records, pack credit balances, attendance history, trial integrity, and lifetime spend.
          </p>
        </div>

        {/* Role View Toggle to demonstrate Trainer Privacy Guard */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-stone-100 p-1.5 rounded-xl border border-stone-200 text-xs">
            <span className="text-[11px] font-medium text-stone-600 pl-1">
              Role Simulator:
            </span>
            <button
              onClick={() => setIsTrainerMode(false)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                !isTrainerMode
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-500 hover:text-stone-900"
              }`}
            >
              Management / Front Desk
            </button>
            <button
              onClick={() => setIsTrainerMode(true)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                isTrainerMode
                  ? "bg-amber-500 text-stone-950 font-bold shadow-sm"
                  : "text-stone-500 hover:text-stone-900"
              }`}
            >
              Trainer View (Masked)
            </button>
          </div>
        </div>
      </div>

      {isTrainerMode && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-xs text-amber-950">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            <strong>Trainer Privacy Active:</strong> Member personal emails, phone numbers, and financial spend are strictly stripped. Instructors have access to emergency contacts for active classes only.
          </span>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-xl text-xs bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { id: "all", label: "All Members" },
            { id: "active_pack", label: "Active Packs" },
            { id: "trial", label: "Free Trial" },
            { id: "flagged", label: "Duplicate Flags" },
            { id: "moderated", label: "Muted / Banned" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition ${
                filter === tab.id
                  ? "bg-stone-900 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-[10px] font-mono uppercase tracking-wider text-stone-500">
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4">Active Pack Credits</th>
                <th className="py-3 px-4">Attendance Rate</th>
                <th className="py-3 px-4">Trial Status</th>
                <th className="py-3 px-4">Lifetime Spend</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {members.map((m) => {
                const totalBookings = m.attendance?.total_booked || 0;
                const attended = m.attendance?.attended || 0;
                const attendanceRate =
                  totalBookings > 0
                    ? Math.round((attended / totalBookings) * 100)
                    : 0;

                const primaryPack = m.active_packs?.[0];

                return (
                  <tr key={m.id} className="hover:bg-stone-50/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-stone-900">
                        {m.display_name}
                      </div>
                      <div className="text-[10px] text-stone-400 font-mono">
                        ID: {m.id} • Joined {m.date_joined}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {isTrainerMode ? (
                        <span className="text-[11px] text-stone-400 italic">
                          Protected (Trainer RLS)
                        </span>
                      ) : (
                        <div className="space-y-0.5 text-[11px]">
                          <div className="text-stone-700 font-mono">{m.email}</div>
                          <div className="text-stone-400 font-mono">{m.phone}</div>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {primaryPack ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                            <Layers className="w-3 h-3" />
                            {primaryPack.credits_remaining} Credits Left
                          </span>
                          <div className="text-[10px] text-stone-400 truncate max-w-xs">
                            {primaryPack.name}
                          </div>
                        </div>
                      ) : (
                        <span className="text-stone-400 text-[11px]">No active pack</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-stone-800">
                        {attendanceRate}%
                      </div>
                      <div className="text-[10px] text-stone-400">
                        {attended}/{totalBookings} attended
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {m.trial_status === "eligible" ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                          Trial Eligible
                        </span>
                      ) : m.trial_status === "flagged_duplicate" ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1 w-max">
                          <AlertTriangle className="w-3 h-3" /> Flagged Duplicate
                        </span>
                      ) : (
                        <span className="text-[11px] text-stone-500">Trial Used</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-semibold">
                      {isTrainerMode ? (
                        <span className="text-stone-400 italic font-sans font-normal text-[11px]">
                          —
                        </span>
                      ) : (
                        `₹${(m.lifetime_spend_inr || 0).toLocaleString()}`
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedMember(m)}
                        className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Dossier
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Member Dossier Drawer Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 bg-stone-950/50 backdrop-blur-sm flex justify-end animate-fade-in">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between border-l border-stone-200 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-stone-200">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-700 font-bold">
                    Member Dossier
                  </span>
                  <h2 className="text-xl font-serif font-bold text-stone-900 mt-0.5">
                    {selectedMember.display_name}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedMember(null)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Contact Card (Role Guarded) */}
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Contact Information
                </span>
                {isTrainerMode ? (
                  <p className="text-xs text-stone-500 italic">
                    Contact details protected under Trainer privacy policy.
                  </p>
                ) : (
                  <div className="space-y-1.5 text-xs text-stone-800">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-stone-400" />
                      <span>{selectedMember.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-stone-400" />
                      <span>{selectedMember.phone}</span>
                    </div>
                  </div>
                )}

                {/* Emergency Contact (Always available for instructors / duty of care) */}
                <div className="pt-2 border-t border-stone-200/80 mt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 block">
                    Emergency Contact (Medical / Instructor Duty of Care)
                  </span>
                  <p className="text-xs font-semibold text-stone-900 mt-0.5">
                    {selectedMember.emergency_contact?.name || "None on file"}
                  </p>
                  {selectedMember.emergency_contact?.phone && (
                    <p className="text-xs text-stone-600 font-mono">
                      {selectedMember.emergency_contact.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Active Packs & Credits */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                    Class Packs & Ledgers
                  </h3>
                  <Link
                    href="/admin/packs"
                    className="text-xs text-amber-700 font-semibold hover:underline"
                  >
                    Adjust Credits →
                  </Link>
                </div>

                {selectedMember.active_packs?.length > 0 ? (
                  selectedMember.active_packs.map((p: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-stone-900">
                          {p.name}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-200 text-amber-950 font-mono">
                          {p.credits_remaining} Credits
                        </span>
                      </div>
                      {p.expires_at && (
                        <p className="text-[11px] text-stone-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-stone-400" /> Expires on{" "}
                          {new Date(p.expires_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-stone-500 italic p-4 bg-stone-50 rounded-xl">
                    No active credit packs.
                  </p>
                )}
              </div>

              {/* Attendance Breakdown */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  Attendance Record
                </h3>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <div className="text-lg font-bold text-emerald-700">
                      {selectedMember.attendance?.attended || 0}
                    </div>
                    <div className="text-[10px] text-stone-500">Attended</div>
                  </div>
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <div className="text-lg font-bold text-stone-700">
                      {selectedMember.attendance?.cancelled_in_window || 0}
                    </div>
                    <div className="text-[10px] text-stone-500">12h Refunded</div>
                  </div>
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <div className="text-lg font-bold text-rose-700">
                      {selectedMember.attendance?.late_cancelled_no_show || 0}
                    </div>
                    <div className="text-[10px] text-stone-500">No Show / Late</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-stone-700">
                {!isTrainerMode && `Lifetime Spend: ₹${(selectedMember.lifetime_spend_inr || 0).toLocaleString()}`}
              </span>
              <button
                onClick={() => setSelectedMember(null)}
                className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
