"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Instagram,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Award,
  BookOpen,
  Heart,
  UserCheck,
} from "lucide-react";

interface UpcomingSession {
  id: string;
  room: string;
  start_time: string;
  end_time: string;
  capacity: number;
  class_types: {
    name: string;
    duration_minutes: number;
    color_hex: string;
  };
}

interface TrainerDetail {
  id: string;
  name: string;
  slug: string;
  bio: string;
  story: string;
  specialties: string[];
  instagram_handle: string;
  media_urls: string[];
  upcomingSessions: UpcomingSession[];
}

export default function TrainerDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [trainer, setTrainer] = useState<TrainerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    async function fetchTrainer() {
      try {
        const res = await fetch(`/api/content/trainers?slug=${slug}`);
        const json = await res.json();
        if (json.trainer) {
          setTrainer(json.trainer);
        } else {
          setError(json.error || "Teacher not found");
        }
      } catch (err) {
        setError("Failed to load teacher story");
      } finally {
        setLoading(false);
      }
    }

    fetchTrainer();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center pt-24">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900" />
          <p className="mt-3 text-sm text-stone-500 font-light">
            Connecting to teacher's story...
          </p>
        </div>
      </div>
    );
  }

  if (error || !trainer) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center pt-24 px-6">
        <div className="text-center max-w-md bg-white p-8 rounded-2xl border border-stone-200">
          <h2 className="text-xl font-serif text-stone-900 mb-2">Teacher Not Found</h2>
          <p className="text-xs text-stone-500 mb-6 font-light">
            We couldn't locate the teacher profile you're looking for.
          </p>
          <Link
            href="/trainers"
            className="px-5 py-2.5 bg-stone-900 text-white rounded-full text-xs uppercase tracking-wider font-medium hover:bg-stone-800 transition"
          >
            ← Back to Teachers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900">
      {/* Breadcrumb Header */}
      <section className="pt-28 pb-6 px-6 max-w-6xl mx-auto border-b border-stone-200">
        <div className="flex items-center gap-2 text-xs text-stone-500 font-light">
          <Link href="/" className="hover:text-stone-900 transition">
            Home
          </Link>
          <span>/</span>
          <Link href="/trainers" className="hover:text-stone-900 transition">
            Teachers
          </Link>
          <span>/</span>
          <span className="text-stone-900 font-medium">{trainer.name}</span>
        </div>
      </section>

      {/* Hero Overview */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Portrait Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="relative rounded-3xl overflow-hidden shadow-xl aspect-[3/4] bg-stone-200 border border-stone-300">
              <img
                src={
                  trainer.media_urls?.[0] ||
                  "https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=800&auto=format&fit=crop"
                }
                alt={trainer.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-transparent flex items-end p-8">
                <div>
                  <h1 className="text-3xl font-serif text-white">{trainer.name}</h1>
                  <p className="text-xs text-amber-300 font-light tracking-wide mt-1">
                    Resident Teacher • Koregaon Park Shala
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Profile Stats Box */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Specialties & Focus
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {trainer.specialties?.map((spec) => (
                  <span
                    key={spec}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200"
                  >
                    {spec}
                  </span>
                ))}
              </div>

              {trainer.instagram_handle && (
                <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                  <span className="text-stone-500">Connect on Social:</span>
                  <a
                    href={`https://instagram.com/${trainer.instagram_handle.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-stone-900 hover:text-rose-600 font-medium inline-flex items-center gap-1.5 transition"
                  >
                    <Instagram className="w-3.5 h-3.5 text-rose-500" />
                    {trainer.instagram_handle}
                  </a>
                </div>
              )}
            </div>

            {/* Private 1-on-1 Box */}
            <div className="bg-gradient-to-br from-stone-900 to-stone-800 text-stone-100 p-6 rounded-2xl shadow-md space-y-3">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-widest">
                <Sparkles className="w-4 h-4" /> Private 1-on-1 Instruction
              </div>
              <h4 className="text-lg font-serif text-white">
                Work Privately with {trainer.name.split(" ")[0]}
              </h4>
              <p className="text-xs text-stone-300 font-light leading-relaxed">
                Personalized biomechanical postural correction, dedicated breathwork,
                or trauma-informed restoration tailored to your body.
              </p>
              <div className="pt-2 flex items-center justify-between">
                <div>
                  <span className="text-xs text-stone-400">Starting at</span>
                  <p className="text-lg font-semibold text-white">₹2,500 / 60 min</p>
                </div>
                <Link
                  href={`/contact?subject=Private Session with ${encodeURIComponent(trainer.name)}`}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-medium rounded-full text-xs uppercase tracking-wider transition"
                >
                  Inquire
                </Link>
              </div>
            </div>
          </div>

          {/* Teacher Story & Class Schedule Column */}
          <div className="lg:col-span-7 space-y-10">
            {/* Story & Philosophy */}
            <div className="bg-white p-8 md:p-10 rounded-3xl border border-stone-200 shadow-sm space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 text-stone-700 text-xs font-semibold uppercase tracking-wider">
                <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                Lineage & Biography
              </div>
              <h2 className="text-2xl md:text-3xl font-serif text-stone-900 leading-snug">
                "Movement is the physical prayer; the breath is the silence."
              </h2>
              <div className="prose prose-stone text-sm text-stone-600 font-light leading-relaxed space-y-4">
                <p>{trainer.story}</p>
                <p>{trainer.bio}</p>
              </div>

              {/* Guiding Principles */}
              <div className="pt-6 border-t border-stone-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-100 space-y-1">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Anatomical Precision
                  </h4>
                  <p className="text-[11px] text-stone-500 font-light">
                    Grounding cues that prioritize joint longevity, kinetic stability,
                    and nervous system safety.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-stone-50 border border-stone-100 space-y-1">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Breath-Led Transitions
                  </h4>
                  <p className="text-[11px] text-stone-500 font-light">
                    Every movement synchronizes with pranayama, allowing the mind to
                    surrender into moving meditation.
                  </p>
                </div>
              </div>
            </div>

            {/* Upcoming Classes Taught by this Trainer */}
            <div className="bg-white p-8 md:p-10 rounded-3xl border border-stone-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-serif text-stone-900">
                    Upcoming Classes with {trainer.name.split(" ")[0]}
                  </h3>
                  <p className="text-xs text-stone-500 font-light mt-0.5">
                    Reserved spots in our Koregaon Park shala
                  </p>
                </div>
                <Link
                  href={`/book?trainer=${trainer.slug}`}
                  className="text-xs font-medium text-amber-700 hover:text-amber-800 flex items-center gap-1"
                >
                  View full schedule <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {trainer.upcomingSessions && trainer.upcomingSessions.length > 0 ? (
                <div className="space-y-3">
                  {trainer.upcomingSessions.map((session) => {
                    const startDate = new Date(session.start_time);
                    const formattedDate = startDate.toLocaleDateString("en-IN", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    });
                    const formattedTime = startDate.toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    });

                    return (
                      <div
                        key={session.id}
                        className="p-4 rounded-2xl border border-stone-100 hover:border-stone-300 bg-stone-50/50 hover:bg-stone-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-stone-900">
                              {session.class_types?.name}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-stone-200 text-stone-700 font-medium">
                              {session.class_types?.duration_minutes}m
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-stone-500 font-light">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-stone-400" />
                              {formattedDate}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-stone-400" />
                              {formattedTime}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-stone-400" />
                              {session.room}
                            </span>
                          </div>
                        </div>

                        <Link
                          href={`/book?session=${session.id}`}
                          className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-full text-xs font-medium uppercase tracking-wider text-center transition whitespace-nowrap"
                        >
                          Book Spot
                        </Link>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                  <p className="text-xs text-stone-500 font-light">
                    No open public sessions scheduled this week. Check the general calendar
                    or book a private 1-on-1 session.
                  </p>
                  <Link
                    href="/book"
                    className="mt-3 inline-block px-4 py-2 bg-stone-900 text-white rounded-full text-xs uppercase tracking-wider font-medium"
                  >
                    View All Studio Classes
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Back to all trainers footer link */}
      <section className="py-12 border-t border-stone-200 text-center">
        <Link
          href="/trainers"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-stone-600 hover:text-stone-950 font-medium transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to All Shala Teachers
        </Link>
      </section>
    </div>
  );
}
