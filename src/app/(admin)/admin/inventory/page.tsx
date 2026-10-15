"use client";

import React, { useState, useEffect } from "react";
import {
  Boxes,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  SlidersHorizontal,
  RefreshCw,
  Plus,
  Scale,
  Building,
  CheckCheck,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  X,
  FileSpreadsheet,
} from "lucide-react";

interface IngredientItem {
  id: string;
  name: string;
  category: string;
  base_unit: string;
  current_stock: number;
  minimum_stock_level: number;
  reorder_quantity: number;
  cost_per_base_unit_inr: number;
  days_of_supply_threshold_days: number;
  storage_areas: string[];
  total_inventory_value_inr: number;
  status: "optimal" | "low_stock" | "critical";
}

interface VarianceItem {
  ingredient_id: string;
  ingredient_name: string;
  base_unit: string;
  expected: number;
  counted_total: number;
  variance: number;
  variance_pct: number;
  cost_impact_inr: number;
}

interface StocktakeSession {
  id: string;
  started_at: string;
  status: "in_progress" | "reconciled";
  expected_balances: Record<string, number>;
  area_counts: {
    area: string;
    ingredient_id: string;
    count: number;
    counted_at: string;
  }[];
  variance_summary: VarianceItem[];
}

export default function AdminInventoryPage() {
  const [activeTab, setActiveTab] = useState<"master" | "stocktake">("master");
  const [inventory, setInventory] = useState<IngredientItem[]>([]);
  const [session, setSession] = useState<StocktakeSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Threshold Edit Modal
  const [editingItem, setEditingItem] = useState<IngredientItem | null>(null);
  const [editMinStock, setEditMinStock] = useState("");
  const [editDosThreshold, setEditDosThreshold] = useState("");
  const [editReorderQty, setEditReorderQty] = useState("");

  // Area Count Submission
  const [selectedArea, setSelectedArea] = useState("Barista Bar");
  const [areaInputCounts, setAreaInputCounts] = useState<Record<string, number>>({});
  const [countSubmitMsg, setCountSubmitMsg] = useState<string | null>(null);
  const [reconcileSuccessMsg, setReconcileSuccessMsg] = useState<string | null>(null);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const [invRes, stkRes] = await Promise.all([
        fetch("/api/admin/inventory").then((r) => r.json()),
        fetch("/api/admin/inventory/stocktake").then((r) => r.json()),
      ]);

      if (invRes.success) setInventory(invRes.inventory);
      if (stkRes.success) setSession(stkRes.session);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleOpenEdit = (item: IngredientItem) => {
    setEditingItem(item);
    setEditMinStock(String(item.minimum_stock_level));
    setEditDosThreshold(String(item.days_of_supply_threshold_days));
    setEditReorderQty(String(item.reorder_quantity));
  };

  const handleSaveThresholds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      const res = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingItem.id,
          minimum_stock_level: Number(editMinStock),
          days_of_supply_threshold_days: Number(editDosThreshold),
          reorder_quantity: Number(editReorderQty),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEditingItem(null);
        fetchInventory();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRecordAreaCount = async (e: React.FormEvent) => {
    e.preventDefault();
    const countItems = Object.entries(areaInputCounts)
      .filter(([_, val]) => !isNaN(val) && val >= 0)
      .map(([ingId, val]) => ({ ingredient_id: ingId, count: val }));

    if (countItems.length === 0) return;

    try {
      const res = await fetch("/api/admin/inventory/stocktake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          area: selectedArea,
          counts: countItems,
          client_mutation_id: `mut-${Date.now()}`,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCountSubmitMsg(`Counts recorded for '${selectedArea}'. Multi-area sums updated.`);
        setAreaInputCounts({});
        fetchInventory();
        setTimeout(() => setCountSubmitMsg(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReconcile = async () => {
    try {
      const res = await fetch("/api/admin/inventory/stocktake", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (data.success) {
        setReconcileSuccessMsg("Stocktake finalized! 'audit_adjustment' movements posted to inventory ledger.");
        fetchInventory();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const totalValue = inventory.reduce((acc, it) => acc + it.total_inventory_value_inr, 0);
  const lowStockCount = inventory.filter((it) => it.current_stock <= it.minimum_stock_level).length;

  const filteredInventory = inventory.filter((it) => {
    const matchesSearch = it.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === "all" || it.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 text-stone-800 text-[11px] font-semibold uppercase tracking-wider border border-stone-200 mb-2">
            <Boxes className="w-3.5 h-3.5 text-stone-600" />
            Kitchen & Bar Inventory
          </div>
          <h1 className="text-3xl font-serif text-stone-900">
            Inventory & Stocktake
          </h1>
          <p className="text-xs text-stone-500 font-light mt-1">
            Real-time stock ledger, configurable days-of-supply thresholds, additive multi-area stocktakes, and audit reconciliations.
          </p>
        </div>

        {/* Overview Metric Badges */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-white border border-stone-200 text-xs shadow-sm">
            <span className="text-[10px] text-stone-400 block uppercase font-mono">Valuation (WAC)</span>
            <span className="font-semibold text-stone-900">
              ₹{totalValue.toLocaleString("en-IN")}
            </span>
            <span className="text-[9px] text-stone-400 block font-mono">Weighted Avg Cost</span>
          </div>
          <div className="p-3 rounded-xl bg-white border border-stone-200 text-xs shadow-sm">
            <span className="text-[10px] text-stone-400 block uppercase font-mono">Breached SKUs</span>
            <span className={`font-semibold ${lowStockCount > 0 ? "text-amber-700" : "text-emerald-700"}`}>
              {lowStockCount} below min
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200 gap-6">
        <button
          onClick={() => setActiveTab("master")}
          className={`pb-3 text-xs font-medium transition-all relative ${
            activeTab === "master"
              ? "text-stone-900 font-semibold border-b-2 border-stone-900"
              : "text-stone-400 hover:text-stone-600"
          }`}
        >
          Inventory Master & Thresholds ({inventory.length})
        </button>
        <button
          onClick={() => setActiveTab("stocktake")}
          className={`pb-3 text-xs font-medium transition-all relative ${
            activeTab === "stocktake"
              ? "text-stone-900 font-semibold border-b-2 border-stone-900"
              : "text-stone-400 hover:text-stone-600"
          }`}
        >
          Physical Stocktake & Reconciliation
        </button>
      </div>

      {/* TAB 1: INVENTORY MASTER */}
      {activeTab === "master" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ingredients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
              {[
                { id: "all", label: "All Items" },
                { id: "dairy_alt", label: "Dairy & Mylks" },
                { id: "coffee_beverage", label: "Coffee & Teas" },
                { id: "superfoods", label: "Superfoods" },
                { id: "fresh_produce", label: "Fresh Produce" },
                { id: "dry_goods", label: "Dry Grains" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setCategoryFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    categoryFilter === tab.id
                      ? "bg-stone-900 text-stone-100"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200/80 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-mono uppercase text-[10px]">
                  <tr>
                    <th className="px-5 py-3.5">Ingredient SKU</th>
                    <th className="px-5 py-3.5">Storage Locations</th>
                    <th className="px-5 py-3.5">Current Stock</th>
                    <th className="px-5 py-3.5">Min Stock Alert</th>
                    <th className="px-5 py-3.5">Days of Supply Threshold</th>
                    <th className="px-5 py-3.5">Reorder Qty</th>
                    <th className="px-5 py-3.5">Total Value</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Settings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredInventory.map((item) => (
                    <tr key={item.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-medium text-stone-900">{item.name}</div>
                        <div className="text-[10px] font-mono text-stone-400 capitalize">
                          {item.category.replace("_", " ")}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-stone-500 text-[11px]">
                        <div className="flex flex-wrap gap-1">
                          {item.storage_areas.map((area) => (
                            <span
                              key={area}
                              className="px-2 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200 text-[10px]"
                            >
                              {area}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono font-medium text-stone-800">
                        {item.current_stock.toLocaleString()} {item.base_unit}
                      </td>
                      <td className="px-5 py-4 font-mono text-stone-500">
                        {item.minimum_stock_level.toLocaleString()} {item.base_unit}
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-mono font-medium text-stone-800">
                          {item.days_of_supply_threshold_days} days
                        </span>
                        <span className="block text-[10px] text-stone-400">
                          (Configurable)
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-stone-600">
                        {item.reorder_quantity.toLocaleString()} {item.base_unit}
                      </td>
                      <td className="px-5 py-4 font-semibold text-stone-900">
                        ₹{item.total_inventory_value_inr.toLocaleString("en-IN")}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium uppercase tracking-wide border ${
                            item.status === "optimal"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}
                        >
                          {item.status === "optimal" ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                          )}
                          {item.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50 text-[11px] font-medium transition-colors"
                        >
                          <SlidersHorizontal className="w-3 h-3" />
                          Thresholds
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PHYSICAL STOCKTAKE & RECONCILIATION */}
      {activeTab === "stocktake" && session && (
        <div className="space-y-6">
          {/* Rules Banner (Amendment 3) */}
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-stone-700 text-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Scale className="w-5 h-5 text-stone-600 flex-shrink-0" />
              <div>
                <span className="font-semibold text-stone-900">
                  Additive Storage Area Count Architecture (Amendment 3):
                </span>{" "}
                Counts across different storage areas sum per ingredient. Expected balances are captured at count start. Repeat counts of the same area update the count.
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-[10px] text-stone-400 uppercase font-mono block">Session</span>
              <span className="font-mono text-xs font-semibold text-stone-900">{session.id}</span>
            </div>
          </div>

          {countSubmitMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{countSubmitMsg}</span>
            </div>
          )}

          {reconcileSuccessMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
              <CheckCheck className="w-4 h-4 text-emerald-600" />
              <span>{reconcileSuccessMsg}</span>
            </div>
          )}

          {/* Area Count Entry Form */}
          <div className="p-5 rounded-2xl bg-white border border-stone-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div>
                <h3 className="text-sm font-serif font-medium text-stone-900">
                  Enter Storage Area Count
                </h3>
                <p className="text-xs text-stone-500">Select area and record physical quantities in base units</p>
              </div>

              {/* Area selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-500 font-medium">Area:</span>
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-stone-800"
                >
                  <option value="Barista Bar">Barista Bar</option>
                  <option value="Walk-in Chiller">Walk-in Chiller</option>
                  <option value="Main Kitchen Dry Store">Main Kitchen Dry Store</option>
                  <option value="Prep Station">Prep Station</option>
                </select>
              </div>
            </div>

            <form onSubmit={handleRecordAreaCount} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {inventory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-medium text-stone-900 truncate max-w-[160px]">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-stone-400 font-mono">
                        Unit: {item.base_unit}
                      </div>
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0"
                      value={areaInputCounts[item.id] ?? ""}
                      onChange={(e) =>
                        setAreaInputCounts({
                          ...areaInputCounts,
                          [item.id]: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-24 px-2 py-1 bg-white border border-stone-200 rounded text-xs font-mono text-right"
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-stone-900 text-stone-50 text-xs font-medium hover:bg-stone-800 transition-colors shadow-sm"
                >
                  Save Count for '{selectedArea}'
                </button>
              </div>
            </form>
          </div>

          {/* Variance & Audit Reconciliation Review Table */}
          <div className="p-5 rounded-2xl bg-white border border-stone-200/80 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
              <div>
                <h3 className="text-sm font-serif font-medium text-stone-900">
                  Stocktake Variance & Reconciliation
                </h3>
                <p className="text-xs text-stone-500">
                  Aggregated counts across all storage areas compared against expected balance captured at count time.
                </p>
              </div>

              <button
                onClick={handleReconcile}
                disabled={session.status === "reconciled"}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-colors shadow-sm ${
                  session.status === "reconciled"
                    ? "bg-stone-100 text-stone-400 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}
              >
                <CheckCheck className="w-3.5 h-3.5" />
                {session.status === "reconciled" ? "Audit Reconciled" : "Post Stocktake Reconciliation"}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-mono uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Ingredient SKU</th>
                    <th className="px-4 py-3">Expected Balance</th>
                    <th className="px-4 py-3">Sum Counted Across Areas</th>
                    <th className="px-4 py-3">Variance (Δ)</th>
                    <th className="px-4 py-3">Variance %</th>
                    <th className="px-4 py-3 text-right">Cost Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {session.variance_summary.map((v) => (
                    <tr key={v.ingredient_id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="px-4 py-3.5 font-medium text-stone-900">
                        {v.ingredient_name}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-stone-600">
                        {v.expected.toLocaleString()} {v.base_unit}
                      </td>
                      <td className="px-4 py-3.5 font-mono font-semibold text-stone-900">
                        {v.counted_total.toLocaleString()} {v.base_unit}
                      </td>
                      <td className="px-4 py-3.5 font-mono">
                        <span
                          className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-medium ${
                            v.variance === 0
                              ? "bg-stone-100 text-stone-600"
                              : v.variance < 0
                              ? "bg-rose-50 text-rose-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {v.variance > 0 ? `+${v.variance}` : v.variance} {v.base_unit}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-stone-600">
                        {v.variance_pct > 0 ? `+${v.variance_pct}%` : `${v.variance_pct}%`}
                      </td>
                      <td className="px-4 py-3.5 font-mono font-medium text-right text-stone-900">
                        {v.cost_impact_inr === 0 ? "₹0.00" : `₹${v.cost_impact_inr.toLocaleString("en-IN")}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CONFIGURE THRESHOLDS MODAL */}
      {editingItem && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between pb-3 border-b border-stone-200">
              <div>
                <h3 className="text-lg font-serif font-medium text-stone-900">
                  Configure SKU Thresholds
                </h3>
                <p className="text-xs text-stone-500">{editingItem.name}</p>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveThresholds} className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-600 mb-1 font-medium">
                  Days-of-Supply Threshold (Days) (Amendment 5)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={editDosThreshold}
                  onChange={(e) => setEditDosThreshold(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-mono"
                />
                <span className="text-[10px] text-stone-400 mt-0.5 block">
                  Per-ingredient configurable threshold for replenishment alerts.
                </span>
              </div>

              <div>
                <label className="block text-stone-600 mb-1 font-medium">
                  Minimum Stock Level ({editingItem.base_unit})
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={editMinStock}
                  onChange={(e) => setEditMinStock(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-stone-600 mb-1 font-medium">
                  Standard Reorder Quantity ({editingItem.base_unit})
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={editReorderQty}
                  onChange={(e) => setEditReorderQty(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl text-xs text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-stone-900 text-stone-50 text-xs font-medium hover:bg-stone-800 transition-colors shadow-sm"
                >
                  Update Thresholds
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
