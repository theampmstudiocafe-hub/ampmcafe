"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Sparkles,
  Send,
  Pin,
  Flag,
  Trash2,
  ShieldAlert,
  Megaphone,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  ShieldCheck,
  X,
  VolumeX,
  Radio,
  Lock,
} from "lucide-react";

interface Message {
  id: string;
  sender_display_name: string;
  content: string;
  is_announcement: boolean;
  is_pinned: boolean;
  created_at: string;
  isOwn?: boolean;
}

interface CurrentUser {
  id: string;
  displayName: string;
  role: string;
  isMuted: boolean;
  mutedUntil: string | null;
  canModerate: boolean;
  canAnnounce: boolean;
}

export default function CommunityPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [pinnedAnnouncements, setPinnedAnnouncements] = useState<Message[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Composer state
  const [inputText, setInputText] = useState("");
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [sending, setSending] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; isError: boolean } | null>(
    null
  );

  // Report Modal
  const [reportModalMessage, setReportModalMessage] = useState<Message | null>(null);
  const [reportReason, setReportReason] = useState("Spam or promotional advertising");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  // Moderation Modal (Mute/Ban)
  const [modModalMessage, setModModalMessage] = useState<Message | null>(null);
  const [modActionType, setModActionType] = useState<"mute" | "ban">("mute");
  const [muteMinutes, setMuteMinutes] = useState(60);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = async () => {
    try {
      const res = await fetch("/api/community/messages");
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages || []);
        setPinnedAnnouncements(data.pinnedAnnouncements || []);
        if (data.currentUser) {
          setCurrentUser(data.currentUser);
        }
      }
    } catch (err) {
      console.error("Failed to fetch community messages", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 5000); // 5s realtime poll
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!loading) {
      scrollToBottom();
    }
  }, [messages.length, loading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;

    setSending(true);
    setFeedbackMsg(null);

    try {
      const res = await fetch("/api/community/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: inputText.trim(),
          is_announcement: isAnnouncement,
          is_pinned: isPinned,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFeedbackMsg({ text: data.error || "Failed to send message", isError: true });
      } else {
        setInputText("");
        setIsAnnouncement(false);
        setIsPinned(false);
        setMessages((prev) => [...prev, data.message]);
        if (data.message.is_pinned) {
          setPinnedAnnouncements((prev) => [...prev, data.message]);
        }
        setTimeout(scrollToBottom, 100);
      }
    } catch (err: any) {
      setFeedbackMsg({ text: "Network error sending message", isError: true });
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("Delete this message from the community chat?")) return;

    try {
      const res = await fetch("/api/community/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", messageId }),
      });

      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
        setPinnedAnnouncements((prev) => prev.filter((m) => m.id !== messageId));
      }
    } catch (err) {
      console.error("Failed to delete message", err);
    }
  };

  const handleTogglePin = async (messageId: string) => {
    try {
      const res = await fetch("/api/community/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_pin", messageId }),
      });
      const data = await res.json();
      if (res.ok) {
        loadMessages();
      }
    } catch (err) {
      console.error("Failed to toggle pin", err);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportModalMessage) return;

    setReportSubmitting(true);
    try {
      const res = await fetch("/api/community/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId: reportModalMessage.id,
          reason: reportReason,
        }),
      });
      if (res.ok) {
        setReportSuccess(true);
      }
    } catch (err) {
      console.error("Failed to submit report", err);
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleModerationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modModalMessage) return;

    try {
      await fetch("/api/community/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: modActionType,
          messageId: modModalMessage.id,
          durationMinutes: muteMinutes,
          reason: `Moderation ${modActionType} applied by staff`,
        }),
      });
      setModModalMessage(null);
      loadMessages();
    } catch (err) {
      console.error("Failed to apply moderation", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900 pt-28 pb-16 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-900 text-[11px] font-semibold uppercase tracking-wider border border-amber-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Member Satsang & Circle
            </div>
            <h1 className="text-2xl md:text-3xl font-serif text-stone-900">
              THE AM:PM Community Circle
            </h1>
            <p className="text-xs text-stone-500 font-light">
              One shared sanctuary room for all members of THE AM:PM STUDIO. Connect with fellow
              practitioners and view live teacher updates.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Room
            </div>
            <div className="text-[11px] text-stone-400 font-light flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-stone-400" />
              Strict Display Name Privacy
            </div>
          </div>
        </div>

        {/* Pinned Announcements Carousel / Banner */}
        {pinnedAnnouncements.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-800">
              <Megaphone className="w-3.5 h-3.5 text-amber-600" />
              Pinned Shala Announcements
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {pinnedAnnouncements.map((ann) => (
                <div
                  key={ann.id}
                  className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-white border border-amber-200 rounded-2xl p-4 shadow-sm space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-serif font-medium text-amber-900 flex items-center gap-1.5">
                      <Pin className="w-3.5 h-3.5 text-amber-700 fill-amber-700" />
                      {ann.sender_display_name}
                    </span>
                    <span className="text-[10px] text-amber-800/70">
                      {new Date(ann.created_at).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-stone-700 font-light leading-relaxed">
                    {ann.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Chat Feed Container */}
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm flex flex-col h-[580px] overflow-hidden">
          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900" />
                  <p className="mt-2 text-xs text-stone-500 font-light">
                    Connecting to shala circle...
                  </p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center p-8">
                <div>
                  <p className="text-sm font-serif text-stone-700">The circle is quiet.</p>
                  <p className="text-xs text-stone-400 mt-1 font-light">
                    Be the first to share an insight or greeting with the community.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isAnnouncementMsg = msg.is_announcement;
                const formattedTime = new Date(msg.created_at).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                });

                return (
                  <div
                    key={msg.id}
                    className={`group flex flex-col ${
                      msg.isOwn ? "items-end" : "items-start"
                    }`}
                  >
                    {/* Header info */}
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <span
                        className={`text-xs font-medium ${
                          isAnnouncementMsg
                            ? "text-amber-800 font-serif"
                            : msg.isOwn
                            ? "text-stone-700"
                            : "text-stone-900"
                        }`}
                      >
                        {msg.sender_display_name}
                      </span>
                      {isAnnouncementMsg && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
                          Teacher Announcement
                        </span>
                      )}
                      <span className="text-[10px] text-stone-400 font-light">
                        {formattedTime}
                      </span>
                    </div>

                    {/* Bubble */}
                    <div className="relative max-w-lg">
                      <div
                        className={`p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm font-light leading-relaxed ${
                          isAnnouncementMsg
                            ? "bg-amber-50 text-stone-900 border border-amber-200 shadow-sm"
                            : msg.isOwn
                            ? "bg-stone-900 text-stone-50 rounded-tr-none shadow-sm"
                            : "bg-stone-100 text-stone-900 rounded-tl-none border border-stone-200/80"
                        }`}
                      >
                        {msg.content}
                      </div>

                      {/* Hover action toolbar */}
                      <div
                        className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/90 backdrop-blur-sm border border-stone-200 rounded-full px-2 py-1 shadow-sm ${
                          msg.isOwn ? "-left-24" : "-right-24"
                        }`}
                      >
                        {/* Report Button */}
                        <button
                          onClick={() => {
                            setReportModalMessage(msg);
                            setReportSuccess(false);
                          }}
                          className="p-1 text-stone-400 hover:text-rose-600 transition"
                          title="Report message"
                        >
                          <Flag className="w-3.5 h-3.5" />
                        </button>

                        {/* Admin / Trainer Moderation Tools */}
                        {currentUser?.canModerate && (
                          <>
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="p-1 text-stone-400 hover:text-red-700 transition"
                              title="1-Click Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleTogglePin(msg.id)}
                              className="p-1 text-stone-400 hover:text-amber-700 transition"
                              title="Pin / Unpin"
                            >
                              <Pin className="w-3.5 h-3.5" />
                            </button>
                            {!msg.isOwn && (
                              <button
                                onClick={() => setModModalMessage(msg)}
                                className="p-1 text-stone-400 hover:text-purple-700 transition"
                                title="Mute / Ban Member"
                              >
                                <VolumeX className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Composer Footer */}
          <div className="p-4 bg-stone-50 border-t border-stone-200">
            {currentUser?.isMuted ? (
              <div className="p-3 bg-red-50 text-red-800 rounded-2xl border border-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span>
                  Your messaging privileges are paused until{" "}
                  {new Date(currentUser.mutedUntil!).toLocaleTimeString()} for community
                  guidelines review.
                </span>
              </div>
            ) : !currentUser ? (
              <div className="p-4 bg-stone-100 rounded-2xl border border-stone-200 text-center space-y-2">
                <p className="text-xs text-stone-600 font-light">
                  You must be signed into a verified member account to post in the community
                  chat.
                </p>
                <Link
                  href="/login?redirect=/community"
                  className="inline-block px-5 py-2 bg-stone-900 text-white rounded-full text-xs uppercase tracking-wider font-medium hover:bg-stone-800 transition"
                >
                  Sign In to Join Circle
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="space-y-2">
                {feedbackMsg && (
                  <div
                    className={`text-xs p-2 rounded-xl flex items-center gap-1.5 ${
                      feedbackMsg.isError
                        ? "bg-rose-50 text-rose-800 border border-rose-200"
                        : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    }`}
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    {feedbackMsg.text}
                  </div>
                )}

                {/* Trainer Announcement Controls */}
                {currentUser?.canAnnounce && (
                  <div className="flex items-center gap-4 text-xs text-stone-600 pb-1">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isAnnouncement}
                        onChange={(e) => setIsAnnouncement(e.target.checked)}
                        className="rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="font-medium text-amber-900">
                        Post as Official Announcement
                      </span>
                    </label>

                    {isAnnouncement && (
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isPinned}
                          onChange={(e) => setIsPinned(e.target.checked)}
                          className="rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                        />
                        <span>Pin to top banner</span>
                      </label>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Share a thought, ask a practice question, or greet the sangha..."
                    maxLength={1000}
                    className="flex-1 px-4 py-3 text-xs sm:text-sm bg-white border border-stone-300 rounded-2xl focus:outline-none focus:ring-1 focus:ring-stone-900 placeholder:text-stone-400 font-light"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || sending}
                    className="p-3 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white rounded-2xl transition flex items-center justify-center shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-[10px] text-stone-400 px-1">
                  <span>Press Enter to send</span>
                  <span>{inputText.length} / 1000</span>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Community Guidelines Card */}
        <div className="bg-stone-100 rounded-3xl p-6 border border-stone-200 text-xs text-stone-600 font-light grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1">
            <h4 className="font-serif text-stone-900 text-sm font-medium">
              1. Sacred Satsang
            </h4>
            <p>
              Treat every practitioner with compassion. We honor non-violence (Ahimsa) in
              words and tone.
            </p>
          </div>
          <div className="space-y-1">
            <h4 className="font-serif text-stone-900 text-sm font-medium">
              2. Strict Privacy
            </h4>
            <p>
              Do not share phone numbers or personal contacts in the main circle. Members
              appear by display name only.
            </p>
          </div>
          <div className="space-y-1">
            <h4 className="font-serif text-stone-900 text-sm font-medium">
              3. Zero Commercial Spam
            </h4>
            <p>
              This circle is strictly for yoga and café wellness. Any unverified promotions
              will be removed immediately.
            </p>
          </div>
        </div>
      </div>

      {/* REPORT MODAL */}
      {reportModalMessage && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 relative shadow-2xl border border-stone-200">
            <button
              onClick={() => setReportModalMessage(null)}
              className="absolute top-5 right-5 text-stone-400 hover:text-stone-900 p-1"
            >
              <X className="w-4 h-4" />
            </button>

            {reportSuccess ? (
              <div className="text-center py-6 space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h3 className="text-xl font-serif text-stone-900">Report Received</h3>
                <p className="text-xs text-stone-500 font-light max-w-xs mx-auto">
                  Thank you for keeping our community safe. Our shala moderation team has
                  been notified to review this message.
                </p>
                <button
                  onClick={() => setReportModalMessage(null)}
                  className="mt-4 px-6 py-2 bg-stone-900 text-white rounded-full text-xs uppercase tracking-wider font-medium"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-rose-700">
                    Community Moderation
                  </span>
                  <h3 className="text-lg font-serif text-stone-900">
                    Report Chat Message
                  </h3>
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600 italic">
                    "{reportModalMessage.content}"
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1.5">
                    Reason for Reporting *
                  </label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900"
                  >
                    <option value="Spam or promotional advertising">
                      Spam or promotional advertising
                    </option>
                    <option value="Harassment or disrespectful behavior">
                      Harassment or disrespectful behavior
                    </option>
                    <option value="Inappropriate or offensive content">
                      Inappropriate or offensive content
                    </option>
                    <option value="Privacy violation (sharing phone/email)">
                      Privacy violation (sharing phone/email)
                    </option>
                    <option value="Other policy concern">Other policy concern</option>
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={reportSubmitting}
                    className="w-full py-3 bg-rose-700 hover:bg-rose-800 text-white rounded-full text-xs uppercase tracking-widest font-medium transition shadow-sm"
                  >
                    {reportSubmitting ? "Submitting..." : "Submit Report to Moderation"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODERATION ACTION MODAL (Mute/Ban) */}
      {modModalMessage && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 relative shadow-2xl border border-stone-200">
            <button
              onClick={() => setModModalMessage(null)}
              className="absolute top-5 right-5 text-stone-400 hover:text-stone-900 p-1"
            >
              <X className="w-4 h-4" />
            </button>

            <form onSubmit={handleModerationSubmit} className="space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-purple-700">
                  Staff Moderation Tool
                </span>
                <h3 className="text-lg font-serif text-stone-900">
                  Moderate Member: {modModalMessage.sender_display_name}
                </h3>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">
                  Action
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setModActionType("mute")}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border transition ${
                      modActionType === "mute"
                        ? "bg-purple-100 text-purple-900 border-purple-300"
                        : "bg-white text-stone-600 border-stone-200"
                    }`}
                  >
                    Temporary Mute
                  </button>
                  <button
                    type="button"
                    onClick={() => setModActionType("ban")}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border transition ${
                      modActionType === "ban"
                        ? "bg-rose-100 text-rose-900 border-rose-300"
                        : "bg-white text-stone-600 border-stone-200"
                    }`}
                  >
                    Permanent Ban
                  </button>
                </div>
              </div>

              {modActionType === "mute" && (
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1.5">
                    Mute Duration
                  </label>
                  <select
                    value={muteMinutes}
                    onChange={(e) => setMuteMinutes(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900"
                  >
                    <option value={60}>1 Hour</option>
                    <option value={1440}>24 Hours (1 Day)</option>
                    <option value={10080}>7 Days (1 Week)</option>
                  </select>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-full text-xs uppercase tracking-widest font-medium transition shadow-sm"
                >
                  Apply {modActionType === "mute" ? "Mute" : "Permanent Ban"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
