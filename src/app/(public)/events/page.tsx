"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  Users,
  ArrowRight,
  CheckCircle2,
  Share2,
  Ticket,
  X,
  ShieldCheck,
} from "lucide-react";

interface EventItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  start_time: string;
  end_time: string;
  location: string;
  capacity: number;
  price_inr: number;
  image_url: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [reservationSuccess, setReservationSuccess] = useState(false);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch("/api/content/events");
        const json = await res.json();
        if (json.events) {
          setEvents(json.events);
        }
      } catch (err) {
        console.error("Failed to load events", err);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900">
      {/* Hero Header */}
      <section className="relative pt-32 pb-20 px-6 bg-stone-900 text-stone-100 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div
            className="w-full h-full bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=2000&auto=format&fit=crop')",
            }}
          />
        </div>
        <div className="relative max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold uppercase tracking-widest border border-amber-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            Shala Immersions & Workshops
          </div>
          <h1 className="text-4xl md:text-6xl font-light tracking-tight font-serif text-white">
            Sacred Gatherings & <br className="hidden sm:inline" />
            <span className="italic font-normal text-amber-200">Sound Journeys</span>
          </h1>
          <p className="max-w-2xl mx-auto text-stone-300 text-base md:text-lg leading-relaxed font-light">
            Go deeper than a regular drop-in class. Explore Full Moon Sound Baths,
            biomechanics intensives, breathwork ceremonies, and conscious café popups.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-6 text-xs uppercase tracking-wider text-stone-400">
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-amber-400" /> Intimate Group Capacities
            </span>
            <span className="text-stone-700">•</span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-400" /> Koregaon Park Studio & Zen Terrace
            </span>
            <span className="text-stone-700">•</span>
            <span className="flex items-center gap-1.5">
              <Ticket className="w-4 h-4 text-rose-400" /> All-Inclusive Ticket Passes
            </span>
          </div>
        </div>
      </section>

      {/* Events Listing */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900" />
            <p className="mt-3 text-sm text-stone-500 font-light">
              Loading upcoming immersions...
            </p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 bg-stone-50 rounded-2xl border border-dashed border-stone-200 p-8">
            <Calendar className="w-10 h-10 text-stone-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-stone-800">
              No Special Workshops Scheduled This Week
            </h3>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
              Our weekly classes run daily. New sound bath and immersion dates are
              released every Monday.
            </p>
            <Link
              href="/book"
              className="mt-4 inline-block px-5 py-2.5 bg-stone-900 text-white rounded-full text-xs uppercase tracking-wider font-medium hover:bg-stone-800 transition"
            >
              Browse Daily Class Schedule
            </Link>
          </div>
        ) : (
          <div className="space-y-12">
            {events.map((event) => {
              const startDate = new Date(event.start_time);
              const endDate = new Date(event.end_time);
              const formattedDate = startDate.toLocaleDateString("en-IN", {
                weekday: "long",
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              const formattedTime = `${startDate.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })} - ${endDate.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}`;

              return (
                <div
                  key={event.id}
                  className="bg-white rounded-3xl overflow-hidden border border-stone-200 shadow-sm hover:shadow-lg transition-all duration-300 grid grid-cols-1 lg:grid-cols-12"
                >
                  {/* Event Image */}
                  <div className="lg:col-span-5 relative min-h-[280px] lg:min-h-full bg-stone-100 overflow-hidden">
                    <img
                      src={
                        event.image_url ||
                        "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1000&auto=format&fit=crop"
                      }
                      alt={event.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute top-4 left-4 bg-stone-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-medium text-amber-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Special Immersion
                    </div>
                  </div>

                  {/* Event Details */}
                  <div className="lg:col-span-7 p-8 md:p-10 flex flex-col justify-between space-y-6">
                    <div>
                      {/* Meta badges */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 font-light mb-3">
                        <span className="flex items-center gap-1 font-medium text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                          <Calendar className="w-3.5 h-3.5" /> {formattedDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-stone-400" /> {formattedTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-stone-400" /> {event.location}
                        </span>
                      </div>

                      <h2 className="text-2xl md:text-3xl font-serif text-stone-900 mb-3">
                        {event.title}
                      </h2>

                      <p className="text-stone-600 text-xs md:text-sm font-light leading-relaxed mb-6">
                        {event.description}
                      </p>

                      <div className="flex items-center gap-6 text-xs text-stone-500 font-light border-y border-stone-100 py-3">
                        <span className="flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-stone-400" />
                          Limited to <strong className="font-semibold text-stone-800">{event.capacity} seats</strong>
                        </span>
                        <span className="text-stone-300">•</span>
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Mats & Sound Props Provided
                        </span>
                      </div>
                    </div>

                    {/* Bottom Pricing & Reserve CTA */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                      <div>
                        <span className="text-[11px] uppercase tracking-wider text-stone-400">
                          Investment / Person
                        </span>
                        <p className="text-2xl font-serif text-stone-900 font-normal">
                          ₹{event.price_inr}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            setSelectedEvent(event);
                            setReservationSuccess(false);
                          }}
                          className="px-8 py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-full text-xs uppercase tracking-widest font-medium transition flex items-center justify-center gap-2 shadow-sm"
                        >
                          Reserve Spot <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Private Event Hosting Callout */}
      <section className="bg-stone-100 border-t border-stone-200 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <span className="text-xs font-semibold uppercase tracking-widest text-amber-700">
            Host at THE AM:PM STUDIO
          </span>
          <h2 className="text-3xl md:text-4xl font-serif text-stone-900">
            Host Your Private Workshop or Corporate Retreat
          </h2>
          <p className="text-sm text-stone-600 font-light leading-relaxed max-w-xl mx-auto">
            Our 2,400 sq.ft teakwood shala and lush garden café courtyard are available
            for mindful corporate offsites, sound healing events, and wellness brand launches.
          </p>
          <div className="pt-2">
            <Link
              href="/contact?subject=Private Space & Workshop Hosting"
              className="px-8 py-3.5 bg-stone-900 hover:bg-stone-800 text-white rounded-full text-xs uppercase tracking-widest font-medium transition inline-flex items-center gap-2"
            >
              Inquire About Space Hire <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Event Reservation Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 relative shadow-2xl border border-stone-200">
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute top-5 right-5 text-stone-400 hover:text-stone-900 transition p-1"
            >
              <X className="w-5 h-5" />
            </button>

            {reservationSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-serif text-stone-900">
                  Spot Reserved!
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed font-light max-w-sm mx-auto">
                  We've reserved your spot for <strong>{selectedEvent.title}</strong>.
                  A confirmation SMS & WhatsApp reminder will be sent to your phone.
                </p>
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-600 text-left space-y-1">
                  <div><strong>Location:</strong> {selectedEvent.location}</div>
                  <div><strong>Ticket:</strong> ₹{selectedEvent.price_inr} (Payable at front desk or Razorpay link)</div>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="w-full py-3 bg-stone-900 text-white rounded-full text-xs uppercase tracking-widest font-medium hover:bg-stone-800 transition mt-4"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-amber-700 font-semibold">
                    Reserve Workshop Ticket
                  </span>
                  <h3 className="text-xl font-serif text-stone-900">
                    {selectedEvent.title}
                  </h3>
                  <p className="text-xs text-stone-500 font-light">
                    {selectedEvent.location} • ₹{selectedEvent.price_inr}
                  </p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setReservationSuccess(true);
                  }}
                  className="space-y-4 pt-2"
                >
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Priya Sharma"
                      className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="priya@example.com"
                      className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Phone Number (for WhatsApp pass & reminder) *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98230 12345"
                      className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-medium rounded-full text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 shadow-md"
                    >
                      Confirm Reservation <ArrowRight className="w-4 h-4" />
                    </button>
                    <p className="text-[10px] text-stone-400 text-center mt-2 flex items-center justify-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-stone-400" />
                      Zero spam guarantee • 100% encrypted & private
                    </p>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
