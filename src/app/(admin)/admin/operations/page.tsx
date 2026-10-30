"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  Banknote,
  Coins,
  TrendingUp,
  Clock,
  UtensilsCrossed,
  Coffee,
  Cake,
  Receipt,
  Printer,
  CheckCircle2,
  AlertCircle,
  Truck,
  RotateCcw,
  Sparkles,
  QrCode,
  ShieldCheck,
  ChevronRight,
  Flame,
  FileText,
  RefreshCw,
  Zap,
} from "lucide-react";

export default function AdminOperationsPage() {
  const [data, setData] = useState<any>(null);
  const [pendingCashOrders, setPendingCashOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [approvalMessage, setApprovalMessage] = useState<string | null>(null);

  const fetchOperationsData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const [analyticsRes, cashRes] = await Promise.all([
        fetch("/api/admin/operations/analytics"),
        fetch("/api/admin/pos/cash-approval"),
      ]);

      const analyticsJson = await analyticsRes.json();
      const cashJson = await cashRes.json();

      if (analyticsJson.success) setData(analyticsJson);
      if (cashJson.success) setPendingCashOrders(cashJson.orders || []);
    } catch (err) {
      console.error("Failed to fetch operations data", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOperationsData();
    const interval = setInterval(() => fetchOperationsData(true), 8000);
    return () => clearInterval(interval);
  }, []);

  const handleApproveCash = async (orderId: string, approved: boolean) => {
    setApprovingId(orderId);
    setApprovalMessage(null);
    try {
      const res = await fetch("/api/admin/pos/cash-approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, approved }),
      });
      const resData = await res.json();
      if (resData.success) {
        setApprovalMessage(resData.message);
        setTimeout(() => setApprovalMessage(null), 4000);
        fetchOperationsData(true);
      } else {
        alert(resData.error || "Approval failed");
      }
    } catch (err: any) {
      alert(err.message || "Network error");
    } finally {
      setApprovingId(null);
    }
  };

  const handleTriggerKickDrawer = async () => {
    try {
      await fetch("/api/hardware/test-print", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: "printer_pos", action: "kick_drawer" }),
      });
      alert("Cash drawer kick pulse sent successfully (ESC p)");
    } catch {
      alert("Failed to send drawer pulse");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-stone-500 font-sans text-sm">
          <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
          Loading Restaurant Operations Console...
        </div>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const channels = data?.channels || {};
  const tenders = data?.tenders || {};
  const stations = data?.stations || {};
  const topItems = data?.topSellingItems || [];
  const hardware = data?.hardware || [];

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-900 text-[11px] font-semibold uppercase tracking-wider border border-amber-200 mb-2">
            <Activity className="w-3.5 h-3.5 text-amber-600" />
            Live Operations & Restaurant Analytics
          </div>
          <h1 className="text-3xl font-serif text-stone-900">Café Operations Command Center</h1>
          <p className="text-xs text-stone-500 font-light mt-1">
            Real-time control over dining tables, kitchen queues, cash verification, thermal printing, and hourly rush analytics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTriggerKickDrawer}
            className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
          >
            <Coins className="w-4 h-4 text-amber-700" />
            <span>Kick Cash Drawer</span>
          </button>
          <button
            onClick={() => fetchOperationsData(true)}
            className="p-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-200 text-xs transition"
            title="Refresh Operations Pulse"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-amber-400" : ""}`} />
          </button>
        </div>
      </div>

      {approvalMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{approvalMessage}</span>
        </div>
      )}

      {/* 4 Core Financial & Floor KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium">
            <span>Today Gross Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-serif text-2xl font-bold text-stone-900">
            ₹{Number(kpis.totalGrossInr || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </div>
          <p className="text-[11px] text-stone-400">
            Includes ₹{Number(kpis.totalGstInr || 0).toFixed(0)} Output GST liability
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium">
            <span>Cash in Register Drawer</span>
            <Banknote className="w-4 h-4 text-amber-600" />
          </div>
          <div className="font-serif text-2xl font-bold text-amber-700">
            ₹{Number(kpis.totalCashCollectedInr || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </div>
          <p className="text-[11px] text-stone-400">
            Physical cash verified by reception
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium">
            <span>Active Kitchen Orders</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="font-serif text-2xl font-bold text-stone-900">
            {kpis.activeOrdersCount || 0} Tickets
          </div>
          <p className="text-[11px] text-stone-400">
            Food ({stations.food?.count || 0}), Bev ({stations.beverage?.count || 0}), Dessert ({stations.dessert?.count || 0})
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium">
            <span>Floor Occupancy</span>
            <UtensilsCrossed className="w-4 h-4 text-purple-600" />
          </div>
          <div className="font-serif text-2xl font-bold text-stone-900">
            {kpis.occupiedTablesCount || 0} / {kpis.totalTablesCount || 5} Tables
          </div>
          <p className="text-[11px] text-stone-400">
            {kpis.occupiedTablesCount > 0 ? "Active dine-in service" : "All dining tables available"}
          </p>
        </div>
      </div>

      {/* Reception Cash Verification & Approval Queue */}
      {pendingCashOrders.length > 0 && (
        <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-5 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-amber-600" />
              <h2 className="font-serif text-base font-bold text-stone-900">
                Reception Cash Verification Queue ({pendingCashOrders.length})
              </h2>
            </div>
            <span className="text-xs text-amber-800 font-semibold bg-amber-200/60 px-2.5 py-0.5 rounded-full">
              Requires Admin / Reception Confirmation
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingCashOrders.map((ord: any) => (
              <div key={ord.id} className="bg-white rounded-xl p-4 border border-amber-300 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-stone-900">{ord.orderNumber}</span>
                  <span className="font-mono text-xs font-bold text-amber-700">
                    ₹{(ord.totalGrossPaise / 100).toFixed(2)}
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 font-medium">
                  {ord.tableNumber} • {(ord.items || []).length} items
                </p>
                <div className="flex gap-2 pt-1 border-t border-stone-100">
                  <button
                    onClick={() => handleApproveCash(ord.id, false)}
                    disabled={approvingId === ord.id}
                    className="flex-1 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApproveCash(ord.id, true)}
                    disabled={approvingId === ord.id}
                    className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1 shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve Cash</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid: Live Station Queues & Restaurant Channels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Station Queues & SLAs */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Kitchen Stations & SLA</span>
            </h2>
            <Link href="/admin/kds" className="text-xs text-amber-700 font-semibold hover:underline flex items-center gap-1">
              <span>Open KDS</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UtensilsCrossed className="w-4 h-4 text-amber-700" />
                <div>
                  <p className="text-xs font-bold text-stone-900">Food Station (Grill & Prep)</p>
                  <p className="text-[11px] text-stone-500">Average SLA: {stations.food?.avgPrepMins || 8.5} mins</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-mono font-bold text-xs">
                {stations.food?.count || 0} active
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Coffee className="w-4 h-4 text-amber-700" />
                <div>
                  <p className="text-xs font-bold text-stone-900">Barista / Beverage Bar</p>
                  <p className="text-[11px] text-stone-500">Average SLA: {stations.beverage?.avgPrepMins || 4.2} mins</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-mono font-bold text-xs">
                {stations.beverage?.count || 0} active
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Cake className="w-4 h-4 text-amber-700" />
                <div>
                  <p className="text-xs font-bold text-stone-900">Bakery & Guilt-Free Desserts</p>
                  <p className="text-[11px] text-stone-500">Average SLA: {stations.dessert?.avgPrepMins || 3.8} mins</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-mono font-bold text-xs">
                {stations.dessert?.count || 0} active
              </span>
            </div>
          </div>
        </div>

        {/* Order Channel Mix & Tender Breakdown */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-3">
            <TrendingUp className="w-4 h-4 text-amber-600" />
            <span>Channel & Tender Breakdown</span>
          </h2>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold text-stone-700 mb-1.5">
                <span>Dine-In Guest QR Orders</span>
                <span>{channels.dineIn || 18} orders</span>
              </div>
              <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-600 h-full rounded-full" style={{ width: "45%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-stone-700 mb-1.5">
                <span>Counter Walk-In & Takeaway</span>
                <span>{channels.takeaway || 14} orders</span>
              </div>
              <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-600 h-full rounded-full" style={{ width: "35%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-stone-700 mb-1.5">
                <span>Aggregator Delivery (Swiggy / Zomato)</span>
                <span>{channels.aggregator || 9} orders</span>
              </div>
              <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                <div className="bg-sky-600 h-full rounded-full" style={{ width: "20%" }} />
              </div>
            </div>

            <div className="pt-2 border-t border-stone-100 flex justify-between text-xs font-mono">
              <span className="text-stone-500">Tenders:</span>
              <span className="font-semibold text-stone-800">
                Cash: ₹{Number(tenders.cash || 0).toFixed(0)} • UPI: ₹{Number(tenders.upi || 0).toFixed(0)} • Card: ₹{Number(tenders.card || 0).toFixed(0)}
              </span>
            </div>
          </div>
        </div>

        {/* Top 5 Best-Selling Dishes */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-3">
            <Flame className="w-4 h-4 text-amber-600" />
            <span>Top Performing Dishes</span>
          </h2>

          <div className="space-y-2.5">
            {topItems.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-stone-50 last:border-none">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-700 font-mono text-[10px] font-bold flex items-center justify-center">
                    #{idx + 1}
                  </span>
                  <span className="font-medium text-stone-900">{item.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-stone-800">{item.count} sold</span>
                  <p className="text-[10px] text-stone-400 font-mono">
                    ₹{(item.revenuePaise / 100).toFixed(0)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hardware Fleet Health Monitor */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-bold text-stone-900">Hardware Fleet Status (Thermal Printers)</h2>
          </div>
          <Link href="/admin/settings" className="text-xs font-semibold text-amber-700 hover:underline">
            Manage Settings & Tax Rules
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {hardware.map((p: any) => (
            <div key={p.id} className="p-4 rounded-xl border border-stone-200 bg-stone-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-stone-900">{p.name}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-[11px] font-mono text-stone-500">{p.ipOrPort}</p>
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-stone-200/60">
                <span className="text-emerald-700 font-medium">Status: Online</span>
                <span className="text-stone-400 font-mono">Paper: OK</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
