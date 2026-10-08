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
  const [feedback, setFeedback] = useState<{ text: string; isError: boolean } | null>(
    null
  );

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

        <button
          onClick={openCreateModal}
          className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Create New Pack
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

      {/* Packs Table / List */}
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
