"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Layers,
  Clock,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Plus,
  X,
  CreditCard,
  Sparkles,
  MessageSquare,
} from "lucide-react";

export default function MemberDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<{
    bookings: any[];
    userPacks: any[];
    ledgerEntries: any[];
    hasUsedTrial: boolean;
    totalCredits: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelModalBooking, setCancelModalBooking] = useState<any | null>(null);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const loadData = async () => {
    try {
      const res = await fetch("/api/booking/user");
      if (res.status === 401) {
        router.push("/login?redirect=/dashboard");
        return;
      }
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCancelBooking = async () => {
    if (!cancelModalBooking) return;
    setCancellingId(cancelModalBooking.id);
    setMessage(null);

    try {
      const res = await fetch("/api/booking/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: cancelModalBooking.id }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to cancel booking");
      }

      setMessage({ text: result.message, isError: !result.refunded });
      setCancelModalBooking(null);
      await loadData();
    } catch (err: any) {
      setMessage({ text: err?.message || "Cancellation failed.", isError: true });
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F6F0] flex items-center justify-center text-stone-400">
        <Loader2 className="w-8 h-8 animate-spin text-[#C86D51] mb-2" />
        <span className="text-sm ml-2">Loading member portal...</span>
      </div>
    );
  }

  const upcomingBookings = data?.bookings?.filter((b) => b.status === "confirmed") || [];

  return (
    <div className="min-h-screen bg-[#F9F6F0] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#EAE3D6]">
          <div>
            <span className="text-xs uppercase tracking-widest font-semibold text-[#657E6B] bg-[#EFF4F0] px-3 py-1 rounded-full">
              Member Sanctuary
            </span>
            <h1 className="text-3xl font-serif font-bold text-[#1E2421] mt-2">
              Welcome Back to Your Practice
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/community"
              className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-semibold rounded-xl shadow-sm flex items-center gap-1.5 transition"
            >
              <MessageSquare className="w-4 h-4 text-amber-700" />
              <span>Community Circle</span>
            </Link>
            <Link
              href="/book"
              className="px-4 py-2.5 bg-[#C86D51] hover:bg-[#B65A3E] text-white text-xs font-semibold rounded-xl shadow-sm flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Book A Class</span>
            </Link>
            <Link
              href="/packs"
              className="px-4 py-2.5 bg-white border border-[#EAE3D6] text-stone-700 text-xs font-semibold rounded-xl shadow-sm hover:border-[#C86D51] transition"
            >
              Buy Class Packs
            </Link>
          </div>
        </div>

        {/* Notifications */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-xl flex items-center gap-2 text-sm border ${
              message.isError
                ? "bg-amber-50 text-amber-900 border-amber-200"
                : "bg-emerald-50 text-emerald-900 border-emerald-200"
            }`}
          >
            {message.isError ? (
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
            ) : (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-[#EAE3D6] shadow-sm">
            <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
              <span>Remaining Credits</span>
              <Layers className="w-4 h-4 text-[#C86D51]" />
            </div>
            <div className="text-3xl font-bold text-[#1E2421]">{data?.totalCredits || 0}</div>
            <p className="text-[11px] text-stone-400 mt-1">Applicable to all regular shala classes</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#EAE3D6] shadow-sm">
            <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
              <span>Upcoming Classes</span>
              <Calendar className="w-4 h-4 text-[#657E6B]" />
            </div>
            <div className="text-3xl font-bold text-[#1E2421]">{upcomingBookings.length}</div>
            <p className="text-[11px] text-stone-400 mt-1">Confirmed spots reserved</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#EAE3D6] shadow-sm">
            <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
              <span>Free Trial Benefit</span>
              <ShieldCheck className="w-4 h-4 text-stone-400" />
            </div>
            <div className="text-lg font-bold text-[#1E2421]">
              {data?.hasUsedTrial ? "Claimed" : "Available"}
            </div>
            <p className="text-[11px] text-stone-400 mt-1">
              {data?.hasUsedTrial
                ? "Complimentary class used"
                : "Ready to use on your next booking"}
            </p>
          </div>
        </div>

        {/* Main 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Upcoming Classes */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="text-xl font-serif font-bold text-[#1E2421] mb-4">
                Upcoming Reserved Spots
              </h2>

              {upcomingBookings.length === 0 ? (
                <div className="bg-white border border-[#EAE3D6] rounded-2xl p-8 text-center text-stone-500 shadow-sm">
                  <Calendar className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-stone-700">No upcoming classes booked.</p>
                  <p className="text-xs text-stone-400 mt-1 mb-4">
                    Reserve a spot to deepen your flow this week.
                  </p>
                  <Link
                    href="/book"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#C86D51] text-white text-xs font-semibold rounded-lg hover:bg-[#B65A3E] transition"
                  >
                    <span>Browse Schedule</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingBookings.map((b) => {
                    const session = b.class_sessions;
                    const dateStr = new Date(session.start_time).toLocaleString("en-IN", {
                      timeZone: "Asia/Kolkata",
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <div
                        key={b.id}
                        className="bg-white border border-[#EAE3D6] rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-[#1E2421]">
                              {session.class_types.name}
                            </span>
                            {b.is_trial && (
                              <span className="text-[10px] bg-[#C86D51]/15 text-[#C86D51] font-semibold px-2 py-0.5 rounded-full uppercase">
                                Free Trial
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-stone-600 flex items-center gap-3">
                            <span>Teacher: <strong>{session.trainers.name}</strong></span>
                            <span>•</span>
                            <span>When: <strong>{dateStr}</strong></span>
                            <span>•</span>
                            <span>{session.room}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => setCancelModalBooking(b)}
                          className="text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 transition shrink-0 self-start sm:self-auto"
                        >
                          Cancel Booking
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Credit Ledger Table */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-serif font-bold text-[#1E2421]">
                  Credit Activity Ledger
                </h2>
                <span className="text-xs text-stone-400">Immutable Audit Record</span>
              </div>

              <div className="bg-white border border-[#EAE3D6] rounded-2xl shadow-sm overflow-hidden">
                {(!data?.ledgerEntries || data.ledgerEntries.length === 0) ? (
                  <div className="p-8 text-center text-xs text-stone-400">
                    No transactions recorded in your credit ledger yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FAF7F2] border-b border-[#EAE3D6] text-stone-500 font-semibold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Type</th>
                          <th className="py-3 px-4">Change</th>
                          <th className="py-3 px-4">Reason</th>
                          <th className="py-3 px-4 text-right">Balance After</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 text-stone-700">
                        {data.ledgerEntries.map((entry) => (
                          <tr key={entry.id} className="hover:bg-stone-50 transition">
                            <td className="py-3 px-4 text-stone-500 whitespace-nowrap">
                              {new Date(entry.created_at).toLocaleDateString("en-IN", {
                                month: "short",
                                day: "numeric",
                              })}
                            </td>
                            <td className="py-3 px-4 capitalize font-medium">
                              {entry.entry_type.replace("_", " ")}
                            </td>
                            <td className="py-3 px-4 font-bold">
                              <span
                                className={
                                  entry.amount > 0 ? "text-emerald-700" : "text-[#C86D51]"
                                }
                              >
                                {entry.amount > 0 ? `+${entry.amount}` : entry.amount}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-stone-600 max-w-[240px] truncate">
                              {entry.reason}
                            </td>
                            <td className="py-3 px-4 text-right font-semibold">
                              {entry.balance_after}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Active Packs */}
          <div>
            <h2 className="text-xl font-serif font-bold text-[#1E2421] mb-4">
              Your Active Packs
            </h2>

            {(!data?.userPacks || data.userPacks.length === 0) ? (
              <div className="bg-white border border-[#EAE3D6] rounded-2xl p-6 text-center text-stone-500 shadow-sm">
                <p className="text-xs mb-3">You have no active class packs.</p>
                <Link
                  href="/packs"
                  className="inline-block w-full py-2.5 bg-[#C86D51] text-white text-xs font-semibold rounded-xl hover:bg-[#B65A3E] transition"
                >
                  Explore Class Packs
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {data.userPacks.map((pack) => {
                  const expiryDate = new Date(pack.expires_at).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  return (
                    <div
                      key={pack.id}
                      className="bg-white border border-[#EAE3D6] rounded-2xl p-5 shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-bold text-[#1E2421]">
                          {pack.pack_types?.name}
                        </h3>
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full uppercase">
                          Active
                        </span>
                      </div>

                      <div className="flex items-baseline gap-1 my-3">
                        <span className="text-2xl font-bold text-[#C86D51]">
                          {pack.remaining_credits}
                        </span>
                        <span className="text-xs text-stone-400">
                          / {pack.initial_credits} credits remaining
                        </span>
                      </div>

                      <div className="text-[11px] text-stone-500 flex items-center gap-1.5 pt-3 border-t border-stone-100">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        <span>Expires on {expiryDate}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Cancellation Confirmation Modal */}
        {cancelModalBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-[#EAE3D6] p-6 relative">
              <button
                onClick={() => setCancelModalBooking(null)}
                className="absolute right-4 top-4 text-stone-400 hover:text-stone-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-lg font-serif font-bold text-[#1E2421] mb-2">
                Cancel Class Booking?
              </h3>
              <p className="text-xs text-stone-600 mb-4">
                Are you sure you want to cancel your reservation for{" "}
                <strong>
                  {cancelModalBooking.class_sessions?.class_types?.name}
                </strong>
                ?
              </p>

              <div className="bg-[#FAF7F2] border border-[#EAE3D6] p-3 rounded-xl text-xs text-stone-600 space-y-1 mb-5">
                <div className="flex items-center gap-1.5 font-semibold text-[#1E2421]">
                  <ShieldCheck className="w-4 h-4 text-[#657E6B]" />
                  <span>Cancellation Window Policy:</span>
                </div>
                <p className="text-[11px] text-stone-500">
                  Cancellations made <strong>12+ hours</strong> prior to class start return 1 credit directly to your pack ledger. Late cancellations within 12 hours forfeit the credit.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setCancelModalBooking(null)}
                  className="flex-1 py-2.5 bg-stone-100 text-stone-700 rounded-xl text-xs font-semibold hover:bg-stone-200 transition"
                >
                  Keep Reservation
                </button>
                <button
                  onClick={handleCancelBooking}
                  disabled={cancellingId !== null}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-60 flex items-center justify-center gap-1.5"
                >
                  {cancellingId ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Confirm Cancel</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
