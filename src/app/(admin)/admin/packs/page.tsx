"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Layers,
  Plus,
  Edit2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  X,
  ArrowLeft,
  Sparkles,
  IndianRupee,
  Clock,
  Calendar,
} from "lucide-react";

interface PackType {
  id: string;
  name: string;
  description: string | null;
  price_inr: number;
  credits: number;
  validity_days: number;
  active: boolean;
  display_order: number;
}

export default function AdminPacksPage() {
  const [packs, setPacks] = useState<PackType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPack, setEditingPack] = useState<PackType | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; isError: boolean } | null>(null);
  const [activeTab, setActiveTab] = useState<"tiers" | "adjust" | "audit">("tiers");
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Manual Credit Adjustment state
  const [adjustmentForm, setAdjustmentForm] = useState({
    member_id: "mem-01",
    member_name: "Priya Sharma",
    staff_role: "front_desk",
    staff_name: "Front Desk Staff",
    credit_delta: 1,
    reason: "",
    submitting: false,
    message: null as string | null,
    error: null as string | null,
  });

  // Form fields
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price_inr: 5000,
    credits: 10,
    validity_days: 60,
    active: true,
    display_order: 1,
  });

  const loadPacks = async () => {
    try {
      const res = await fetch("/api/admin/packs");
      const data = await res.json();
      if (data.packs) {
        setPacks(data.packs);
      }
    } catch (err) {
      console.error("Failed to load packs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPacks();
  }, []);

  const openCreateModal = () => {
    setFormData({
      name: "",
      description: "",
      price_inr: 3000,
      credits: 5,
      validity_days: 45,
      active: true,
      display_order: packs.length + 1,
    });
    setIsCreating(true);
    setEditingPack(null);
  };

  const openEditModal = (pack: PackType) => {
    setFormData({
      name: pack.name,
      description: pack.description || "",
      price_inr: pack.price_inr,
      credits: pack.credits,
      validity_days: pack.validity_days,
      active: pack.active,
      display_order: pack.display_order,
    });
    setEditingPack(pack);
    setIsCreating(false);
  };

  const handleSavePack = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      if (isCreating) {
        const res = await fetch("/api/admin/packs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create pack");
        setFeedback({ text: "Pack tier created successfully!", isError: false });
      } else if (editingPack) {
        const res = await fetch("/api/admin/packs", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingPack.id, ...formData }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update pack");
        setFeedback({ text: "Pack updated successfully!", isError: false });
      }

      setIsCreating(false);
      setEditingPack(null);
      loadPacks();
    } catch (err: any) {
      setFeedback({ text: err.message || "Operation failed", isError: true });
    } finally {
      setSaving(false);
    }
  };

  const togglePackStatus = async (pack: PackType) => {
    try {
      const newActive = !pack.active;
      setPacks((prev) =>
        prev.map((p) => (p.id === pack.id ? { ...p, active: newActive } : p))
      );

      await fetch("/api/admin/packs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: pack.id, active: newActive }),
      });
    } catch (err) {
      console.error("Failed to toggle pack status", err);
      loadPacks();
    }
  };

  const loadAuditReport = async () => {
    try {
      const res = await fetch("/api/admin/packs/audit-report");
      const data = await res.json();
      if (data.audit_records) {
        setAuditLogs(data.audit_records);
      }
    } catch (err) {
      console.error("Failed to load audit report", err);
    }
  };

  useEffect(() => {
    if (activeTab === "audit") {
      loadAuditReport();
    }
  }, [activeTab]);

  const handleCreditAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdjustmentForm((prev) => ({ ...prev, submitting: true, error: null, message: null }));

    try {
      const res = await fetch("/api/admin/packs/adjust-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          member_id: adjustmentForm.member_id,
          member_name: adjustmentForm.member_name,
          credit_delta: adjustmentForm.credit_delta,
          reason: adjustmentForm.reason,
          staff_role: adjustmentForm.staff_role,
          staff_name: adjustmentForm.staff_name,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to adjust credits");
      }

      setAdjustmentForm((prev) => ({
        ...prev,
        submitting: false,
        reason: "",
        message: data.message,
      }));
    } catch (err: any) {
      setAdjustmentForm((prev) => ({
        ...prev,
        submitting: false,
        error: err.message || "Failed to adjust credits",
      }));
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
            <span className="text-stone-900 font-medium">Class Packs</span>
          </div>
          <h1 className="text-3xl font-serif text-stone-900">
            Class Packs & Credits Pricing
          </h1>
          <p className="text-xs text-stone-500 font-light mt-1">
            Packs create immutable credit ledgers upon purchase. You can adjust price,
            credits, and validity.
          </p>
        </div>

        {activeTab === "tiers" && (
          <button
            onClick={openCreateModal}
            className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create New Pack
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("tiers")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
            activeTab === "tiers"
              ? "bg-stone-900 text-white shadow-sm"
              : "text-stone-600 hover:bg-stone-100"
          }`}
        >
          Class Pack Pricing Tiers
        </button>
        <button
          onClick={() => setActiveTab("adjust")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
            activeTab === "adjust"
              ? "bg-amber-500 text-stone-950 shadow-sm font-bold"
              : "text-stone-600 hover:bg-stone-100"
          }`}
        >
          Manual Credit Adjustment Tool
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
            activeTab === "audit"
              ? "bg-stone-900 text-white shadow-sm"
              : "text-stone-600 hover:bg-stone-100"
          }`}
        >
          Owner Overrides & Adjustments Audit
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2 border ${
            feedback.isError
              ? "bg-rose-50 text-rose-800 border-rose-200"
              : "bg-emerald-50 text-emerald-800 border-emerald-200"
          }`}
        >
          {feedback.isError ? (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* TAB 1: Packs Table / List */}
      {activeTab === "tiers" && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900" />
              <p className="mt-2 text-xs text-stone-500 font-light">Loading class packs...</p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {packs.map((pack) => (
                <div
                  key={pack.id}
                  className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-50/50 transition"
                >
                  <div className="space-y-1 max-w-lg">
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-serif font-medium text-stone-900">
                        {pack.name}
                      </h3>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                          pack.active
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-stone-100 text-stone-500 border border-stone-200"
                        }`}
                      >
                        {pack.active ? "Active on Website" : "Inactive / Hidden"}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 font-light leading-relaxed">
                      {pack.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-stone-600 pt-2">
                      <span className="flex items-center gap-1 font-semibold text-stone-900">
                        ₹{pack.price_inr}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-amber-800">
                        <Layers className="w-3.5 h-3.5" /> {pack.credits} Credits
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-stone-500">
                        <Clock className="w-3.5 h-3.5" /> {pack.validity_days} Days Validity
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <button
                      onClick={() => togglePackStatus(pack)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                        pack.active
                          ? "bg-white border-stone-200 text-stone-700 hover:bg-stone-100"
                          : "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100"
                      }`}
                    >
                      {pack.active ? "Deactivate" : "Activate"}
                    </button>

                    <button
                      onClick={() => openEditModal(pack)}
                      className="p-2 border border-stone-200 hover:border-stone-900 rounded-lg text-stone-600 hover:text-stone-900 transition"
                      title="Edit Pack Tier"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Manual Credit Adjustment Tool (Online-Only, Tiered Role Cap) */}
      {activeTab === "adjust" && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 max-w-2xl mx-auto space-y-6">
          <div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-900 mb-2">
              Staff Credit Adjustment
            </div>
            <h2 className="text-xl font-serif font-bold text-stone-900">
              Manual Member Credit Ledger Adjustment
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Directly adjust a member's pack credits. Front desk adjustments are strictly capped at maximum ±2 cumulative credits per member per calendar day (Fix 2). Repeat adjustments are automatically flagged in the Owner Audit Report. All adjustments commit an atomic record to the immutable credit ledger and audit log.
            </p>
          </div>

          {adjustmentForm.message && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{adjustmentForm.message}</span>
            </div>
          )}

          {adjustmentForm.error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{adjustmentForm.error}</span>
            </div>
          )}

          <form onSubmit={handleCreditAdjustment} className="space-y-4 text-xs">
            {/* Member Selection */}
            <div className="space-y-1">
              <label className="font-semibold text-stone-700">Select Member *</label>
              <select
                value={adjustmentForm.member_id}
                onChange={(e) => {
                  const id = e.target.value;
                  const name =
                    id === "mem-01" ? "Priya Sharma" : id === "mem-02" ? "Aarav Kapoor" : "Rohan Verma";
                  setAdjustmentForm((prev) => ({
                    ...prev,
                    member_id: id,
                    member_name: name,
                  }));
                }}
                className="w-full p-2.5 border border-stone-300 rounded-xl bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              >
                <option value="mem-01">Priya Sharma (Current Balance: 6 credits)</option>
                <option value="mem-02">Aarav Kapoor (Current Balance: 14 credits)</option>
                <option value="mem-04">Rohan Verma (Current Balance: 1 credit)</option>
              </select>
            </div>

            {/* Staff Role Selector (demonstrating role caps) */}
            <div className="space-y-1">
              <label className="font-semibold text-stone-700">Acting Staff Role *</label>
              <select
                value={adjustmentForm.staff_role}
                onChange={(e) =>
                  setAdjustmentForm((prev) => ({
                    ...prev,
                    staff_role: e.target.value,
                    staff_name:
                      e.target.value === "front_desk"
                        ? "Front Desk Staff (Rhea)"
                        : "Studio Manager (Vikram)",
                  }))
                }
                className="w-full p-2.5 border border-stone-300 rounded-xl bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono"
              >
                <option value="front_desk">Front Desk (Capped at ±2 credits max)</option>
                <option value="manager">Studio Manager (Unlimited adjustment)</option>
                <option value="owner">Studio Owner (Unlimited adjustment)</option>
              </select>
              {adjustmentForm.staff_role === "front_desk" && (
                <p className="text-[11px] text-amber-800 font-medium pt-1">
                  🔒 Front desk cap active: Adjustments &gt; 2 credits are rejected.
                </p>
              )}
            </div>

            {/* Credit Delta */}
            <div className="space-y-1">
              <label className="font-semibold text-stone-700">Credit Delta (Amount to Add/Deduct) *</label>
              <input
                type="number"
                value={adjustmentForm.credit_delta}
                onChange={(e) =>
                  setAdjustmentForm((prev) => ({
                    ...prev,
                    credit_delta: parseInt(e.target.value) || 0,
                  }))
                }
                className="w-full p-2.5 border border-stone-300 rounded-xl font-mono text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
              <span className="text-[11px] text-stone-400">
                Use positive numbers to add credits (+1, +2), or negative to deduct (-1, -2).
              </span>
            </div>

            {/* Mandatory Reason */}
            <div className="space-y-1">
              <label className="font-semibold text-stone-700">
                Mandatory Adjustment Reason * (Min 5 chars)
              </label>
              <textarea
                rows={3}
                placeholder="e.g., Extended validity due to doctor's note; goodwill compensation..."
                value={adjustmentForm.reason}
                onChange={(e) =>
                  setAdjustmentForm((prev) => ({ ...prev, reason: e.target.value }))
                }
                className="w-full p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={adjustmentForm.submitting}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 font-bold text-stone-950 rounded-xl transition shadow-sm disabled:opacity-50"
            >
              {adjustmentForm.submitting ? "Committing Ledger Entry..." : "Submit Credit Adjustment"}
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: Owner Overrides & Adjustments Audit Report */}
      {activeTab === "audit" && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden space-y-4">
          <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
            <div>
              <h2 className="font-serif text-base font-bold text-stone-900">
                Owner Audit: Staff Overrides & Credit Adjustments
              </h2>
              <p className="text-xs text-stone-500">
                Complete forensic history of manual credit ledger adjustments and late cancellation overrides.
              </p>
            </div>
            <button
              onClick={loadAuditReport}
              className="px-3 py-1.5 border border-stone-300 rounded-lg text-xs font-semibold text-stone-700 hover:bg-stone-100"
            >
              Refresh Audit
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-[10px] font-mono uppercase tracking-wider text-stone-500">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Staff Actor & Role</th>
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Adjustment Delta</th>
                  <th className="py-3 px-4">Balance After</th>
                  <th className="py-3 px-4">Mandatory Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs">
                {auditLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-stone-50/60 transition">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-stone-400">
                      {new Date(log.timestamp).toLocaleString("en-IN", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-stone-900">{log.staff_actor}</div>
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-stone-100 text-stone-600">
                        {log.staff_role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-stone-800">
                      <div className="flex items-center gap-1.5">
                        <span>{log.member_name}</span>
                        {log.is_repeat && (
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-900 border border-amber-300"
                            title={log.repeat_warning}
                          >
                            <AlertTriangle className="w-3 h-3 text-amber-700" />
                            Repeat ({log.repeat_count}x)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`font-mono font-bold text-xs ${
                          log.delta.startsWith("+") ? "text-emerald-700" : "text-rose-700"
                        }`}
                      >
                        {log.delta} credits
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-stone-700 font-semibold">
                      {log.balance_after}
                    </td>
                    <td className="py-3.5 px-4 text-stone-600 italic text-[11px] max-w-sm">
                      "{log.reason}"
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {(isCreating || editingPack) && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 relative shadow-2xl border border-stone-200">
            <button
              onClick={() => {
                setIsCreating(false);
                setEditingPack(null);
              }}
              className="absolute top-5 right-5 text-stone-400 hover:text-stone-900 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 mb-6">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-amber-700">
                Pack Configuration
              </span>
              <h2 className="text-2xl font-serif text-stone-900">
                {isCreating ? "Create Class Pack Tier" : "Edit Pack Tier"}
              </h2>
            </div>

            <form onSubmit={handleSavePack} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Pack Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 10-Class Practice Pack"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Explains who this pack is for..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Price (₹ INR) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.price_inr}
                    onChange={(e) =>
                      setFormData({ ...formData, price_inr: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Class Credits *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.credits}
                    onChange={(e) =>
                      setFormData({ ...formData, credits: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Validity (Days) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.validity_days}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        validity_days: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        display_order: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-700">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) =>
                      setFormData({ ...formData, active: e.target.checked })
                    }
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Active & Sellable on Website</span>
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingPack(null);
                  }}
                  className="px-4 py-2 text-xs text-stone-500 hover:text-stone-900 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-full text-xs font-semibold uppercase tracking-wider transition shadow-sm"
                >
                  {saving ? "Saving..." : isCreating ? "Create Pack" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
