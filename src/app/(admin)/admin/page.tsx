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
} from "lucide-react";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    activePacksCount: 4,
    pendingReportsCount: 1,
    flaggedTrialsCount: 2,
    scheduledSessionsToday: 6,
  });

  const [recentAudit, setRecentAudit] = useState([
    {
      action: "update_pack_type",
      actor: "Admin (Owner)",
      details: "Updated 10-Class Practice Pack validity to 60 days",
      time: "25m ago",
    },
    {
      action: "create_booking",
      actor: "Priya S. (Member)",
      details: "Booked spot for Morning Vinyasa Flow with credit pack",
      time: "1h ago",
    },
    {
      action: "report_community_message",
      actor: "Aarav K. (Member)",
      details: "Flagged promotional spam message in community chat",
      time: "2h ago",
    },
    {
      action: "trial_flagged_duplicate",
      actor: "System Heuristic",
      details: "Flagged duplicate phone hash on free trial reservation",
      time: "4h ago",
    },
  ]);

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
          href="/admin/packs"
          className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition space-y-2 group"
        >
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>Class Pack Tiers</span>
            <Layers className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-3xl font-serif font-bold text-stone-900">
            {stats.activePacksCount}
          </div>
          <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> All active on public site
          </p>
        </Link>

        <Link
          href="/admin/moderation"
          className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition space-y-2 group"
        >
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>Pending Reports</span>
            <ShieldAlert className="w-4 h-4 text-rose-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-3xl font-serif font-bold text-stone-900">
            {stats.pendingReportsCount}
          </div>
          <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Requires 1-click review
          </p>
        </Link>

        <Link
          href="/admin/trials"
          className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition space-y-2 group"
        >
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>Flagged Free Trials</span>
            <UserCheck className="w-4 h-4 text-orange-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-3xl font-serif font-bold text-stone-900">
            {stats.flaggedTrialsCount}
          </div>
          <p className="text-[11px] text-orange-600 font-medium">
            Duplicate phone / alias detected
          </p>
        </Link>

        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>Scheduled Today</span>
            <Calendar className="w-4 h-4 text-[#657E6B]" />
          </div>
          <div className="text-3xl font-serif font-bold text-stone-900">
            {stats.scheduledSessionsToday}
          </div>
          <p className="text-[11px] text-stone-400">Classes across both shalas</p>
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
