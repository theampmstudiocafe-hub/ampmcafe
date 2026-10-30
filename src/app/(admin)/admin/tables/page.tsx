"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Utensils,
  Plus,
  RefreshCw,
  Clock,
  QrCode,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Users,
  Timer,
  XCircle,
  RotateCcw,
} from "lucide-react";

export default function DiningTablesPage() {
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [isClearing, setIsClearing] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState("");
  const [newCapacity, setNewCapacity] = useState("2");
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  async function fetchTables() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/tables");
      const data = await res.json();
      if (data.success) {
        setTables(data.tables || []);
      }
    } catch (e) {
      console.warn("Failed to load tables", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTables();
    const interval = setInterval(fetchTables, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  async function handleClearTable(tableIdOrToken: string, tableNumber: string) {
    if (!confirm(`Are you sure you want to clear and reopen ${tableNumber}?`)) return;
    setIsClearing(tableIdOrToken);
    try {
      const res = await fetch(`/api/admin/tables/${encodeURIComponent(tableIdOrToken)}/clear`, {
        method: "POST",
        headers: {
          "x-ampm-role": "front_desk",
          "x-ampm-user": "Front Desk Staff",
        },
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`✓ ${tableNumber} successfully cleared and reopened.`);
        setTimeout(() => setActionMessage(null), 3000);
        await fetchTables();
      } else {
        alert(data.error || "Failed to clear table");
      }
    } catch (e: any) {
      alert(e.message || "Network error");
    } finally {
      setIsClearing(null);
    }
  }

  async function handleCreateTable(e: React.FormEvent) {
    e.preventDefault();
    if (!newTableNumber) return;

    try {
      const res = await fetch("/api/admin/tables", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ampm-role": "manager",
        },
        body: JSON.stringify({
          tableNumber: newTableNumber,
          capacity: Number(newCapacity) || 2,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsAdding(false);
        setNewTableNumber("");
        setNewCapacity("2");
        await fetchTables();
      } else {
        alert(data.error || "Failed to create table");
      }
    } catch (e: any) {
      alert(e.message || "Network error");
    }
  }

  const filteredTables = tables.filter((t) => {
    if (filter === "available") return t.status === "available";
    if (filter === "occupied") return t.status === "order_in_progress";
    if (filter === "pending") return t.status === "pending_payment";
    return true;
  });

  const totalCount = tables.length;
  const availableCount = tables.filter((t) => t.status === "available").length;
  const occupiedCount = tables.filter((t) => t.status === "order_in_progress").length;
  const pendingCount = tables.filter((t) => t.status === "pending_payment").length;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-stone-900">
            Dining Tables & Floor Plan
          </h1>
          <p className="text-sm text-stone-500 font-light mt-0.5">
            Minimal Single-Order Table State & Real-Time QR Session Management
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchTables()}
            className="p-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-600 transition shadow-sm"
            title="Refresh Table States"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-amber-600" : ""}`} />
          </button>
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-2 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Table</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
          {actionMessage}
        </div>
      )}

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] uppercase font-bold tracking-wider text-stone-400">Total Tables</p>
          <p className="font-mono text-2xl font-bold text-stone-900 mt-1">{totalCount}</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-600">Available</p>
          <p className="font-mono text-2xl font-bold text-emerald-600 mt-1">{availableCount}</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] uppercase font-bold tracking-wider text-blue-600">Occupied (Dining)</p>
          <p className="font-mono text-2xl font-bold text-blue-600 mt-1">{occupiedCount}</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] uppercase font-bold tracking-wider text-amber-600">Checkout Hold</p>
          <p className="font-mono text-2xl font-bold text-amber-600 mt-1">{pendingCount}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-stone-200 gap-2 pb-1">
        {[
          { key: "all", label: `All (${totalCount})` },
          { key: "available", label: `Available (${availableCount})` },
          { key: "occupied", label: `Occupied (${occupiedCount})` },
          { key: "pending", label: `Checkout Hold (${pendingCount})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === tab.key
                ? "bg-stone-900 text-white"
                : "text-stone-500 hover:text-stone-900 hover:bg-stone-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTables.map((table) => {
          const isAvailable = table.status === "available";
          const isPending = table.status === "pending_payment";
          const isOccupied = table.status === "order_in_progress";

          const cardBorder = isAvailable
            ? "border-emerald-300 bg-white"
            : isPending
            ? "border-amber-300 bg-amber-50/30"
            : "border-blue-300 bg-blue-50/20";

          return (
            <div
              key={table.id || table.qr_code_token}
              className={`rounded-2xl border ${cardBorder} p-5 flex flex-col justify-between shadow-sm transition hover:shadow-md`}
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center text-stone-700">
                      <Utensils className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="font-serif text-base font-bold text-stone-900">
                        {table.table_number}
                      </h2>
                      <p className="text-xs text-stone-500 flex items-center gap-1">
                        <Users className="w-3 h-3 text-stone-400" />
                        <span>Seats {table.capacity} guests</span>
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isAvailable
                        ? "bg-emerald-100 text-emerald-800"
                        : isPending
                        ? "bg-amber-100 text-amber-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {isAvailable ? "Available" : isPending ? "Holding" : "Occupied"}
                  </span>
                </div>

                {/* Status Specific Details */}
                {isAvailable && (
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/60 text-xs text-stone-600 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Ready for guests to scan table QR and order.</span>
                  </div>
                )}

                {isPending && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-amber-900 font-semibold">
                      <span className="flex items-center gap-1.5">
                        <Timer className="w-3.5 h-3.5 text-amber-700" />
                        <span>Checkout in Progress</span>
                      </span>
                      <span className="font-mono text-xs">
                        {table.remainingHoldSeconds > 0 ? `${table.remainingHoldSeconds}s left` : "Expired"}
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-700">
                      Guest is currently in payment checkout. Table will auto-release if unpaid.
                    </p>
                  </div>
                )}

                {isOccupied && table.activeOrder && (
                  <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs space-y-2">
                    <div className="flex items-center justify-between font-mono text-blue-900 font-bold">
                      <span>{table.activeOrder.orderNumber}</span>
                      <span>₹{(table.activeOrder.totalGrossPaise / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-blue-700 text-[11px]">
                      <span>{table.activeOrder.itemCount} items ordered</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{table.activeOrder.elapsedMinutes}m active</span>
                      </span>
                    </div>
                  </div>
                )}

                {/* QR Code link */}
                <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                  <span className="font-mono text-[11px] truncate max-w-[180px]">
                    {table.qr_code_token}
                  </span>
                  <Link
                    href={`/order/${table.qr_code_token}`}
                    target="_blank"
                    className="flex items-center gap-1 text-amber-700 hover:text-amber-600 font-medium text-xs"
                  >
                    <span>Test QR</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 mt-2">
                {!isAvailable && (
                  <button
                    onClick={() => handleClearTable(table.id || table.qr_code_token, table.table_number)}
                    disabled={isClearing === (table.id || table.qr_code_token)}
                    className="w-full py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear & Reopen Table</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Table Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <h2 className="font-serif text-lg font-bold text-stone-900">Add Dining Table</h2>
            <form onSubmit={handleCreateTable} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-stone-700">Table Name / Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Table 4 or Terrace 1"
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:border-amber-600"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-700">Seating Capacity</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  required
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:border-amber-600"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold"
                >
                  Create Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
