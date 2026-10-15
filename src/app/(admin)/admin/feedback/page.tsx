"use client";

import React, { useState, useEffect } from "react";
import {
  MessageSquareHeart,
  Star,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  X,
  User,
  Coffee,
  HeartHandshake,
} from "lucide-react";

interface FeedbackItem {
  id: string;
  user_name: string;
  user_email: string;
  target_type: "class_session" | "trainer" | "cafe_dish" | "studio_ambiance" | "general";
  target_title: string;
  rating: number;
  sentiment: "positive" | "neutral" | "negative";
  tags: string[];
  comments: string;
  source: "app" | "web" | "qr_table";
  status: "pending" | "reviewed" | "resolved";
  created_at: string;
  resolution_notes?: string;
  resolved_by?: string;
  resolved_at?: string;
}

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [targetFilter, setTargetFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Resolve Modal State
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [resolutionText, setResolutionText] = useState("");
  const [resolveSuccessMsg, setResolveSuccessMsg] = useState<string | null>(null);

  const fetchFeedback = () => {
    setLoading(true);
    fetch(`/api/admin/feedback?target_type=${targetFilter}&status=${statusFilter}`)
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          setFeedback(res.feedback);
          setMetrics(res.metrics);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFeedback();
  }, [targetFilter, statusFilter]);

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFeedback) return;

    try {
      const res = await fetch("/api/admin/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedFeedback.id,
          status: "resolved",
          resolution_notes: resolutionText,
          resolved_by: "Management Staff",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResolveSuccessMsg("Resolution notes logged and feedback marked resolved.");
        setTimeout(() => {
          setSelectedFeedback(null);
          setResolutionText("");
          setResolveSuccessMsg(null);
          fetchFeedback();
        }, 1500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredFeedback = feedback.filter((f) => {
    const q = search.toLowerCase();
    return (
      f.user_name.toLowerCase().includes(q) ||
      f.comments.toLowerCase().includes(q) ||
      f.target_title.toLowerCase().includes(q) ||
      f.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-900 text-[11px] font-semibold uppercase tracking-wider border border-rose-200 mb-2">
            <MessageSquareHeart className="w-3.5 h-3.5 text-rose-600" />
            Member Sentiment & Voice
          </div>
          <h1 className="text-3xl font-serif text-stone-900">
            Customer Feedback & CSAT
          </h1>
          <p className="text-xs text-stone-500 font-light mt-1">
            Ratings, reviews, post-class feedback, café dish taste scores, and studio management resolution notes.
          </p>
        </div>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-sm text-xs space-y-1">
            <span className="text-[10px] text-stone-400 uppercase font-mono block">Average Rating</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-serif font-medium text-stone-900">
                {metrics.average_rating}
              </span>
              <div className="flex text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < Math.round(metrics.average_rating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-stone-300"
                    }`}
                  />
                ))}
              </div>
            </div>
            <span className="text-[10px] text-stone-400">Out of 5.0 scale</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-sm text-xs space-y-1">
            <span className="text-[10px] text-stone-400 uppercase font-mono block">CSAT Satisfaction</span>
            <div className="text-2xl font-serif font-medium text-emerald-700">
              {metrics.csat_score_pct}%
            </div>
            <span className="text-[10px] text-emerald-800">4 & 5-star positive ratings</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-sm text-xs space-y-1">
            <span className="text-[10px] text-stone-400 uppercase font-mono block">Total Responses</span>
            <div className="text-2xl font-serif font-medium text-stone-900">
              {metrics.total_feedback_count}
            </div>
            <span className="text-[10px] text-stone-400">App, Web & Dining QR</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-sm text-xs space-y-1">
            <span className="text-[10px] text-stone-400 uppercase font-mono block">Pending Action</span>
            <div className={`text-2xl font-serif font-medium ${metrics.pending_review_count > 0 ? "text-amber-700" : "text-emerald-700"}`}>
              {metrics.pending_review_count}
            </div>
            <span className="text-[10px] text-stone-400">Requiring staff review</span>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search comments, member, or tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {[
            { id: "all", label: "All Feedback" },
            { id: "class_session", label: "Classes" },
            { id: "trainer", label: "Teachers" },
            { id: "cafe_dish", label: "Nourish Café" },
            { id: "studio_ambiance", label: "Shala Environment" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTargetFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                targetFilter === tab.id
                  ? "bg-stone-900 text-stone-100"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback Feed / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredFeedback.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-2xl bg-white border border-stone-200/80 shadow-sm space-y-3.5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-stone-900 text-sm">
                      {item.user_name}
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">
                      via {item.source.replace("_", " ")}
                    </span>
                  </div>
                  <div className="text-xs text-stone-500 font-medium mt-0.5">
                    {item.target_title}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="flex text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < item.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-stone-200"
                        }`}
                      />
                    ))}
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide border ${
                      item.sentiment === "positive"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : item.sentiment === "negative"
                        ? "bg-rose-50 text-rose-800 border-rose-200"
                        : "bg-stone-100 text-stone-600 border-stone-200"
                    }`}
                  >
                    {item.sentiment}
                  </span>
                </div>
              </div>

              {/* Comments */}
              <p className="text-xs text-stone-700 leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-100">
                "{item.comments}"
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 pt-2">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 text-[10px] font-medium border border-stone-200"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Resolution Section */}
            <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
              <div>
                {item.status === "resolved" ? (
                  <div className="space-y-0.5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Resolved
                    </span>
                    {item.resolution_notes && (
                      <div className="text-[10px] text-stone-500 italic max-w-xs truncate">
                        "{item.resolution_notes}"
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700">
                    <Clock className="w-3.5 h-3.5" /> Awaiting Resolution
                  </span>
                )}
              </div>

              {item.status !== "resolved" && (
                <button
                  onClick={() => setSelectedFeedback(item)}
                  className="px-3 py-1.5 rounded-lg bg-stone-900 text-stone-50 text-[11px] font-medium hover:bg-stone-800 transition-colors shadow-sm"
                >
                  Resolve Note
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* RESOLUTION MODAL */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between pb-3 border-b border-stone-200">
              <div>
                <h3 className="text-lg font-serif font-medium text-stone-900">
                  Resolve Customer Feedback
                </h3>
                <p className="text-xs text-stone-500">Record corrective operational actions or member outreach</p>
              </div>
              <button
                onClick={() => setSelectedFeedback(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                ✕
              </button>
            </div>

            {resolveSuccessMsg ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{resolveSuccessMsg}</span>
              </div>
            ) : (
              <form onSubmit={handleResolve} className="space-y-4 text-xs">
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-100 space-y-1">
                  <div className="font-medium text-stone-900">{selectedFeedback.user_name}</div>
                  <div className="text-stone-500">{selectedFeedback.target_title}</div>
                  <p className="text-stone-700 italic pt-1">"{selectedFeedback.comments}"</p>
                </div>

                <div>
                  <label className="block text-stone-600 mb-1 font-medium">
                    Internal Resolution & Corrective Action Notes
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="e.g. Cleaned air filters, adjusted HVAC schedule, phoned member to provide complimentary pass..."
                    value={resolutionText}
                    onChange={(e) => setResolutionText(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-stone-200">
                  <button
                    type="button"
                    onClick={() => setSelectedFeedback(null)}
                    className="px-4 py-2 rounded-xl text-xs text-stone-600 hover:bg-stone-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-medium hover:bg-emerald-800 transition-colors shadow-sm"
                  >
                    Mark as Resolved
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
