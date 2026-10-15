"use client";

import React, { useState, useEffect } from "react";
import {
  Receipt,
  Plus,
  Search,
  Filter,
  IndianRupee,
  Calendar,
  Building2,
  FileText,
  CreditCard,
  Zap,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  PieChart,
  X,
} from "lucide-react";

interface ExpenseRecord {
  id: string;
  date: string;
  category: string;
  vendor: string;
  amount_inr: number;
  tax_inr: number;
  total_inr: number;
  invoice_ref: string;
  payment_method: string;
  notes?: string;
  is_automated_settlement?: boolean;
}

export default function AdminExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // New Expense Modal
  const [showModal, setShowModal] = useState(false);
  const [newCategory, setNewCategory] = useState("Operations");
  const [newVendor, setNewVendor] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newTax, setNewTax] = useState("0");
  const [newInvoiceRef, setNewInvoiceRef] = useState("");
  const [newPaymentMethod, setNewPaymentMethod] = useState("UPI");
  const [newNotes, setNewNotes] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);

  const fetchExpenses = () => {
    setLoading(true);
    fetch("/api/admin/expenses")
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          setExpenses(res.expenses);
          setSummary(res.summary);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: newCategory,
          vendor: newVendor,
          amount_inr: Number(newAmount),
          tax_inr: Number(newTax),
          invoice_ref: newInvoiceRef,
          payment_method: newPaymentMethod,
          notes: newNotes,
          date: newDate,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        fetchExpenses();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredExpenses = expenses.filter((exp) => {
    const matchesSearch =
      exp.vendor.toLowerCase().includes(search.toLowerCase()) ||
      exp.invoice_ref.toLowerCase().includes(search.toLowerCase()) ||
      (exp.notes && exp.notes.toLowerCase().includes(search.toLowerCase()));
    const matchesCat = categoryFilter === "all" || exp.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 text-stone-800 text-[11px] font-semibold uppercase tracking-wider border border-stone-200 mb-2">
            <Receipt className="w-3.5 h-3.5 text-stone-600" />
            Financial Governance & Disbursements
          </div>
          <h1 className="text-3xl font-serif text-stone-900">
            Operating Expenses & Disbursals
          </h1>
          <p className="text-xs text-stone-500 font-light mt-1">
            Categorized manual operating expenditures, GST input credits, and automated Razorpay payment gateway fee settlements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 text-stone-50 text-xs font-medium hover:bg-stone-800 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Record Expense
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-sm text-xs space-y-1">
            <span className="text-[10px] text-stone-400 uppercase font-mono">Taxable Operating Expenses</span>
            <div className="text-2xl font-serif font-medium text-stone-900">
              ₹{summary.total_taxable_inr.toLocaleString("en-IN")}
            </div>
            <span className="text-[10px] text-stone-400">Net deductible against taxable revenue</span>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-sm text-xs space-y-1">
            <span className="text-[10px] text-stone-400 uppercase font-mono">GST Input Tax Credit (ITC)</span>
            <div className="text-2xl font-serif font-medium text-emerald-700">
              ₹{summary.total_gst_input_credit_inr.toLocaleString("en-IN")}
            </div>
            <span className="text-[10px] text-emerald-800">Claimable against Output GST liability</span>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-sm text-xs space-y-1">
            <span className="text-[10px] text-stone-400 uppercase font-mono">Total Cash Disbursed</span>
            <div className="text-2xl font-serif font-medium text-stone-900">
              ₹{summary.total_gross_inr.toLocaleString("en-IN")}
            </div>
            <span className="text-[10px] text-stone-400">Total gross outflow including GST</span>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search vendor, invoice ref, or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {[
            { id: "all", label: "All Categories" },
            { id: "Payment Gateway Fees", label: "Gateway Fees" },
            { id: "Rent & Utilities", label: "Rent & Utilities" },
            { id: "Ingredients & Supplies", label: "Ingredients" },
            { id: "Equipment & Maintenance", label: "Maintenance" },
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

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-mono uppercase text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Vendor / Payee</th>
                <th className="px-5 py-3.5">Invoice / Batch Ref</th>
                <th className="px-5 py-3.5">Net Taxable</th>
                <th className="px-5 py-3.5">GST Credit</th>
                <th className="px-5 py-3.5">Total Amount</th>
                <th className="px-5 py-3.5">Payment Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-stone-50/70 transition-colors">
                  <td className="px-5 py-4 font-mono text-stone-500 text-[11px]">
                    {exp.date}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-medium border ${
                        exp.category === "Payment Gateway Fees"
                          ? "bg-purple-50 text-purple-800 border-purple-200"
                          : exp.category === "Rent & Utilities"
                          ? "bg-blue-50 text-blue-800 border-blue-200"
                          : "bg-stone-100 text-stone-700 border-stone-200"
                      }`}
                    >
                      {exp.category === "Payment Gateway Fees" && <Zap className="w-3 h-3 text-purple-600" />}
                      {exp.category}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-medium text-stone-900">{exp.vendor}</div>
                    {exp.notes && (
                      <div className="text-[11px] text-stone-400 truncate max-w-xs">{exp.notes}</div>
                    )}
                  </td>
                  <td className="px-5 py-4 font-mono text-stone-500 text-[11px]">
                    {exp.invoice_ref}
                  </td>
                  <td className="px-5 py-4 font-semibold text-stone-900">
                    ₹{exp.amount_inr.toLocaleString("en-IN")}
                  </td>
                  <td className="px-5 py-4 font-mono text-emerald-700 text-[11px]">
                    ₹{exp.tax_inr.toLocaleString("en-IN")}
                  </td>
                  <td className="px-5 py-4 font-mono font-medium text-stone-900">
                    ₹{exp.total_inr.toLocaleString("en-IN")}
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-[11px] text-stone-600 font-medium">
                      {exp.payment_method}
                    </span>
                    {exp.is_automated_settlement && (
                      <span className="block text-[10px] text-purple-700 font-mono">
                        (Amendment 9 Real Settlement)
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECORD EXPENSE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between pb-3 border-b border-stone-200">
              <div>
                <h3 className="text-lg font-serif font-medium text-stone-900">
                  Record Operating Expense
                </h3>
                <p className="text-xs text-stone-500">Record manual vendor bill and GST tax breakdown</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 mb-1 font-medium">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                  >
                    <option value="Ingredients & Supplies">Ingredients & Supplies</option>
                    <option value="Packaging">Packaging</option>
                    <option value="Equipment & Maintenance">Equipment & Maintenance</option>
                    <option value="Rent & Utilities">Rent & Utilities</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Cleaning & Hygiene">Cleaning & Hygiene</option>
                    <option value="Professional Fees">Professional Fees</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>
                <div>
                  <label className="block text-stone-600 mb-1 font-medium">Date</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-600 mb-1 font-medium">Vendor / Payee</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sahyadri Bio-Farms, Tata Power, etc."
                  value={newVendor}
                  onChange={(e) => setNewVendor(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 mb-1 font-medium">Taxable Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 mb-1 font-medium">GST Tax (₹ ITC)</label>
                  <input
                    type="number"
                    min="0"
                    value={newTax}
                    onChange={(e) => setNewTax(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 mb-1">Invoice / Receipt Ref</label>
                  <input
                    type="text"
                    placeholder="INV-2026-XXXX"
                    value={newInvoiceRef}
                    onChange={(e) => setNewInvoiceRef(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 mb-1">Payment Method</label>
                  <select
                    value={newPaymentMethod}
                    onChange={(e) => setNewPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer (NEFT/RTGS)">Bank Transfer</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Cash / Petty Cash">Cash</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-stone-600 mb-1">Notes / Description</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-stone-900 text-stone-50 text-xs font-medium hover:bg-stone-800 transition-colors shadow-sm"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
