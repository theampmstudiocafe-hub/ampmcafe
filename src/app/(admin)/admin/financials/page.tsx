"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Receipt,
  IndianRupee,
  Calendar,
  Layers,
  Percent,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Scale,
  Zap,
} from "lucide-react";

export default function AdminFinancialsPage() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [revenueMode, setRevenueMode] = useState<"cash" | "consumption">("cash");
  const [isBounded, setIsBounded] = useState(true);

  const fetchFinancials = () => {
    setLoading(true);
    fetch(`/api/admin/financials?mode=${revenueMode}&bounded=${isBounded}`)
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          setReport(res.report);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFinancials();
  }, [revenueMode, isBounded]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-900 text-[11px] font-semibold uppercase tracking-wider border border-emerald-200 mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            Financial Governance & P&L Statement
          </div>
          <h1 className="text-3xl font-serif text-stone-900">
            P&L Financial Performance
          </h1>
          <p className="text-xs text-stone-500 font-light mt-1">
            Taxable sales excluding GST liability, dual-mode pack revenue recognition, bounded periodic COGS, and real payment gateway fee tracking.
          </p>
        </div>

        {/* Dual Accounting Toggles */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Revenue Recognition Mode Toggle */}
          <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs">
            <span className="text-[10px] font-medium text-stone-500 pl-1 uppercase font-mono">
              Revenue:
            </span>
            <button
              onClick={() => setRevenueMode("cash")}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                revenueMode === "cash"
                  ? "bg-stone-900 text-white shadow-sm"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Cash Basis
            </button>
            <button
              onClick={() => setRevenueMode("consumption")}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                revenueMode === "consumption"
                  ? "bg-stone-900 text-white shadow-sm"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Consumption Basis
            </button>
          </div>

          {/* COGS Boundary Toggle */}
          <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs">
            <span className="text-[10px] font-medium text-stone-500 pl-1 uppercase font-mono">
              COGS:
            </span>
            <button
              onClick={() => setIsBounded(true)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                isBounded
                  ? "bg-stone-900 text-white shadow-sm"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Bounded (Verified)
            </button>
            <button
              onClick={() => setIsBounded(false)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                !isBounded
                  ? "bg-amber-700 text-white shadow-sm"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Unclosed Estimate
            </button>
          </div>
        </div>
      </div>

      {loading || !report ? (
        <div className="py-20 text-center text-xs text-stone-400 animate-pulse">
          Generating financial statement...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Key KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-1">
              <span className="text-[10px] text-stone-400 uppercase font-mono block">
                Net Taxable Revenue
              </span>
              <div className="text-2xl font-serif font-medium text-stone-900">
                ₹{report.revenue.taxable_revenue_inr.toLocaleString("en-IN")}
              </div>
              <span className="text-[10px] text-stone-500">
                Excludes ₹{report.revenue.output_gst_liability_inr.toLocaleString("en-IN")} GST liability
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-stone-400 uppercase font-mono">
                  Cost of Goods Sold (COGS)
                </span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase ${
                    report.cogs.is_estimate
                      ? "bg-amber-100 text-amber-800"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {report.cogs.is_estimate ? "Estimate" : "Bounded"}
                </span>
              </div>
              <div className="text-2xl font-serif font-medium text-stone-900">
                ₹{report.cogs.total_cogs_inr.toLocaleString("en-IN")}
              </div>
              <span className="text-[10px] text-stone-500">
                {report.cogs.is_estimate ? "Purchase movement estimate" : "Stocktake reconciled"}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-1">
              <span className="text-[10px] text-stone-400 uppercase font-mono block">
                Operating Expenses
              </span>
              <div className="text-2xl font-serif font-medium text-stone-900">
                ₹{report.operating_expenses.total_inr.toLocaleString("en-IN")}
              </div>
              <span className="text-[10px] text-stone-500">
                Includes real gateway fees
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 shadow-sm space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-emerald-800 uppercase font-mono">
                  Net Operating Income
                </span>
                <span className="text-[10px] font-mono font-semibold text-emerald-800">
                  {report.summary.net_profit_margin_pct}% Margin
                </span>
              </div>
              <div className="text-2xl font-serif font-medium text-emerald-950">
                ₹{report.summary.net_operating_income_inr.toLocaleString("en-IN")}
              </div>
              <span className="text-[10px] text-emerald-700">
                Operating Profit after COGS & OPEX
              </span>
            </div>
          </div>

          {/* Revenue Recognition & GST Accountability Card */}
          <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-base font-serif font-medium text-stone-900">
                  1. Revenue Recognition & Output GST Accountability
                </h3>
                <p className="text-xs text-stone-500">
                  Strictly accounting Output GST as a balance sheet liability, not recognized as revenue.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded bg-stone-100 font-mono text-xs uppercase text-stone-700">
                Mode: {report.revenue_recognition_mode} basis
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-100 space-y-2">
                <span className="text-stone-400 uppercase font-mono text-[10px] block">
                  Gross Collections (Cash Inflow)
                </span>
                <div className="text-xl font-serif font-medium text-stone-900">
                  ₹{report.revenue.gross_collections_inr.toLocaleString("en-IN")}
                </div>
                <div className="text-[11px] text-stone-500 space-y-0.5 pt-1 border-t border-stone-200/50">
                  <div>• Yoga Packs & Passes: ₹1,65,000</div>
                  <div>• Drop-In Sessions: ₹28,000</div>
                  <div>• Nourish Café Dining: ₹64,200</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/60 space-y-2">
                <span className="text-amber-800 uppercase font-mono text-[10px] block">
                  Output GST Liability (Tax Payable)
                </span>
                <div className="text-xl font-serif font-medium text-amber-950">
                  ₹{report.revenue.output_gst_liability_inr.toLocaleString("en-IN")}
                </div>
                <div className="text-[11px] text-amber-800 space-y-0.5 pt-1 border-t border-amber-200/50">
                  <div>• Studio Shala (18% GST): ₹29,440.68</div>
                  <div>• Nourish Café (5% GST): ₹3,057.14</div>
                  <div className="text-[10px] font-medium text-amber-900 pt-0.5">
                    Excluded from P&L revenue per Indian Accounting Standards.
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/60 space-y-2">
                <span className="text-emerald-800 uppercase font-mono text-[10px] block">
                  Net Taxable Sales Recognized
                </span>
                <div className="text-xl font-serif font-medium text-emerald-950">
                  ₹{report.revenue.taxable_revenue_inr.toLocaleString("en-IN")}
                </div>
                <div className="text-[11px] text-emerald-800 space-y-0.5 pt-1 border-t border-emerald-200/50">
                  {report.revenue_recognition_mode === "consumption" ? (
                    <div>
                      Deferred Pack Liability: ₹{report.revenue.deferred_revenue_liability_inr.toLocaleString("en-IN")}
                      <span className="block text-[10px] text-emerald-700">
                        (Unconsumed credits held until session attendance)
                      </span>
                    </div>
                  ) : (
                    <div>Full cash collections recognized immediately upon purchase.</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Cost of Goods Sold (COGS) Card */}
          <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-base font-serif font-medium text-stone-900">
                  2. Cost of Goods Sold (COGS) & Periodic Stocktake Boundary
                </h3>
                <p className="text-xs text-stone-500">
                  {report.cogs.disclaimer}
                </p>
              </div>
              <span
                className={`px-2.5 py-1 rounded text-xs font-mono uppercase ${
                  report.cogs.is_estimate
                    ? "bg-amber-100 text-amber-800"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {report.cogs.label}
              </span>
            </div>

            {report.cogs.is_estimate ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div>
                  <span className="font-semibold">Amendment 2 Compliance:</span> Unclosed stocktake period active. Recipe-derived COGS is not displayed until Phase 3 POS customer orders exist. Showing purchase-based inventory movement estimate of{" "}
                  <span className="font-mono font-semibold">
                    ₹{report.cogs.total_cogs_inr.toLocaleString("en-IN")}
                  </span>.
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-100">
                  <span className="text-stone-400 block text-[10px] font-mono">Beginning Inventory</span>
                  <span className="font-semibold text-stone-900">
                    ₹{report.cogs.beginning_inventory_inr.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-100">
                  <span className="text-stone-400 block text-[10px] font-mono">+ Purchases Ingested</span>
                  <span className="font-semibold text-stone-900">
                    ₹{report.cogs.purchases_inr.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-100">
                  <span className="text-stone-400 block text-[10px] font-mono">- Ending Stocktake</span>
                  <span className="font-semibold text-stone-900">
                    ₹{report.cogs.ending_inventory_inr.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-stone-900 text-white">
                  <span className="text-stone-400 block text-[10px] font-mono">= Periodic Verified COGS</span>
                  <span className="font-semibold text-stone-100">
                    ₹{report.cogs.total_cogs_inr.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Operating Expenses & Net Margin Card */}
          <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-base font-serif font-medium text-stone-900">
                  3. Operating Expenses & Net Income
                </h3>
                <p className="text-xs text-stone-500">
                  Facility rent, equipment maintenance, and actual Razorpay gateway settlement fees.
                </p>
              </div>
              <div className="text-right">
                <span className="text-stone-400 text-[10px] block font-mono">Total OPEX</span>
                <span className="font-semibold text-stone-900 text-xs font-mono">
                  ₹{report.operating_expenses.total_inr.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {report.operating_expenses.breakdown.map((item: any) => (
                <div
                  key={item.category}
                  className="p-3 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    {item.is_real_gateway_fee && <Zap className="w-3.5 h-3.5 text-purple-600" />}
                    <span className="text-stone-700 font-medium">{item.category}</span>
                  </div>
                  <span className="font-mono font-semibold text-stone-900">
                    ₹{item.amount_inr.toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-stone-100/70 border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <div>
                <span className="font-semibold text-stone-900">Net GST Liability Payable:</span>{" "}
                <span className="font-mono text-stone-800 font-medium">
                  ₹{report.summary.gst_net_payable_inr.toLocaleString("en-IN")}
                </span>{" "}
                <span className="text-[11px] text-stone-500">
                  (Output GST ₹{report.revenue.output_gst_liability_inr.toLocaleString("en-IN")} less ₹24,541.20 Input Tax Credit)
                </span>
              </div>

              <div className="text-right">
                <span className="text-stone-400 text-[10px] uppercase font-mono block">
                  Final Net Operating Income
                </span>
                <span className="text-lg font-serif font-semibold text-emerald-800">
                  ₹{report.summary.net_operating_income_inr.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
