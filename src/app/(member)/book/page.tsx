"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  User,
  MapPin,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  X,
} from "lucide-react";

interface Session {
  id: string;
  room: string;
  start_time: string;
  end_time: string;
  capacity: number;
  status: string;
  bookedCount: number;
  spotsRemaining: number;
  isFull: boolean;
  class_types: {
    id: string;
    name: string;
    slug: string;
    description: string;
    duration_minutes: number;
    color_hex: string;
  };
  trainers: {
    id: string;
    name: string;
    slug: string;
    specialties: string[];
  };
}

export default function BookClassPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [bookingMode, setBookingMode] = useState<"trial" | "pack_credit">("pack_credit");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<any | null>(null);

  // User state
  const [userData, setUserData] = useState<{
    authenticated: boolean;
    userPacks?: any[];
    totalCredits?: number;
    hasUsedTrial?: boolean;
  }>({ authenticated: false });

  // Fetch sessions and user stats
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const [sessRes, userRes] = await Promise.all([
          fetch("/api/booking/sessions"),
          fetch("/api/booking/user"),
        ]);

        const sessData = await sessRes.json();
        if (sessData.sessions) {
          setSessions(sessData.sessions);
          // Set initial date to first available session date
          if (sessData.sessions.length > 0) {
            const firstDate = new Date(sessData.sessions[0].start_time).toDateString();
            setSelectedDate(firstDate);
          }
        }

        if (userRes.ok) {
          const uData = await userRes.json();
          if (uData.success) {
            setUserData({
              authenticated: true,
              totalCredits: uData.data.totalCredits,
              hasUsedTrial: uData.data.hasUsedTrial,
            });
            // Default to trial if user hasn't used trial yet
            if (!uData.data.hasUsedTrial) {
              setBookingMode("trial");
            }
          }
        }
      } catch (err) {
        console.error("Failed to load booking data", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Filter dates
  const availableDates = Array.from(
    new Set(sessions.map((s) => new Date(s.start_time).toDateString()))
  );

  const filteredSessions = sessions.filter(
    (s) => new Date(s.start_time).toDateString() === selectedDate
  );

  const handleBook = async () => {
    if (!selectedSession) return;
    setBookingLoading(true);
    setBookingError(null);

    try {
      const res = await fetch("/api/booking/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: selectedSession.id,
          paymentOption: bookingMode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Booking failed");
      }

      setBookingSuccess(data);
      // Refresh session spots
      setSessions((prev) =>
        prev.map((s) =>
          s.id === selectedSession.id
            ? { ...s, bookedCount: s.bookedCount + 1, spotsRemaining: Math.max(0, s.spotsRemaining - 1) }
            : s
        )
      );
    } catch (err: any) {
      setBookingError(err?.message || "Failed to confirm booking.");
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F6F0] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 pb-6 border-b border-[#EAE3D6]">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs uppercase tracking-widest font-semibold text-[#657E6B] bg-[#EFF4F0] px-3 py-1 rounded-full">
                Interactive Schedule
              </span>
              <span className="text-xs text-stone-500 font-medium">Main Shala • Pune</span>
            </div>
            <h1 className="text-3xl font-serif font-bold text-[#1E2421]">
              Reserve Your Practice Spot
            </h1>
            <p className="text-sm text-stone-600 mt-1">
              Select your preferred day, explore our teachers, and confirm your mat.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {userData.authenticated ? (
              <div className="flex items-center gap-3 bg-white border border-[#EAE3D6] px-4 py-2.5 rounded-xl shadow-sm">
                <div className="text-right">
                  <div className="text-xs text-stone-500">Available Credits</div>
                  <div className="text-base font-bold text-[#C86D51]">
                    {userData.totalCredits || 0} Credits
                  </div>
                </div>
                <Link
                  href="/packs"
                  className="text-xs font-semibold bg-[#C86D51] text-white px-3 py-2 rounded-lg hover:bg-[#B65A3E] transition"
                >
                  Buy Packs
                </Link>
              </div>
            ) : (
              <Link
                href="/login"
                className="text-xs font-semibold bg-white border border-[#EAE3D6] text-stone-700 px-4 py-2.5 rounded-xl shadow-sm hover:border-[#C86D51] transition"
              >
                Sign in to book
              </Link>
            )}
          </div>
        </div>

        {/* Date Selector Tabs */}
        {availableDates.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
            {availableDates.map((dateStr) => {
              const d = new Date(dateStr);
              const isSelected = selectedDate === dateStr;
              const dayName = d.toLocaleDateString("en-IN", { weekday: "short" });
              const monthDay = d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`flex flex-col items-center min-w-[90px] py-3 px-4 rounded-xl border transition ${
                    isSelected
                      ? "bg-[#C86D51] border-[#C86D51] text-white shadow-sm"
                      : "bg-white border-[#EAE3D6] text-stone-700 hover:border-[#C86D51]/50"
                  }`}
                >
                  <span className={`text-xs font-medium uppercase ${isSelected ? "text-white/80" : "text-stone-400"}`}>
                    {dayName}
                  </span>
                  <span className="text-sm font-bold mt-0.5">{monthDay}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Sessions Grid */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-stone-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3 text-[#C86D51]" />
            <p className="text-sm">Loading studio schedule...</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#EAE3D6] p-12 text-center text-stone-500">
            <Calendar className="w-10 h-10 mx-auto text-stone-300 mb-3" />
            <p className="text-base font-medium text-stone-700">No sessions scheduled on this date.</p>
            <p className="text-xs text-stone-400 mt-1">Please select another date above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSessions.map((session) => {
              const startTime = new Date(session.start_time).toLocaleTimeString("en-IN", {
                timeZone: "Asia/Kolkata",
                hour: "2-digit",
                minute: "2-digit",
              });
              const endTime = new Date(session.end_time).toLocaleTimeString("en-IN", {
                timeZone: "Asia/Kolkata",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={session.id}
                  className="bg-white rounded-2xl border border-[#EAE3D6] p-5 hover:border-[#C86D51]/60 transition shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <span
                          className="inline-block text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full mb-1.5"
                          style={{
                            backgroundColor: `${session.class_types.color_hex}15`,
                            color: session.class_types.color_hex,
                          }}
                        >
                          {session.class_types.name}
                        </span>
                        <h3 className="text-lg font-bold text-[#1E2421]">
                          {session.class_types.name}
                        </h3>
                      </div>

                      <div
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          session.isFull
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : session.spotsRemaining <= 3
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : "bg-[#EFF4F0] text-[#657E6B] border border-[#657E6B]/30"
                        }`}
                      >
                        {session.isFull ? "Full" : `${session.spotsRemaining} spots left`}
                      </div>
                    </div>

                    <p className="text-xs text-stone-600 line-clamp-2 mb-4">
                      {session.class_types.description}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-xs text-stone-600 mb-5">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#C86D51]" />
                        <span>
                          {startTime} - {endTime} ({session.class_types.duration_minutes}m)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#657E6B]" />
                        <span>{session.trainers.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-stone-400" />
                        <span>{session.room}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    disabled={session.isFull}
                    onClick={() => {
                      setSelectedSession(session);
                      setBookingError(null);
                      setBookingSuccess(null);
                    }}
                    className={`w-full py-2.5 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition ${
                      session.isFull
                        ? "bg-stone-100 text-stone-400 cursor-not-allowed"
                        : "bg-[#C86D51] hover:bg-[#B65A3E] text-white shadow-sm"
                    }`}
                  >
                    <span>{session.isFull ? "Join Waitlist" : "Book Spot"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Booking Modal */}
        {selectedSession && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-[#EAE3D6] p-6 relative">
              <button
                onClick={() => setSelectedSession(null)}
                className="absolute right-4 top-4 text-stone-400 hover:text-stone-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>

              {bookingSuccess ? (
                <div className="text-center py-6">
                  <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-serif font-bold text-[#1E2421] mb-2">
                    Spot Confirmed!
                  </h3>
                  <p className="text-sm text-stone-600 mb-6">
                    {bookingSuccess.message} A confirmation has been sent to your email.
                  </p>
                  <div className="bg-[#FAF7F2] border border-[#EAE3D6] p-4 rounded-xl text-left text-xs space-y-1.5 mb-6">
                    <div><strong>Class:</strong> {bookingSuccess.sessionDetails?.className}</div>
                    <div><strong>Teacher:</strong> {bookingSuccess.sessionDetails?.trainerName}</div>
                    <div><strong>Time:</strong> {bookingSuccess.sessionDetails?.formattedDate}</div>
                    <div><strong>Location:</strong> {bookingSuccess.sessionDetails?.room}</div>
                  </div>
                  <div className="flex gap-3">
                    <Link
                      href="/dashboard"
                      className="flex-1 py-2.5 bg-[#C86D51] text-white rounded-xl text-xs font-semibold hover:bg-[#B65A3E] transition"
                    >
                      View in Dashboard
                    </Link>
                    <button
                      onClick={() => setSelectedSession(null)}
                      className="flex-1 py-2.5 bg-stone-100 text-stone-700 rounded-xl text-xs font-semibold hover:bg-stone-200 transition"
                    >
                      Book Another
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-xl font-serif font-bold text-[#1E2421] mb-1">
                    Confirm Class Booking
                  </h3>
                  <p className="text-xs text-stone-500 mb-5">
                    {selectedSession.class_types.name} with {selectedSession.trainers.name}
                  </p>

                  {bookingError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{bookingError}</span>
                    </div>
                  )}

                  <div className="space-y-3 mb-6">
                    {!userData.hasUsedTrial && (
                      <label
                        className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                          bookingMode === "trial"
                            ? "bg-[#F7ECE8] border-[#C86D51] text-[#C86D51]"
                            : "bg-[#FAF7F2] border-[#EAE3D6] text-stone-700"
                        }`}
                      >
                        <input
                          type="radio"
                          name="option"
                          checked={bookingMode === "trial"}
                          onChange={() => setBookingMode("trial")}
                          className="mt-0.5 text-[#C86D51] focus:ring-[#C86D51]"
                        />
                        <div className="text-xs">
                          <div className="font-bold flex items-center gap-1.5">
                            <span>Use Complimentary Free Trial</span>
                            <span className="text-[10px] bg-[#C86D51] text-white px-2 py-0.5 rounded-full uppercase">
                              ₹0
                            </span>
                          </div>
                          <p className="text-stone-500 mt-0.5">
                            First-time member benefit (1 per person).
                          </p>
                        </div>
                      </label>
                    )}

                    <label
                      className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                        bookingMode === "pack_credit"
                          ? "bg-[#EFF4F0] border-[#657E6B] text-[#657E6B]"
                          : "bg-[#FAF7F2] border-[#EAE3D6] text-stone-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name="option"
                        checked={bookingMode === "pack_credit"}
                        onChange={() => setBookingMode("pack_credit")}
                        className="mt-0.5 text-[#657E6B] focus:ring-[#657E6B]"
                      />
                      <div className="text-xs">
                        <div className="font-bold flex items-center gap-1.5">
                          <span>Use Class Pack Credit (1 Credit)</span>
                          <span className="text-[10px] bg-[#657E6B] text-white px-2 py-0.5 rounded-full">
                            Balance: {userData.totalCredits || 0}
                          </span>
                        </div>
                        <p className="text-stone-500 mt-0.5">
                          Deducted from your active pack balance.
                        </p>
                      </div>
                    </label>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-stone-500 mb-6 bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                    <ShieldCheck className="w-4 h-4 text-[#657E6B] shrink-0" />
                    <span>
                      Full refund if cancelled at least 12 hours prior to start time.
                    </span>
                  </div>

                  <button
                    onClick={handleBook}
                    disabled={bookingLoading}
                    className="w-full py-3 bg-[#C86D51] hover:bg-[#B65A3E] text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-60"
                  >
                    {bookingLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Confirm Reservation</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
