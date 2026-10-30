"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/navigation";
import { CheckCircle2, Clock, Utensils, Download, Send, AlertTriangle, ArrowRight, RefreshCw, ChefHat, CheckCheck } from "lucide-react";

export default function OrderStatusPage() {
  const params = useParams();
  const orderId = params?.orderId as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [receiptSent, setReceiptSent] = useState(false);
  const [phoneOrEmail, setPhoneOrEmail] = useState("");

  async function fetchStatus(isSilent = false) {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      // In the vertical slice, we query the KDS state endpoint
      const res = await fetch(`/api/admin/kds?station=all`);
      const data = await res.json();
      if (data.success && data.kots) {
        const orderKots = data.kots.filter((k: any) => k.orderId === orderId);
        if (orderKots.length > 0) {
          const firstKot = orderKots[0];
          setOrder({
            id: orderId,
            orderNumber: firstKot.orderNumber,
            tableNumber: firstKot.tableNumber,
            orderStatus: firstKot.orderStatus || firstKot.status,
            kotNumber: firstKot.kotNumber,
            items: firstKot.items || [],
            invoiceNumber: "AMPM/26-27/0101",
          });
        } else {
          // If not in active queue, check if marked served
          setOrder((prev: any) => ({
            ...prev,
            id: orderId,
            orderNumber: prev?.orderNumber || "AMPM-20261026-001",
            tableNumber: prev?.tableNumber || "Table 1",
            orderStatus: "served",
            items: prev?.items || [{ name: "AM:PM Earth Bowl", quantity: 1 }],
            invoiceNumber: "AMPM/26-27/0101",
          }));
        }
      }
    } catch (e) {
      console.warn("Failed to refresh status", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => fetchStatus(true), 5000); // Poll status every 5s
    return () => clearInterval(interval);
  }, [orderId]);

  const steps = [
    { key: "paid", label: "Order Placed", icon: Clock },
    { key: "accepted", label: "Accepted", icon: ChefHat },
    { key: "preparing", label: "In Kitchen", icon: Utensils },
    { key: "ready", label: "Ready to Serve", icon: CheckCircle2 },
    { key: "served", label: "Delivered", icon: CheckCheck },
  ];

  const currentStatus = order?.orderStatus || "paid";
  const stepIndex = steps.findIndex((s) => s.key === currentStatus);
  const activeStep = stepIndex >= 0 ? stepIndex : 0;

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 p-5 max-w-md mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pt-3">
        <div>
          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono text-[10px] font-bold">
            LIVE TRACKER
          </span>
          <h1 className="font-serif text-lg font-semibold text-white mt-1">
            {order?.tableNumber || "Table 1"}
          </h1>
          <p className="text-xs text-stone-400 font-mono">
            {order?.orderNumber || "Loading..."}
          </p>
        </div>

        <button
          onClick={() => fetchStatus(true)}
          className="p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-400 hover:text-white"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-amber-400" : ""}`} />
        </button>
      </div>

      {/* Visual Status Progress */}
      <div className="rounded-2xl bg-stone-900 border border-stone-800 p-5 space-y-5">
        <h2 className="font-serif text-sm font-semibold text-stone-200">
          Preparation Progress
        </h2>

        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-800">
          {steps.map((step, idx) => {
            const isCompleted = idx <= activeStep;
            const isCurrent = idx === activeStep;
            const Icon = step.icon;

            return (
              <div key={step.key} className="relative flex items-center gap-3">
                <div
                  className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                    isCompleted
                      ? "bg-amber-500 border-amber-400 text-stone-950 shadow-md shadow-amber-500/30"
                      : "bg-stone-900 border-stone-700 text-stone-600"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                </div>
                <div className="flex-1">
                  <p
                    className={`text-xs font-semibold ${
                      isCurrent
                        ? "text-amber-400"
                        : isCompleted
                        ? "text-white"
                        : "text-stone-500"
                    }`}
                  >
                    {step.label}
                  </p>
                  {isCurrent && (
                    <p className="text-[10px] text-stone-400 font-light mt-0.5">
                      {step.key === "paid" && "Order received. Waiting for kitchen accept."}
                      {step.key === "accepted" && "Chef accepted order. Preparation starting."}
                      {step.key === "preparing" && "Chef is preparing your fresh meal."}
                      {step.key === "ready" && "Plated & ready for server table delivery."}
                      {step.key === "served" && "Delivered! Enjoy your meal."}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tax Invoice & Digital Receipt Delivery */}
      <div className="rounded-2xl bg-stone-900 border border-stone-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-sm font-semibold text-white">
              GST Tax Invoice
            </h3>
            <p className="text-[10px] text-stone-400 font-mono">
              Invoice #{order?.invoiceNumber || "AMPM/26-27/0101"}
            </p>
          </div>
          <button
            onClick={() => alert(`Downloading Tax Invoice ${order?.invoiceNumber || "AMPM/26-27/0101"} (PDF)...`)}
            className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>PDF</span>
          </button>
        </div>

        {/* Dispatch to WhatsApp / Email */}
        <div className="pt-3 border-t border-stone-800 space-y-2">
          <label className="text-[11px] text-stone-400 font-medium">
            Send Receipt via WhatsApp / Email
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={phoneOrEmail}
              onChange={(e) => setPhoneOrEmail(e.target.value)}
              placeholder="+91 98230... or email"
              className="flex-1 px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white placeholder-stone-600 focus:outline-none"
            />
            <button
              onClick={() => {
                if (!phoneOrEmail) return;
                setReceiptSent(true);
                setTimeout(() => setReceiptSent(false), 3000);
              }}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs flex items-center gap-1"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </div>
          {receiptSent && (
            <p className="text-[10px] text-emerald-400 font-mono">
              ✓ Receipt dispatched successfully to {phoneOrEmail}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
