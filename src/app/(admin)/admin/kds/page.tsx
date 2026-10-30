"use client";

import React, { useState, useEffect } from "react";
import {
  ChefHat,
  Clock,
  Printer,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  UtensilsCrossed,
  Volume2,
  VolumeX,
  Play,
  CheckCheck,
} from "lucide-react";

export default function KitchenDisplaySystemPage() {
  const [station, setStation] = useState<string>("all");
  const [kots, setKots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [rejectingKotId, setRejectingKotId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [printStatus, setPrintStatus] = useState<string | null>(null);
  const [show86Modal, setShow86Modal] = useState(false);
  const [menuItemsList, setMenuItemsList] = useState<any[]>([]);

  async function loadMenuItemsFor86() {
    try {
      const res = await fetch("/api/admin/menu/toggle-availability");
      const data = await res.json();
      if (data.success) {
        setMenuItemsList(data.items || []);
      }
    } catch (e) {
      console.warn("Failed to load menu for 86", e);
    }
  }

  async function handleToggle86(itemId: string) {
    try {
      const res = await fetch("/api/admin/menu/toggle-availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      const data = await res.json();
      if (data.success) {
        setMenuItemsList((prev) =>
          prev.map((it) => (it.id === itemId ? { ...it, isAvailable: data.isAvailable } : it))
        );
      }
    } catch (e) {
      alert("Failed to toggle 86 status");
    }
  }

  // 1. Fetch active KOTs from KDS API
  async function fetchKots() {
    try {
      const res = await fetch(`/api/admin/kds?station=${station}`);
      const data = await res.json();
      if (data.success) {
        setKots(data.kots || []);
      }
    } catch (e) {
      console.warn("KDS poll error", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchKots();
    const interval = setInterval(fetchKots, 3000); // 3s live polling
    return () => clearInterval(interval);
  }, [station]);

  // 2. Play subtle chime on new order
  function playAlertChime() {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch (e) {
      // Audio autoplay may be muted by browser
    }
  }

  // 3. Status Transition Handler
  async function handleTransition(kotId: string, action: string, reason?: string) {
    setActionInProgress(kotId);
    try {
      const res = await fetch("/api/admin/kds/transition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kotId,
          action,
          rejectionReason: reason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (action === "reject" && data.refundDetails) {
          alert(`Order rejected. Pro-rata refund of Rs. ${(data.refundDetails.refundGrossPaise / 100).toFixed(2)} processed via Razorpay. Credit Note ${data.refundDetails.creditNoteNumber} generated.`);
        }
        if (data.tableReopened) {
          alert("All items delivered! Table has been automatically reopened for new guests.");
        }
        await fetchKots();
      } else {
        alert(data.error || "Action failed");
      }
    } catch (e: any) {
      alert(e.message || "Network error");
    } finally {
      setActionInProgress(null);
      setRejectingKotId(null);
      setRejectReason("");
    }
  }

  // 4. Test Manual Print Slip Trigger
  async function handlePrintTicket(kot: any) {
    setPrintStatus(`Printing ${kot.kotNumber}...`);
    try {
      const res = await fetch("/api/admin/kds/print?target=all");
      const data = await res.json();
      if (data.success && data.jobs && data.jobs.length > 0) {
        const job = data.jobs.find((j: any) => j.kot_id === kot.id) || data.jobs[0];
        // Open printable window for 58mm browser spooler fallback
        const printWindow = window.open("", "_blank", "width=320,height=600");
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>KOT Print</title>
                <style>
                  @page { size: 58mm auto; margin: 0; }
                  body { font-family: monospace; font-size: 11px; margin: 5px; white-space: pre-wrap; }
                </style>
              </head>
              <body>
                ${job.escposAscii || "KOT PRINT TICKET"}
              </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.focus();
          printWindow.print();
        }
      }
    } catch (e) {
      console.warn("Print error", e);
    } finally {
      setTimeout(() => setPrintStatus(null), 2000);
    }
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 p-6 space-y-6">
      {/* Top KDS Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-serif text-xl font-bold text-white tracking-wide">
              Kitchen Display System (KDS)
            </h1>
            <p className="text-xs text-stone-400">Real-Time Station Ticket Routing & Fulfillment</p>
          </div>
        </div>

        {/* Station Tabs & Controls */}
        <div className="flex items-center gap-3">
          <div className="flex rounded-xl bg-stone-900 border border-stone-800 p-1">
            {["all", "food", "beverage", "dessert"].map((tab) => (
              <button
                key={tab}
                onClick={() => setStation(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                  station === tab
                    ? "bg-amber-500 text-stone-950 shadow"
                    : "text-stone-400 hover:text-white"
                }`}
              >
                {tab === "all" ? "All Stations" : tab}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              loadMenuItemsFor86();
              setShow86Modal(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span>86 Controls</span>
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl border transition ${
              soundEnabled
                ? "bg-stone-900 border-amber-500/40 text-amber-400"
                : "bg-stone-900 border-stone-800 text-stone-500"
            }`}
            title={soundEnabled ? "Mute audio chimes" : "Enable audio chimes"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={() => fetchKots()}
            className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-400 hover:text-white"
            title="Refresh Tickets"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {printStatus && (
        <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-xs flex items-center gap-2">
          <Printer className="w-4 h-4 animate-pulse" />
          <span>{printStatus}</span>
        </div>
      )}

      {/* Ticket Grid */}
      {loading ? (
        <div className="flex items-center justify-center p-20">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : kots.length === 0 ? (
        <div className="rounded-2xl bg-stone-900/40 border border-stone-800 p-16 text-center space-y-3">
          <UtensilsCrossed className="w-10 h-10 text-stone-600 mx-auto" />
          <h2 className="font-serif text-lg font-semibold text-stone-300">All Stations Clear</h2>
          <p className="text-xs text-stone-500">No pending orders in the kitchen queue.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {kots.map((kot) => {
            const isPending = kot.status === "pending";
            const isAccepted = kot.status === "accepted";
            const isPreparing = kot.status === "preparing";
            const isReady = kot.status === "ready";

            const slaBorder =
              kot.slaTier === "green"
                ? "border-emerald-500/40"
                : kot.slaTier === "yellow"
                ? "border-amber-500/40"
                : "border-red-500/60";

            return (
              <div
                key={kot.id}
                className={`rounded-2xl bg-stone-900 border ${slaBorder} flex flex-col justify-between overflow-hidden shadow-xl`}
              >
                {/* Ticket Top Header */}
                <div className="p-4 border-b border-stone-800/80 bg-stone-950/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-stone-950 font-mono font-bold text-xs">
                      {kot.tableNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-stone-800 text-[10px] font-mono uppercase text-stone-300">
                      {kot.station}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono text-stone-400">
                    <span>{kot.kotNumber}</span>
                    <div className="flex items-center gap-1 font-semibold text-white">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>{kot.elapsedMinutes}m ago</span>
                    </div>
                  </div>
                </div>

                {/* Items List */}
                <div className="p-4 flex-1 space-y-3">
                  {(kot.items || []).map((item: any, idx: number) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-start justify-between text-sm font-medium text-white">
                        <span>
                          <strong className="text-amber-400">{item.quantity}x</strong> {item.name}
                        </span>
                      </div>
                      {item.specialInstructions && (
                        <p className="text-[11px] text-amber-300 font-mono bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                          Note: {item.specialInstructions}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Action Footer */}
                <div className="p-3 border-t border-stone-800 bg-stone-950/40 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => handlePrintTicket(kot)}
                      className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs flex items-center gap-1 transition"
                      title="Print 58mm Ticket"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print</span>
                    </button>

                    {isPending && (
                      <div className="flex gap-1.5 flex-1 justify-end">
                        <button
                          onClick={() => setRejectingKotId(kot.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-semibold transition"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleTransition(kot.id, "accept")}
                          disabled={actionInProgress === kot.id}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Accept</span>
                        </button>
                      </div>
                    )}

                    {isAccepted && (
                      <button
                        onClick={() => handleTransition(kot.id, "start_prep")}
                        disabled={actionInProgress === kot.id}
                        className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition flex items-center justify-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Start Prep (Deplete)</span>
                      </button>
                    )}

                    {isPreparing && (
                      <button
                        onClick={() => handleTransition(kot.id, "ready")}
                        disabled={actionInProgress === kot.id}
                        className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark Ready</span>
                      </button>
                    )}

                    {isReady && (
                      <button
                        onClick={() => handleTransition(kot.id, "serve")}
                        disabled={actionInProgress === kot.id}
                        className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Mark Served (Reopen Table)</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      {rejectingKotId && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-sm w-full p-5 space-y-4">
            <h3 className="font-serif text-base font-semibold text-white">
              Reject Station Ticket
            </h3>
            <p className="text-xs text-stone-400">
              Rejecting this station ticket will automatically refund the guest pro-rata via Razorpay and generate a statutory Credit Note.
            </p>
            <input
              type="text"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Out of ingredients, station offline"
              className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white placeholder-stone-600 focus:outline-none"
            />
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setRejectingKotId(null)}
                className="px-3 py-1.5 rounded-lg bg-stone-800 text-stone-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleTransition(rejectingKotId, "reject", rejectReason)}
                className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold"
              >
                Confirm Rejection & Refund
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 86 Items / Out of Stock Modal */}
      {show86Modal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-md w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800">
              <div>
                <h3 className="font-serif text-base font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span>86 / Kitchen Availability</span>
                </h3>
                <p className="text-[11px] text-stone-400">
                  Toggle items or ingredients unavailable to immediately disable them on guest QR & POS.
                </p>
              </div>
              <button
                onClick={() => setShow86Modal(false)}
                className="text-stone-400 hover:text-white text-xs font-semibold"
              >
                Done
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {menuItemsList.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-serif text-xs font-bold text-white">{item.name}</p>
                    <p className="font-mono text-[10px] text-stone-500 uppercase">{item.station} station</p>
                  </div>

                  <button
                    onClick={() => handleToggle86(item.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      item.isAvailable
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                        : "bg-red-500/20 text-red-400 border border-red-500/50"
                    }`}
                  >
                    {item.isAvailable ? "Available" : "86 / Out"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
