"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Trash2,
  VolumeX,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  User,
  Flag,
  MessageSquare,
} from "lucide-react";

interface ReportItem {
  id: string;
  message_id: string;
  reported_by: string;
  reporter_name: string;
  reason: string;
  status: string;
  created_at: string;
  message?: {
    id: string;
    content: string;
    sender_display_name: string;
    sender_id: string;
    created_at: string;
    is_deleted: boolean;
  };
}

export default function AdminModerationPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const loadReports = async () => {
    try {
      const res = await fetch("/api/admin/moderation");
      const data = await res.json();
      if (data.reports) {
        setReports(data.reports);
      }
    } catch (err) {
      console.error("Failed to load moderation reports", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleAction = async (
    report: ReportItem,
    action: "delete_and_resolve" | "mute_and_resolve" | "dismiss",
    muteMinutes?: number
  ) => {
    try {
      const res = await fetch("/api/admin/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: report.id,
          action,
          messageId: report.message?.id || report.message_id,
          targetUserId: report.message?.sender_id,
          muteMinutes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setActionFeedback(data.message || "Action executed");
        setReports((prev) => prev.filter((r) => r.id !== report.id));
        setTimeout(() => setActionFeedback(null), 4000);
      }
    } catch (err) {
      console.error("Failed to perform moderation action", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
            <Link href="/admin" className="hover:text-stone-900 transition">
              PMS Overview
            </Link>
            <span>/</span>
            <span className="text-stone-900 font-medium">Community Moderation</span>
          </div>
          <h1 className="text-3xl font-serif text-stone-900">
            Community Moderation Queue
          </h1>
          <p className="text-xs text-stone-500 font-light mt-1">
            Review reported messages flagged by members. Perform 1-click deletions or
            temporary user mutes.
          </p>
        </div>
      </div>

      {actionFeedback && (
        <div className="p-4 rounded-xl text-xs flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Reports Listing */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900" />
            <p className="mt-2 text-xs text-stone-500 font-light">
              Loading moderation queue...
            </p>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-serif text-stone-800">
              Moderation Queue is Clean
            </h3>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto font-light">
              No pending reports. All member chat interactions are in harmony with shala
              guidelines.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {reports.map((report) => (
              <div
                key={report.id}
                className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:bg-stone-50/50 transition"
              >
                <div className="space-y-3 max-w-2xl">
                  {/* Report Meta */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 font-semibold uppercase tracking-wider text-[10px] border border-rose-200 flex items-center gap-1">
                      <Flag className="w-3 h-3 text-rose-600" /> {report.reason}
                    </span>
                    <span className="text-stone-400">•</span>
                    <span className="text-stone-500">
                      Reported by: <strong>{report.reporter_name}</strong>
                    </span>
                    <span className="text-stone-400">•</span>
                    <span className="text-stone-400 font-light">
                      {new Date(report.created_at).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* Message Content Quote */}
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                    <div className="text-[11px] font-semibold text-stone-700 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-stone-500" />
                      {report.message?.sender_display_name || "Author"} wrote:
                    </div>
                    <p className="text-xs text-stone-800 font-light italic">
                      "{report.message?.content || "(Content unavailable)"}"
                    </p>
                  </div>
                </div>

                {/* 1-Click Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 self-end lg:self-center">
                  <button
                    onClick={() => handleAction(report, "delete_and_resolve")}
                    className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> 1-Click Delete
                  </button>

                  <button
                    onClick={() => handleAction(report, "mute_and_resolve", 1440)}
                    className="px-3.5 py-2 bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-300 rounded-xl text-xs font-semibold uppercase tracking-wider transition flex items-center gap-1.5"
                  >
                    <VolumeX className="w-3.5 h-3.5" /> Mute (24h)
                  </button>

                  <button
                    onClick={() => handleAction(report, "dismiss")}
                    className="px-3.5 py-2 border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl text-xs font-medium transition"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
