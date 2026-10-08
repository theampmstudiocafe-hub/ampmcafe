"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Sparkles,
  ArrowRight,
  Clock,
  User,
  Coffee,
  CheckCircle2,
  Play,
  Heart,
  MapPin,
  ShieldCheck,
  ChevronRight,
  Layers,
} from "lucide-react";

export default function HomePage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeMediaTab, setActiveMediaTab] = useState<"photos" | "video">("photos");

  useEffect(() => {
    async function loadSessions() {
      try {
        const res = await fetch("/api/booking/sessions");
        const data = await res.json();
        if (data.sessions) {
          setSessions(data.sessions.slice(0, 4));
        }
      } catch (err) {
        console.error("Failed to load sessions preview", err);
      }
    }
    loadSessions();
  }, []);

  const galleryPhotos = [
    {
      title: "Main Bamboo Shala",
      subtitle: "Natural cross-breeze & sunlit cedarwood",
      category: "Yoga Studio",
      img: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?q=80&w=1000&auto=format&fit=crop",
    },
    {
      title: "Morning Vinyasa Flow",
      subtitle: "Intimate 15-student practice sessions",
      category: "Asana Practice",
      img: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1000&auto=format&fit=crop",
    },
    {
      title: "Garden Courtyard Café",
      subtitle: "Plant-forward nourishment under the rain tree",
      category: "Nourish Café",
      img: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1000&auto=format&fit=crop",
    },
    {
      title: "Ceremonial Matcha & Tartines",
      subtitle: "Cold-pressed elixirs & fermented sourdough",
      category: "Clean Nutrition",
      img: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?q=80&w=1000&auto=format&fit=crop",
    },
    {
      title: "Tibetan Sound Bath",
      subtitle: "Quartz bowls, gongs & restorative stillness",
      category: "Sound Healing",
      img: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1000&auto=format&fit=crop",
    },
    {
      title: "Pune Community Gathering",
      subtitle: "Connecting after morning practice in Lane 6",
      category: "Satsang",
      img: "https://images.unsplash.com/photo-1524863479829-916d8e77f114?q=80&w=1000&auto=format&fit=crop",
    },
  ];

  return (
    <div className="bg-[#F9F6F0] flex flex-col selection:bg-[#C86D51] selection:text-white">
      <div className="flex-1">
        {/* ========================================================================= */}
        {/* 1. HERO SECTION: "BOOK NOW" IS THE FIRST AND MOST PROMINENT ELEMENT */}
        {/* ========================================================================= */}
        <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-32 border-b border-[#EAE3D6]">
          {/* Subtle natural backdrop gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#FAF7F2] via-[#F9F6F0] to-[#F4EFE6] -z-10" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Column: Headlines & High-Contrast CTAs */}
              <div className="lg:col-span-7 space-y-6 text-left">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EFF4F0] border border-[#657E6B]/30 text-[#657E6B] text-xs font-semibold tracking-wide">
                  <MapPin className="w-3.5 h-3.5 text-[#C86D51]" />
                  <span>Koregaon Park, Pune • Lane 6 Sanctuary</span>
                </div>

                <h1 className="text-4xl sm:text-6xl font-serif font-bold text-[#1E2421] tracking-tight leading-[1.15]">
                  Morning Flow. Evening Stillness. Welcome to THE AM:PM STUDIO.
                </h1>

                <p className="text-base sm:text-lg text-stone-600 font-normal leading-relaxed max-w-xl">
                  Pune's sanctuary for sunrise flow, sunset sound baths, and conscious all-day dining. Ground your body in the morning, unwind your mind in the evening.
                </p>

                {/* PROMINENT "BOOK NOW" CTA BAR */}
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <Link
                    href="/book"
                    className="px-8 py-4 bg-[#C86D51] hover:bg-[#B65A3E] text-white text-sm sm:text-base font-bold uppercase tracking-wider rounded-2xl shadow-lg hover:shadow-xl flex items-center justify-center gap-3 transform hover:-translate-y-0.5 active:translate-y-0 transition"
                  >
                    <Calendar className="w-5 h-5" />
                    <span>Book Now • Reserve Mat</span>
                    <ArrowRight className="w-5 h-5" />
                  </Link>

                  <Link
                    href="/signup"
                    className="px-6 py-4 bg-white hover:bg-stone-50 border border-[#EAE3D6] text-stone-800 text-sm font-semibold rounded-2xl shadow-sm hover:border-[#C86D51] flex items-center justify-center gap-2 transition"
                  >
                    <Sparkles className="w-4 h-4 text-[#C86D51]" />
                    <span>Claim Free Trial (₹0)</span>
                  </Link>
                </div>

                {/* Trust Badges */}
                <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-stone-500">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#657E6B]" />
                    <span>1 Free Class For New Members</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#657E6B]" />
                    <span>12h Cancellation Credit Refund</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Coffee className="w-4 h-4 text-[#C86D51]" />
                    <span>Organic Courtyard Café</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Hero Visual Card */}
              <div className="lg:col-span-5 relative">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white aspect-[4/5]">
                  <img
                    src="https://images.unsplash.com/photo-1545205597-3d9d02c29597?q=80&w=1200&auto=format&fit=crop"
                    alt="THE AM:PM STUDIO Pune Shala"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* Overlaid Floating Card */}
                  <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-white/50 text-left">
                    <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                      <span className="font-semibold text-[#657E6B] uppercase tracking-wider">
                        Next Available Class
                      </span>
                      <span className="bg-[#EFF4F0] text-[#657E6B] px-2 py-0.5 rounded-full font-bold">
                        Spots Open
                      </span>
                    </div>
                    <div className="text-base font-bold text-[#1E2421]">
                      Vinyasa Flow & Alignment
                    </div>
                    <div className="text-xs text-stone-600 mt-0.5">
                      Teacher: Ananya Kulkarni • 60 Mins • Main Shala
                    </div>
                    <Link
                      href="/book"
                      className="mt-3 block text-center py-2 bg-[#C86D51] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#B65A3E] transition"
                    >
                      Reserve Spot
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. VIDEO & LIVE PHOTO SHOWCASE SECTION */}
        {/* ========================================================================= */}
        <section className="py-20 lg:py-28 bg-[#FAF7F2] border-b border-[#EAE3D6]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
              <div>
                <span className="text-xs uppercase tracking-widest font-semibold text-[#657E6B] bg-[#EFF4F0] px-3 py-1 rounded-full">
                  Immersive Media
                </span>
                <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#1E2421] mt-3">
                  Life at THE AM:PM STUDIO
                </h2>
                <p className="text-sm text-stone-600 mt-1 max-w-xl">
                  Step inside our Koregaon Park sanctuary. Pure natural bamboo light, grounding sound baths, and clean culinary creation in action.
                </p>
              </div>

              {/* Media Toggle Switch */}
              <div className="flex items-center bg-white p-1 rounded-xl border border-[#EAE3D6] shadow-sm self-start">
                <button
                  onClick={() => setActiveMediaTab("photos")}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                    activeMediaTab === "photos"
                      ? "bg-[#C86D51] text-white shadow-sm"
                      : "text-stone-600 hover:text-black"
                  }`}
                >
                  Live Photos
                </button>
                <button
                  onClick={() => setActiveMediaTab("video")}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition ${
                    activeMediaTab === "video"
                      ? "bg-[#C86D51] text-white shadow-sm"
                      : "text-stone-600 hover:text-black"
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Video Tour</span>
                </button>
              </div>
            </div>

            {/* TAB CONTENT: LIVE PHOTOS MOSAIC */}
            {activeMediaTab === "photos" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
                {galleryPhotos.map((item, index) => (
                  <div
                    key={index}
                    className="group relative rounded-2xl overflow-hidden aspect-[4/3] bg-stone-200 shadow-sm border border-stone-200/80 cursor-pointer"
                  >
                    <img
                      src={item.img}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-95 transition" />

                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4A373] bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm">
                        {item.category}
                      </span>
                      <h4 className="text-base font-serif font-bold mt-1.5">{item.title}</h4>
                      <p className="text-xs text-stone-300 mt-0.5 line-clamp-1">{item.subtitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB CONTENT: VIDEO SHOWCASE */}
            {activeMediaTab === "video" && (
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white aspect-video max-w-4xl mx-auto bg-stone-900 animate-in fade-in duration-200">
                <img
                  src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1400&auto=format&fit=crop"
                  alt="Video Showcase Preview"
                  className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white">
                  <div className="w-20 h-20 rounded-full bg-[#C86D51] hover:bg-[#B65A3E] text-white flex items-center justify-center shadow-xl cursor-pointer transform hover:scale-110 transition mb-4">
                    <Play className="w-8 h-8 fill-white ml-1" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-serif font-bold">
                    A Day at THE AM:PM STUDIO
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-200 mt-2 max-w-md">
                    Experience morning sunlight, quartz singing bowls, and post-practice courtyard conversations in Koregaon Park.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. TODAY'S CLASS SCHEDULE PREVIEW */}
        {/* ========================================================================= */}
        <section className="py-20 lg:py-24 bg-[#F9F6F0] border-b border-[#EAE3D6]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
              <div>
                <span className="text-xs uppercase tracking-widest font-semibold text-[#657E6B] bg-[#EFF4F0] px-3 py-1 rounded-full">
                  Today's Classes
                </span>
                <h2 className="text-3xl font-serif font-bold text-[#1E2421] mt-2">
                  Reserve Your Spot Today
                </h2>
              </div>
              <Link
                href="/book"
                className="text-xs font-bold text-[#C86D51] hover:underline flex items-center gap-1 self-start"
              >
                <span>View Full 7-Day Calendar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {sessions.length > 0 ? (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    className="bg-white rounded-2xl border border-[#EAE3D6] p-5 shadow-sm hover:border-[#C86D51] transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-3">
                        <span className="font-semibold text-stone-500">
                          {new Date(session.start_time).toLocaleTimeString("en-IN", {
                            timeZone: "Asia/Kolkata",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span className="text-[10px] font-bold bg-[#EFF4F0] text-[#657E6B] px-2 py-0.5 rounded-full">
                          {session.spotsRemaining} spots left
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-[#1E2421] mb-1">
                        {session.class_types.name}
                      </h3>
                      <p className="text-xs text-stone-500 mb-4 line-clamp-2">
                        {session.class_types.description}
                      </p>
                      <div className="text-xs text-stone-600 mb-5 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#657E6B]" />
                        <span>Teacher: <strong>{session.trainers.name}</strong></span>
                      </div>
                    </div>

                    <Link
                      href="/book"
                      className="w-full py-2 bg-[#C86D51] hover:bg-[#B65A3E] text-white text-xs font-semibold rounded-xl text-center shadow-sm transition block"
                    >
                      Book Spot
                    </Link>
                  </div>
                ))
              ) : (
                <div className="lg:col-span-4 bg-white rounded-2xl border border-[#EAE3D6] p-10 text-center text-stone-500">
                  <p className="text-sm">Explore all upcoming classes on our interactive calendar.</p>
                  <Link
                    href="/book"
                    className="mt-3 inline-block px-5 py-2.5 bg-[#C86D51] text-white text-xs font-semibold rounded-xl shadow-sm"
                  >
                    Open Booking Calendar
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. THE EXPERIENCE: YOGA STUDIO CUM CAFÉ SYNERGY */}
        {/* ========================================================================= */}
        <section className="py-20 lg:py-28 bg-white border-b border-[#EAE3D6]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="text-xs uppercase tracking-widest font-semibold text-[#657E6B] bg-[#EFF4F0] px-3 py-1 rounded-full">
                  Holistic Well-being
                </span>
                <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#1E2421] mt-3 mb-6">
                  Practice Intentionally. Nourish Unconditionally.
                </h2>
                <div className="space-y-4 text-sm text-stone-600 leading-relaxed">
                  <p>
                    Most studios end the moment you roll up your mat. At THE AM:PM STUDIO, your morning practice flows organically into our courtyard café, and your evening restorative session winds down with calming adaptogenic elixirs.
                  </p>
                  <p>
                    Our kitchen crafts clean nourishment with zero refined sugar, organic stoneground flours, and adaptogens that replenish glycogen, calm cortisol, and support muscle recovery.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-6">
                  <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#EAE3D6]">
                    <div className="text-lg font-bold text-[#C86D51]">AM Energy</div>
                    <p className="text-xs text-stone-500 mt-1">
                      Sunrise Vinyasa, Mysore Ashtanga & ceremonial matcha for conscious morning vitality.
                    </p>
                  </div>
                  <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#EAE3D6]">
                    <div className="text-lg font-bold text-[#657E6B]">PM Stillness</div>
                    <p className="text-xs text-stone-500 mt-1">
                      Sunset Yin Yoga, Quartz Sound Baths & soothing herbal elixirs to unwind your nervous system.
                    </p>
                  </div>
                </div>

                <div className="pt-8">
                  <Link
                    href="/menu"
                    className="inline-flex items-center gap-2 text-xs font-bold text-[#C86D51] hover:underline uppercase tracking-wider"
                  >
                    <span>Explore Courtyard Menu</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <img
                  src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop"
                  alt="Nourish Bowl"
                  className="rounded-2xl shadow-md w-full aspect-square object-cover"
                />
                <img
                  src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=800&auto=format&fit=crop"
                  alt="Yoga Posture"
                  className="rounded-2xl shadow-md w-full aspect-square object-cover mt-8"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. CALL TO ACTION BAR */}
        {/* ========================================================================= */}
        <section className="py-16 bg-[#C86D51] text-white text-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold">
              Step Onto The Mat in Pune
            </h2>
            <p className="text-sm sm:text-base text-white/90 max-w-xl mx-auto">
              Your first class is completely complimentary. Experience our instructors and peaceful Koregaon Park space with zero obligation.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/book"
                className="w-full sm:w-auto px-8 py-3.5 bg-white text-[#C86D51] font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg hover:bg-stone-100 transition"
              >
                Book Now • View Calendar
              </Link>
              <Link
                href="/packs"
                className="w-full sm:w-auto px-8 py-3.5 bg-black/20 hover:bg-black/30 text-white font-semibold text-xs uppercase tracking-wider rounded-xl border border-white/30 transition"
              >
                View Class Packs
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
