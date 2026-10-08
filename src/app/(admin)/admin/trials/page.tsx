"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  RotateCcw,
  AlertCircle,
  Hash,
  Mail,
  User,
} from "lucide-react";

interface TrialUsageItem {
  id: string;
  user_id: string;
  user_name: string;
  normalized_name: string;
  normalized_email: string;
  phone_hash: string;
  is_flagged_duplicate: boolean;
  flag_reason: string | null;
  is_revoked: boolean;
  created_at: string;
  booking_status: string;
}

export default function AdminTrialsPage() {
  const [trials, setTrials] = useState<TrialUsageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadTrials = async () => {
    try {
      const res = await fetch("/api/admin/trials");
      const data = await res.json();
      if (data.trials) {
        setTrials(data.trials);
      }
    } catch (err) {
      console.error("Failed to load trials", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrials();
  }, []);

  const handleAction = async (trialId: string, action: "override" | "revoke") => {
    try {
      const res = await fetch("/api/admin/trials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trialId, action }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback(data.message);
        loadTrials();
        setTimeout(() => setFeedback(null), 4000);
      }
    } catch (err) {
      console.error("Failed to execute trial action", err);
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
            <span className="text-stone-900 font-medium">Trial Safeguards</span>
          </div>
          <h1 className="text-3xl font-serif text-stone-900">
            Free Trial Integrity & Duplicate Audits
          </h1>
          <p className="text-xs text-stone-500 font-light mt-1">
            Heuristic detection flags duplicate accounts sharing identical phone hashes,
            Gmail dot/plus aliases, or normalized names.
          </p>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl text-xs flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Trials Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900" />
            <p className="mt-2 text-xs text-stone-500 font-light">Loading trial records...</p>
          </div>
        ) : trials.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-400 font-light">
            No trial usage records found.
          </div>
        ) : (
          <div className="divide-y divide-stone-100 overflow-x-auto">
            {trials.map((trial) => (
              <div
                key={trial.id}
                className={`p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition ${
                  trial.is_flagged_duplicate && !trial.is_revoked
                    ? "bg-amber-50/40"
                    : trial.is_revoked
                    ? "bg-stone-50 opacity-60"
                    : "hover:bg-stone-50/50"
                }`}
              >
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-serif font-medium text-stone-900">
                      {trial.user_name}
                    </h3>

                    {trial.is_revoked ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-red-100 text-red-800 border border-red-200">
                        Revoked / Cancelled
                      </span>
                    ) : trial.is_flagged_duplicate ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-orange-100 text-orange-800 border border-orange-200 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-orange-600" />
                        Likely Duplicate
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Verified First-Time Member
                      </span>
                    )}

                    <span className="text-[10px] text-stone-400 font-light">
                      {new Date(trial.created_at).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* Flag Reason */}
                  {trial.flag_reason && (
                    <p className="text-xs font-medium text-orange-800">
                      ⚠️ {trial.flag_reason}
                    </p>
                  )}

                  {/* Normalized Data Row */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 font-light pt-1">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-stone-400" />
                      {trial.normalized_email}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Hash className="w-3 h-3 text-stone-400" />
                      Phone Hash: {trial.phone_hash}
                    </span>
                  </div>
                </div>

                {/* Override / Revoke Actions */}
                <div className="flex items-center gap-2 self-end md:self-center">
                  {!trial.is_revoked && trial.is_flagged_duplicate && (
                    <button
                      onClick={() => handleAction(trial.id, "override")}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition shadow-sm"
                    >
                      Override (Approve)
                    </button>
                  )}

                  {!trial.is_revoked && (
                    <button
                      onClick={() => handleAction(trial.id, "revoke")}
                      className="px-3.5 py-2 bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-semibold uppercase tracking-wider transition"
                    >
                      Revoke Trial
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
