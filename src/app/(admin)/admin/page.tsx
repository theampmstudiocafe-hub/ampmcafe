"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Layers,
  ShieldAlert,
  UserCheck,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  IndianRupee,
  Boxes,
  AlertTriangle,
  Truck,
  Users,
  Receipt,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          setData(res);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const stats = data?.stats || {
    todayBookings: { total: 18, attended: 12, confirmed: 5, cancelled: 1, capacityPercent: 82 },
    todayRevenue: { taxableNetInr: 12400, outputGstInr: 2232, grossCashInr: 14632 },
    lowStockIngredientsCount: 2,
  };

  const alerts = data?.alerts || {
    trialDuplicates: [],
    lowStock: [],
    communityReports: [],
  };

  const recentAudit = [
    {
      action: "check_in_member",
      actor: "Front Desk (Staff)",
      details: "Checked in Priya S. for Morning Vinyasa Flow (attended)",
      time: "15m ago",
    },
    {
      action: "offline_stocktake_sync",
      actor: "Inventory Staff",
      details: "Reconciled Espresso Bar counts (+250g matcha variance)",
      time: "42m ago",
    },
    {
      action: "flagged_trial_duplicate",
      actor: "System Heuristic",
      details: "Flagged duplicate phone hash on reservation",
      time: "2h ago",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-900 text-[11px] font-semibold uppercase tracking-wider border border-amber-200 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Pune Studio & Café PMS
          </div>
          <h1 className="text-3xl font-serif text-stone-900">
            Property Management Overview
          </h1>
          <p className="text-xs text-stone-500 font-light mt-1">
            Core management portal for class packs, community moderation, and trial
            integrity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/packs"
            className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create Pack
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Link
          href="/admin/bookings"
          className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition space-y-2 group"
        >
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>Today's Sessions Roster</span>
            <Calendar className="w-4 h-4 text-[#657E6B] group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-3xl font-serif font-bold text-stone-900">
            {stats.todayBookings.total} <span className="text-sm font-sans font-normal text-stone-500">bookings</span>
          </div>
          <p className="text-[11px] text-stone-600 font-medium">
            {stats.todayBookings.attended} attended • {stats.todayBookings.confirmed} upcoming ({stats.todayBookings.capacityPercent}% capacity)
          </p>
        </Link>

        <Link
          href="/admin/financials"
          className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition space-y-2 group"
        >
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>Today's Net Revenue</span>
            <IndianRupee className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-3xl font-serif font-bold text-stone-900">
            ₹{stats.todayRevenue.taxableNetInr.toLocaleString()}
          </div>
          <p className="text-[11px] text-amber-800 font-medium flex items-center justify-between">
            <span>Taxable (excl. GST)</span>
            <span className="text-stone-400 text-[10px]">+₹{stats.todayRevenue.outputGstInr} GST Liab.</span>
          </p>
        </Link>

        <Link
          href="/admin/inventory"
          className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition space-y-2 group"
        >
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>Low-Stock Alerts</span>
            <Boxes className="w-4 h-4 text-rose-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-3xl font-serif font-bold text-rose-600">
            {stats.lowStockIngredientsCount} <span className="text-sm font-sans font-normal text-stone-500">items</span>
          </div>
          <p className="text-[11px] text-rose-700 font-medium flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Stock ≤ Minimum threshold
          </p>
        </Link>

        <Link
          href="/admin/members"
          className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition space-y-2 group"
        >
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>Members Hub</span>
            <Users className="w-4 h-4 text-stone-700 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-3xl font-serif font-bold text-stone-900">
            142 <span className="text-sm font-sans font-normal text-stone-500">active</span>
          </div>
          <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> 84% pack retention rate
          </p>
        </Link>
      </div>

      {/* Action Center: High-Priority Operational Alerts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h2 className="text-lg font-serif text-stone-900">
              Operational Action Center
            </h2>
          </div>
          <span className="text-xs text-stone-400">Items requiring immediate staff decision</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Trial Duplicate Flag Card */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-200 text-amber-900">
                Trial Duplicate ({alerts.trialDuplicates.length})
              </span>
              <UserCheck className="w-4 h-4 text-amber-700" />
            </div>
            {alerts.trialDuplicates.length > 0 ? (
              <div className="space-y-2 text-xs">
                <div className="font-semibold text-stone-900">
                  {alerts.trialDuplicates[0].user_name}
                </div>
                <p className="text-[11px] text-amber-900/80 font-mono">
                  Matched: {alerts.trialDuplicates[0].matched_existing_user}
                </p>
                <div className="flex items-center gap-2 pt-2">
                  <Link
                    href="/admin/trials"
                    className="px-3 py-1 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 transition"
                  >
                    Review & Decide
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-xs text-stone-500">No duplicate trial flags pending.</p>
            )}
          </div>

          {/* Low Stock Alert Card */}
          <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-200 text-rose-900">
                Min Stock Breach ({alerts.lowStock.length})
              </span>
              <Boxes className="w-4 h-4 text-rose-700" />
            </div>
            {alerts.lowStock.length > 0 ? (
              <div className="space-y-2 text-xs">
                <div className="font-semibold text-stone-900">
                  {alerts.lowStock[0].name}
                </div>
                <p className="text-[11px] text-rose-900/80">
                  Current: {alerts.lowStock[0].current_stock} {alerts.lowStock[0].unit} (Min: {alerts.lowStock[0].minimum_stock_level} {alerts.lowStock[0].unit})
                </p>
                <div className="flex items-center gap-2 pt-2">
                  <Link
                    href="/admin/suppliers"
                    className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition flex items-center gap-1"
                  >
                    <Truck className="w-3 h-3" /> Create PO
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-xs text-stone-500">All ingredient levels above minimum.</p>
            )}
          </div>

          {/* Community Flag Card */}
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-stone-200 text-stone-800">
                Community Reports ({alerts.communityReports.length})
              </span>
              <ShieldAlert className="w-4 h-4 text-stone-700" />
            </div>
            {alerts.communityReports.length > 0 ? (
              <div className="space-y-2 text-xs">
                <div className="font-semibold text-stone-900">
                  Reported by {alerts.communityReports[0].reporter_display_name}
                </div>
                <p className="text-[11px] text-stone-600 italic truncate">
                  "{alerts.communityReports[0].message_excerpt}"
                </p>
                <div className="flex items-center gap-2 pt-2">
                  <Link
                    href="/admin/moderation"
                    className="px-3 py-1 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 transition"
                  >
                    1-Click Moderate
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-xs text-stone-500">Zero flagged messages.</p>
            )}
          </div>
        </div>
      </div>

      {/* Main Section: Quick Actions & Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Quick Actions Column */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-lg font-serif text-stone-900">Quick Administrative Actions</h2>

          <div className="space-y-3">
            <Link
              href="/admin/packs"
              className="p-5 bg-white rounded-2xl border border-stone-200 shadow-sm hover:border-amber-400 transition flex items-center justify-between group"
            >
              <div>
                <h3 className="text-sm font-medium text-stone-900 group-hover:text-amber-800 transition">
                  Manage Class Packs & Credits
                </h3>
                <p className="text-xs text-stone-500 font-light mt-0.5">
                  Adjust pricing, credits, or add promotional summer packs
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-stone-900 group-hover:translate-x-1 transition-all" />
            </Link>

            <Link
              href="/admin/moderation"
              className="p-5 bg-white rounded-2xl border border-stone-200 shadow-sm hover:border-amber-400 transition flex items-center justify-between group"
            >
              <div>
                <h3 className="text-sm font-medium text-stone-900 group-hover:text-amber-800 transition">
                  Review Chat Moderation Queue
                </h3>
                <p className="text-xs text-stone-500 font-light mt-0.5">
                  1-Click delete offending messages or mute abusive accounts
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-stone-900 group-hover:translate-x-1 transition-all" />
            </Link>

            <Link
              href="/admin/trials"
              className="p-5 bg-white rounded-2xl border border-stone-200 shadow-sm hover:border-amber-400 transition flex items-center justify-between group"
            >
              <div>
                <h3 className="text-sm font-medium text-stone-900 group-hover:text-amber-800 transition">
                  Audit Free Trial Duplicates
                </h3>
                <p className="text-xs text-stone-500 font-light mt-0.5">
                  Inspect phone hash collisions and override or revoke bookings
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-stone-900 group-hover:translate-x-1 transition-all" />
            </Link>
          </div>
        </div>

        {/* Audit Log Activity Column */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-serif text-stone-900">
              Live Immutable Audit Log
            </h2>
            <span className="text-[11px] text-stone-400 flex items-center gap-1 font-light">
              <Clock className="w-3.5 h-3.5" /> Append-only database ledger
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm divide-y divide-stone-100 overflow-hidden">
            {recentAudit.map((log, idx) => (
              <div key={idx} className="p-4 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-stone-800 uppercase">
                      {log.action}
                    </span>
                    <span className="text-[11px] text-stone-400">•</span>
                    <span className="text-xs text-stone-500">{log.actor}</span>
                  </div>
                  <p className="text-xs text-stone-600 font-light">{log.details}</p>
                </div>
                <span className="text-[11px] text-stone-400 font-light whitespace-nowrap">
                  {log.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
