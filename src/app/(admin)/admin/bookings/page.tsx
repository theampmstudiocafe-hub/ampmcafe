"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Printer,
  UserPlus,
  Users,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Search,
  Check,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { offlineSyncManager } from "@/lib/services/offline-sync";

export default function AdminBookingsPage() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Override Late Cancellation Modal State
  const [overrideModal, setOverrideModal] = useState<{
    isOpen: boolean;
    booking: any | null;
    reason: string;
    submitting: boolean;
    error: string | null;
  }>({
    isOpen: false,
    booking: null,
    reason: "",
    submitting: false,
    error: null,
  });

  const fetchRoster = (date: string) => {
    setLoading(true);
    fetch(`/api/admin/bookings?date=${date}`)
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.sessions?.length > 0) {
          setSessions(res.sessions);
          setSelectedSessionId(res.sessions[0].id);

          // Cache current roster in IndexedDB with 4h TTL for offline access
          if (offlineSyncManager.cacheRoster) {
            offlineSyncManager.cacheRoster({
              session_id: res.sessions[0].id,
              class_name: res.sessions[0].title,
              start_time: res.sessions[0].start_time,
              room: res.sessions[0].room,
              cached_at: Date.now(),
              attendees: res.sessions[0].attendees.map((a: any) => ({
                booking_id: a.booking_id,
                attendee_id: a.member_id,
                display_name: a.display_name,
                status: a.status,
                emergency_name: a.emergency_contact?.name,
                emergency_phone: a.emergency_contact?.phone,
              })),
            });
          }
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRoster(selectedDate);
  }, [selectedDate]);

  const activeSession =
    sessions.find((s) => s.id === selectedSessionId) || sessions[0];

  const handleCheckIn = async (bookingId: string) => {
    // Optimistic update
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== activeSession?.id) return s;
        return {
          ...s,
          attendees: s.attendees.map((a: any) =>
            a.booking_id === bookingId ? { ...a, status: "attended" } : a
          ),
        };
      })
    );

    // Queue through offlineSyncManager (idempotent + offline safe)
    try {
      if (offlineSyncManager.queueMutation) {
        await offlineSyncManager.queueMutation("FRONT_DESK_CHECKIN", {
          booking_id: bookingId,
        });
      }
    } catch (err) {
      console.error("[CheckIn Error]", err);
    }
  };

  const handleOpenOverride = (booking: any) => {
    setOverrideModal({
      isOpen: true,
      booking,
      reason: "",
      submitting: false,
      error: null,
    });
  };

  const handleSubmitOverride = async () => {
    if (!overrideModal.reason || overrideModal.reason.trim().length < 5) {
      setOverrideModal((prev) => ({
        ...prev,
        error: "A mandatory override reason (min 5 characters) is required.",
      }));
      return;
    }

    setOverrideModal((prev) => ({ ...prev, submitting: true, error: null }));

    try {
      const res = await fetch("/api/admin/bookings/override-refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: overrideModal.booking.booking_id,
          member_id: overrideModal.booking.member_id,
          reason: overrideModal.reason.trim(),
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to override refund");
      }

      // Update state
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== activeSession?.id) return s;
          return {
            ...s,
            attendees: s.attendees.map((a: any) =>
              a.booking_id === overrideModal.booking.booking_id
                ? { ...a, status: "refund_overridden" }
                : a
            ),
          };
        })
      );

      setOverrideModal({
        isOpen: false,
        booking: null,
        reason: "",
        submitting: false,
        error: null,
      });
    } catch (err: any) {
      setOverrideModal((prev) => ({
        ...prev,
        submitting: false,
        error: err.message || "Failed to process override",
      }));
    }
  };

  const handlePrintRoster = () => {
    window.print();
  };

  const filteredAttendees = (activeSession?.attendees || []).filter(
    (a: any) =>
      a.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.booking_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-900 text-[11px] font-semibold uppercase tracking-wider border border-amber-200 mb-2">
            <Users className="w-3.5 h-3.5 text-amber-600" />
            Studio Front Desk
          </div>
          <h1 className="text-3xl font-serif text-stone-900">
            Class Sessions & Attendance Roster
          </h1>
          <p className="text-xs text-stone-500 font-light mt-1">
            Real-time check-in desk, roster management, and 12-hour cancellation policy overrides.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrintRoster}
            className="px-4 py-2 bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition"
          >
            <Printer className="w-4 h-4 text-stone-500" />
            <span>Print Instructor Roster</span>
          </button>
        </div>
      </div>

      {/* Date Navigation & Controls */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-4 h-4 text-amber-600" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 border border-stone-300 rounded-lg text-xs font-medium text-stone-800 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
          <span className="text-xs text-stone-400">
            {new Date(selectedDate).toLocaleDateString("en-IN", {
              weekday: "long",
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>

        {/* Search within active session */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search attendee..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>
      </div>

      {/* Session Tabs */}
      <div className="flex gap-2.5 overflow-x-auto pb-2">
        {sessions.map((sess) => {
          const isSelected = sess.id === activeSession?.id;
          return (
            <button
              key={sess.id}
              onClick={() => setSelectedSessionId(sess.id)}
              className={`px-4 py-3 rounded-2xl text-left border transition shrink-0 space-y-1 ${
                isSelected
                  ? "bg-amber-500 text-stone-950 border-amber-600 shadow-sm font-semibold"
                  : "bg-white text-stone-700 border-stone-200 hover:border-stone-300 hover:bg-stone-50"
              }`}
            >
              <div className="text-xs font-serif font-bold">{sess.title}</div>
              <div
                className={`text-[10px] font-mono ${
                  isSelected ? "text-stone-900" : "text-stone-400"
                }`}
              >
                {new Date(sess.start_time).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                • {sess.trainer_name}
              </div>
              <div className="text-[10px] flex items-center gap-1.5 pt-0.5">
                <span
                  className={`px-1.5 py-0.2 rounded font-semibold ${
                    isSelected
                      ? "bg-stone-950 text-amber-300"
                      : "bg-stone-100 text-stone-600"
                  }`}
                >
                  {sess.booked_count}/{sess.capacity} Booked
                </span>
                <span className="text-[10px] opacity-80">{sess.room}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Attendee Roster Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-2">
            <span className="font-serif text-sm font-bold text-stone-900">
              {activeSession?.title}
            </span>
            <span className="text-xs text-stone-400 font-light">
              — Instructor: {activeSession?.trainer_name}
            </span>
          </div>
          <span className="text-xs text-stone-500 font-mono">
            {filteredAttendees.length} Attendee(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-[10px] font-mono uppercase tracking-wider text-stone-500">
                <th className="py-3 px-4">Attendee</th>
                <th className="py-3 px-4">Pass Type</th>
                <th className="py-3 px-4">Emergency Contact</th>
                <th className="py-3 px-4">Practice Notes</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {filteredAttendees.map((a: any) => (
                <tr key={a.booking_id} className="hover:bg-stone-50/60 transition">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-stone-900">
                      {a.display_name}
                    </div>
                    <div className="text-[10px] text-stone-400 font-mono">
                      {a.booking_id}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                        a.booking_type === "free_trial"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {a.booking_type === "free_trial" ? "Free Trial" : "Class Pack"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-stone-600 text-[11px]">
                    {a.emergency_contact?.name || "Not on file"}
                    {a.emergency_contact?.phone && (
                      <div className="text-[10px] text-stone-400 font-mono">
                        {a.emergency_contact.phone}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-stone-500 text-[11px] max-w-xs truncate">
                    {a.practice_notes || "—"}
                  </td>
                  <td className="py-3.5 px-4">
                    {a.status === "attended" ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Attended
                      </span>
                    ) : a.status === "confirmed" ? (
                      <span className="inline-flex items-center gap-1 text-amber-700 font-semibold text-[11px]">
                        <Clock className="w-3.5 h-3.5" /> Booked
                      </span>
                    ) : a.status === "refund_overridden" ? (
                      <span className="inline-flex items-center gap-1 text-purple-700 font-semibold text-[11px]">
                        <RotateCcw className="w-3.5 h-3.5" /> Refund Overridden
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-700 font-semibold text-[11px]">
                        <AlertCircle className="w-3.5 h-3.5" /> Cancelled
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {a.status === "confirmed" ? (
                      <button
                        onClick={() => handleCheckIn(a.booking_id)}
                        className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold transition shadow-sm inline-flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" /> Check In
                      </button>
                    ) : a.status === "cancelled" ? (
                      <button
                        onClick={() => handleOpenOverride(a)}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3 text-amber-700" /> Override & Refund
                      </button>
                    ) : (
                      <span className="text-[11px] text-stone-400">Completed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Override Late Cancellation Modal */}
      {overrideModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-900 mb-2">
                Policy Exception Override
              </div>
              <h3 className="text-lg font-serif font-bold text-stone-900">
                Override Late Cancellation Refund
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Member: <strong>{overrideModal.booking?.display_name}</strong> (Booking: {overrideModal.booking?.booking_id})
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 space-y-1">
              <p className="font-semibold">⚠️ 12-Hour Cancellation Rule Exception</p>
              <p className="text-[11px] text-amber-800">
                This class was cancelled within the 12-hour forfeiture window. Overriding this policy restores 1 credit to the member's pack ledger and requires a mandatory reason recorded in the studio audit log.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700">
                Mandatory Override Reason *
              </label>
              <textarea
                rows={3}
                placeholder="e.g., Medical certificate submitted; approved by instructor Ananya..."
                value={overrideModal.reason}
                onChange={(e) =>
                  setOverrideModal((prev) => ({ ...prev, reason: e.target.value }))
                }
                className="w-full p-3 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
              />
              {overrideModal.error && (
                <p className="text-[11px] text-rose-600">{overrideModal.error}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() =>
                  setOverrideModal({
                    isOpen: false,
                    booking: null,
                    reason: "",
                    submitting: false,
                    error: null,
                  })
                }
                disabled={overrideModal.submitting}
                className="px-4 py-2 border border-stone-300 text-stone-700 rounded-xl text-xs font-semibold hover:bg-stone-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitOverride}
                disabled={overrideModal.submitting}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {overrideModal.submitting ? "Restoring..." : "Confirm & Restore Credit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
