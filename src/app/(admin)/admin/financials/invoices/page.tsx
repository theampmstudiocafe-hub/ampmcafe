"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Search,
  Filter,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Lock,
  Printer,
  ChevronRight,
  X,
  IndianRupee,
  CheckCircle2,
  Calendar,
  Building,
  Tag,
} from "lucide-react";

interface InvoiceSnapshotItem {
  description: string;
  quantity: number;
  unit_price_inr: number;
  taxable_amount_inr: number;
  gst_rate_pct: number;
  gst_amount_inr: number;
  total_inr: number;
}

interface InvoiceRecord {
  id: string;
  invoice_number: string;
  fy: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  type: "tax_invoice" | "credit_note";
  related_invoice_number?: string;
  status: "paid" | "refunded" | "cancelled";
  issued_at: string;
  taxable_amount_inr: number;
  gst_amount_inr: number;
  total_amount_inr: number;
  items: InvoiceSnapshotItem[];
  ca_confirmation_notice: string;
  locked_counter_verified: boolean;
}

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);

  // Role Simulator for refund authorization
  const [callerRole, setCallerRole] = useState<"owner" | "manager" | "front_desk">("owner");

  // Refund Modal State
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundTargetCustomer, setRefundTargetCustomer] = useState("Priya Sharma");
  const [refundPackType, setRefundPackType] = useState("10-Class Practice Pack");
  const [refundTotalCredits, setRefundTotalCredits] = useState("10");
  const [refundRemainingCredits, setRefundRemainingCredits] = useState("4");
  const [refundPricePaid, setRefundPricePaid] = useState("5500");
  const [refundReason, setRefundReason] = useState("");
  const [refundError, setRefundError] = useState<string | null>(null);
  const [refundSuccessMsg, setRefundSuccessMsg] = useState<string | null>(null);

  // New Invoice Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustEmail, setNewCustEmail] = useState("");
  const [newItemDesc, setNewItemDesc] = useState("Single Drop-In Pass");
  const [newItemRate, setNewItemRate] = useState("593.22"); // Taxable for ₹700 gross
  const [newItemGst, setNewItemGst] = useState("18.0");

  const fetchInvoices = () => {
    setLoading(true);
    fetch(`/api/admin/invoices?type=${typeFilter}&search=${encodeURIComponent(search)}`)
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          setInvoices(res.invoices);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInvoices();
  }, [typeFilter, search]);

  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    setRefundError(null);
    setRefundSuccessMsg(null);

    if (callerRole === "front_desk") {
      setRefundError("Permission Denied: Front desk role cannot authorize monetary pack refunds (Amendment 6)");
      return;
    }

    if (!refundReason || refundReason.trim().length < 5) {
      setRefundError("Mandatory reason of at least 5 characters is required for audit logs (Amendment 6)");
      return;
    }

    try {
      const res = await fetch("/api/admin/financials/refund", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ampm-role": callerRole,
        },
        body: JSON.stringify({
          customer_name: refundTargetCustomer,
          customer_email: "priya.sharma@example.com",
          total_credits: Number(refundTotalCredits),
          remaining_credits: Number(refundRemainingCredits),
          pack_price_paid_inr: Number(refundPricePaid),
          reason: refundReason,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setRefundSuccessMsg(`Pro-rata refund approved! Credit Note ${data.refund.credit_note_number} generated. Remaining credits voided and bookings cancelled.`);
        setTimeout(() => {
          setShowRefundModal(false);
          fetchInvoices();
        }, 2000);
      } else {
        setRefundError(data.error);
      }
    } catch (err: any) {
      setRefundError(err.message || "Failed to process refund");
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: newCustName,
          customer_email: newCustEmail,
          items: [
            {
              description: newItemDesc,
              quantity: 1,
              unit_price_inr: Number(newItemRate),
              gst_rate_pct: Number(newItemGst),
            },
          ],
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        fetchInvoices();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Live Pro-Rata Calculation in Modal
  const calculatedRefund = (
    (Number(refundPricePaid) || 0) *
    ((Number(refundRemainingCredits) || 0) / (Number(refundTotalCredits) || 1))
  ).toFixed(2);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-900 text-[11px] font-semibold uppercase tracking-wider border border-blue-200 mb-2">
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            Statutory Invoicing & Tax Ledger
          </div>
          <h1 className="text-3xl font-serif text-stone-900">
            Invoices, Credit Notes & Refunds
          </h1>
          <p className="text-xs text-stone-500 font-light mt-1">
            Gapless FY locked counter sequence (AMPM/26-27/XXXX), immutable tax snapshots, and pro-rata monetary pack refunds.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Role Simulator for Refund Permissions */}
          <div className="flex items-center gap-1.5 bg-stone-100 p-1.5 rounded-xl border border-stone-200 text-xs">
            <span className="text-[10px] font-medium text-stone-500 pl-1 uppercase font-mono">
              Staff Role:
            </span>
            <button
              onClick={() => setCallerRole("owner")}
              className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                callerRole === "owner" ? "bg-stone-900 text-white" : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Owner
            </button>
            <button
              onClick={() => setCallerRole("manager")}
              className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                callerRole === "manager" ? "bg-stone-900 text-white" : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Manager
            </button>
            <button
              onClick={() => setCallerRole("front_desk")}
              className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                callerRole === "front_desk" ? "bg-amber-600 text-white" : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Front Desk
            </button>
          </div>

          <button
            onClick={() => {
              setShowRefundModal(true);
              setRefundError(null);
              setRefundSuccessMsg(null);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-medium transition-colors shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Issue Pack Refund
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 text-stone-50 text-xs font-medium hover:bg-stone-800 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Generate Invoice
          </button>
        </div>
      </div>

      {/* Mandatory Statutory CA Notice Banner (Amendment 3 & Approved Plan) */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            <span className="font-semibold uppercase tracking-wider font-mono text-[11px] block text-amber-950">
              Statutory Disclaimer (Pending CA Confirmation):
            </span>
            <span>
              Tax invoice sequential format (<span className="font-mono">AMPM/26-27/XXXX</span>), Credit Note series (<span className="font-mono">CN/26-27/XXXX</span>), and GST rates (18% Yoga Shala / 5% Nourish Café) are marked as pending final Chartered Accountant (CA) filing signoff.
            </span>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded bg-amber-200/60 text-amber-950 font-mono text-[10px] uppercase font-semibold flex-shrink-0">
          Statutory Notice
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search invoice number or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
          />
        </div>

        <div className="flex items-center gap-2">
          {["all", "tax_invoice", "credit_note"].map((tab) => (
            <button
              key={tab}
              onClick={() => setTypeFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs capitalize font-medium transition-colors ${
                typeFilter === tab
                  ? "bg-stone-900 text-stone-100"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {tab.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices & Credit Notes Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-mono uppercase text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Document #</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Document Type</th>
                <th className="px-5 py-3.5">Taxable (₹)</th>
                <th className="px-5 py-3.5">GST (₹)</th>
                <th className="px-5 py-3.5">Total Amount</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-stone-50/70 transition-colors">
                  <td className="px-5 py-4 font-mono font-medium text-stone-900">
                    {inv.invoice_number}
                  </td>
                  <td className="px-5 py-4 font-mono text-stone-500 text-[11px]">
                    {new Date(inv.issued_at).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-medium text-stone-900">{inv.customer_name}</div>
                    <div className="text-[11px] text-stone-400">{inv.customer_email}</div>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-medium border ${
                        inv.type === "credit_note"
                          ? "bg-amber-50 text-amber-800 border-amber-200 font-mono"
                          : "bg-blue-50 text-blue-800 border-blue-200 font-mono"
                      }`}
                    >
                      {inv.type === "credit_note" ? "Credit Note (<=16 chars)" : "Tax Invoice"}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-mono font-medium text-stone-700">
                    ₹{inv.taxable_amount_inr.toLocaleString("en-IN")}
                  </td>
                  <td className="px-5 py-4 font-mono text-stone-500 text-[11px]">
                    ₹{inv.gst_amount_inr.toLocaleString("en-IN")}
                  </td>
                  <td className="px-5 py-4 font-semibold text-stone-900 font-mono">
                    ₹{inv.total_amount_inr.toLocaleString("en-IN")}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide border ${
                        inv.status === "paid"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-rose-50 text-rose-800 border-rose-200"
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      className="px-3 py-1 rounded-lg border border-stone-200 text-stone-700 hover:text-stone-900 hover:bg-stone-100 text-[11px] font-medium transition-colors"
                    >
                      View Snapshot
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* INVOICE SNAPSHOT DRAWER */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl p-6 overflow-y-auto space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-start justify-between pb-4 border-b border-stone-200">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
                    Statutory Document Snapshot
                  </span>
                  <h2 className="text-xl font-serif font-medium text-stone-900">
                    {selectedInvoice.invoice_number}
                  </h2>
                  <p className="text-xs text-stone-500 capitalize">{selectedInvoice.type.replace("_", " ")}</p>
                </div>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                >
                  ✕
                </button>
              </div>

              {/* AM:PM Studio Letterhead */}
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-100 text-xs space-y-1">
                <div className="font-serif font-semibold text-stone-900">THE AM:PM STUDIO</div>
                <div className="text-stone-600">Lane 6, South Main Road, Koregaon Park, Pune 411001</div>
                <div className="text-stone-500 font-mono text-[11px]">GSTIN: 27AABCS1429B1Z2</div>
              </div>

              {/* Customer Details */}
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-100 text-xs space-y-1">
                <span className="text-[10px] text-stone-400 uppercase font-mono block">Billed To</span>
                <div className="font-medium text-stone-900">{selectedInvoice.customer_name}</div>
                <div className="text-stone-600">{selectedInvoice.customer_email}</div>
                {selectedInvoice.customer_phone && (
                  <div className="text-stone-500 font-mono text-[11px]">{selectedInvoice.customer_phone}</div>
                )}
              </div>

              {/* Line Items Snapshot */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                  Immutable Item Snapshot & GST Rate
                </span>
                <div className="border border-stone-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-mono text-[10px] uppercase">
                      <tr>
                        <th className="p-2.5">Item</th>
                        <th className="p-2.5">Rate (₹)</th>
                        <th className="p-2.5">GST %</th>
                        <th className="p-2.5 text-right">Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {selectedInvoice.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-medium text-stone-800">{it.description}</td>
                          <td className="p-2.5 font-mono text-stone-600">₹{it.unit_price_inr.toFixed(2)}</td>
                          <td className="p-2.5 font-mono text-stone-600">{it.gst_rate_pct}%</td>
                          <td className="p-2.5 font-mono font-semibold text-right text-stone-900">
                            ₹{it.total_inr.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals Breakdown */}
              <div className="p-4 rounded-xl bg-stone-100/70 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-stone-600">Net Taxable Amount:</span>
                  <span className="font-mono font-medium text-stone-900">
                    ₹{selectedInvoice.taxable_amount_inr.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Output GST:</span>
                  <span className="font-mono font-medium text-stone-900">
                    ₹{selectedInvoice.gst_amount_inr.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-stone-200 font-semibold text-sm">
                  <span>Grand Total:</span>
                  <span className="font-mono text-stone-900">
                    ₹{selectedInvoice.total_amount_inr.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* CA Notice */}
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
                {selectedInvoice.ca_confirmation_notice}
              </div>
            </div>

            <button
              onClick={() => setSelectedInvoice(null)}
              className="w-full py-2.5 rounded-xl bg-stone-900 text-stone-50 text-xs font-medium hover:bg-stone-800 transition-colors"
            >
              Close Snapshot
            </button>
          </div>
        </div>
      )}

      {/* PRO-RATA PACK REFUND MODAL */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between pb-3 border-b border-stone-200">
              <div>
                <span className="text-[10px] font-mono uppercase text-amber-800 font-semibold">
                  Amendment 7 Compliance
                </span>
                <h3 className="text-lg font-serif font-medium text-stone-900">
                  Issue Pro-Rata Monetary Pack Refund
                </h3>
                <p className="text-xs text-stone-500">
                  Refund unused credits, generate Credit Note, and void remaining bookings.
                </p>
              </div>
              <button
                onClick={() => setShowRefundModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                ✕
              </button>
            </div>

            {/* Role Guard Warning if Front Desk */}
            {callerRole === "front_desk" && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2">
                <Lock className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>
                  <strong>Access Restricted:</strong> Front desk credentials cannot authorize monetary refunds. Switch to Owner or Manager role above to test authorization.
                </span>
              </div>
            )}

            {refundError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{refundError}</span>
              </div>
            )}

            {refundSuccessMsg ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>{refundSuccessMsg}</span>
              </div>
            ) : (
              <form onSubmit={handleProcessRefund} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-600 mb-1 font-medium">Customer</label>
                    <input
                      type="text"
                      disabled
                      value={refundTargetCustomer}
                      className="w-full px-3 py-2 bg-stone-100 border border-stone-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 mb-1 font-medium">Pack Type</label>
                    <input
                      type="text"
                      disabled
                      value={refundPackType}
                      className="w-full px-3 py-2 bg-stone-100 border border-stone-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-stone-600 mb-1 font-medium">Total Credits</label>
                    <input
                      type="number"
                      required
                      value={refundTotalCredits}
                      onChange={(e) => setRefundTotalCredits(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 mb-1 font-medium">Unused Remaining</label>
                    <input
                      type="number"
                      required
                      value={refundRemainingCredits}
                      onChange={(e) => setRefundRemainingCredits(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 mb-1 font-medium">Price Paid (₹)</label>
                    <input
                      type="number"
                      required
                      value={refundPricePaid}
                      onChange={(e) => setRefundPricePaid(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Pro-Rata Live Calculation Display */}
                <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 space-y-1">
                  <div className="flex justify-between items-center text-amber-950 font-medium">
                    <span>Pro-Rata Refund Amount (Unused Credits):</span>
                    <span className="text-base font-serif font-semibold">₹{calculatedRefund}</span>
                  </div>
                  <div className="text-[10px] text-amber-800">
                    Formula: ₹{refundPricePaid} × ({refundRemainingCredits} / {refundTotalCredits} credits)
                  </div>
                  <div className="text-[10px] text-amber-700 pt-1 border-t border-amber-200/50">
                    • Remaining {refundRemainingCredits} credits will be voided in member ledger.
                    <br />• Any future booked slots using this pack are automatically cancelled.
                  </div>
                </div>

                <div>
                  <label className="block text-stone-600 mb-1 font-medium">
                    Mandatory Refund Reason (Min 5 Characters)
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="e.g. Relocating outside Pune; physician certified medical restriction..."
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-stone-200">
                  <button
                    type="button"
                    onClick={() => setShowRefundModal(false)}
                    className="px-4 py-2 rounded-xl text-xs text-stone-600 hover:bg-stone-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={callerRole === "front_desk"}
                    className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors shadow-sm ${
                      callerRole === "front_desk"
                        ? "bg-stone-200 text-stone-400 cursor-not-allowed"
                        : "bg-amber-800 text-white hover:bg-amber-900"
                    }`}
                  >
                    Authorize & Disburse Refund
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* CREATE INVOICE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between pb-3 border-b border-stone-200">
              <div>
                <h3 className="text-lg font-serif font-medium text-stone-900">
                  Generate Tax Invoice
                </h3>
                <p className="text-xs text-stone-500">Auto-allocated next locked counter sequential number</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-stone-600 mb-1 font-medium">Customer Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram Malhotra"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-stone-600 mb-1 font-medium">Customer Email</label>
                <input
                  type="email"
                  required
                  placeholder="vikram@example.com"
                  value={newCustEmail}
                  onChange={(e) => setNewCustEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-stone-600 mb-1 font-medium">Item Description</label>
                <input
                  type="text"
                  required
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 mb-1 font-medium">Taxable Unit Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newItemRate}
                    onChange={(e) => setNewItemRate(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 mb-1 font-medium">GST Rate %</label>
                  <select
                    value={newItemGst}
                    onChange={(e) => setNewItemGst(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-mono"
                  >
                    <option value="18.0">18% (Yoga Studio Shala)</option>
                    <option value="5.0">5% (Nourish Café)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-stone-900 text-stone-50 text-xs font-medium hover:bg-stone-800 transition-colors shadow-sm"
                >
                  Commit Gapless Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
