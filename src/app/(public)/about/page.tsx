"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Leaf,
  ShieldCheck,
  Heart,
  ChevronDown,
  Building,
  CheckCircle2,
  TreePine,
  Sun,
  Flame,
} from "lucide-react";

export default function AboutPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "I have never practiced yoga before. Can I attend?",
      a: "Absolutely. Over 40% of our members began their journey here. Our teachers offer continuous anatomical modifications and beginner variations in every class. We also recommend starting with Yin Yoga or Vinyasa Foundations.",
    },
    {
      q: "What should I bring to my first class?",
      a: "Wear comfortable, breathable clothing that allows full range of motion. We provide high-density non-slip eco mats, cork blocks, bolsters, and organic cotton straps free of charge. Water bottles can be refilled at our filtered alkaline station.",
    },
    {
      q: "How does the complimentary Free Trial work?",
      a: "Every verified new member is entitled to one free class session. Simply create your account, navigate to the class schedule, toggle 'Use Free Trial', and select your preferred slot. No payment details required.",
    },
    {
      q: "Is Nourish Café open to visitors who aren't taking a yoga class?",
      a: "Yes! The café and garden veranda are open to the general public from 7:30 AM to 10:00 PM daily. Many Pune remote workers and wellness enthusiasts drop by for matcha, artisanal sourdough, and conscious meals.",
    },
    {
      q: "What is your cancellation policy for yoga classes?",
      a: "You can cancel any booking up to 12 hours before the class start time to receive a full automatic credit refund back into your pack ledger. Cancellations within the 12-hour window forfeit the class credit.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900">
      {/* Hero Header */}
      <section className="relative pt-32 pb-24 px-6 bg-stone-900 text-stone-100 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div
            className="w-full h-full bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1545205597-3d9d02c29597?q=80&w=2000&auto=format&fit=crop')",
            }}
          />
        </div>
        <div className="relative max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold uppercase tracking-widest border border-amber-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            Our Sanctuary & Philosophy
          </div>
          <h1 className="text-4xl md:text-6xl font-light tracking-tight font-serif text-white">
            Where Stillness Meets <br className="hidden sm:inline" />
            <span className="italic font-normal text-amber-200">Wholesome Nourishment</span>
          </h1>
          <p className="max-w-2xl mx-auto text-stone-300 text-base md:text-lg leading-relaxed font-light">
            Founded under the lush frangipani and banyan canopies of Koregaon Park,
            THE AM:PM STUDIO is a sacred convergence of morning vitality, evening stillness,
            and restorative plant cuisine.
          </p>
        </div>
      </section>

      {/* Origin Story */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-700">
              The Genesis
            </span>
            <h2 className="text-3xl md:text-4xl font-serif text-stone-900 leading-snug">
              AM Movement. PM Stillness.
            </h2>
            <div className="text-stone-600 text-sm font-light leading-relaxed space-y-4">
              <p>
                In 2021, we noticed how divided wellness culture had become. People would
                rush through high-intensity workouts in cold fitness studios, only to grab
                ultra-processed smoothies loaded with artificial syrups on the street.
              </p>
              <p>
                We dreamed of something rooted, unhurried, and unified: <strong>THE AM:PM STUDIO</strong>.
                AM for solar energy, breath of vitality, dynamic vinyasa, and ceremonial matcha.
                PM for lunar stillness, restorative yin, quartz sound baths, and soothing adaptogenic tonics.
              </p>
              <p>
                Koregaon Park, with its leafy lanes and serene creative spirit, was the
                natural home for this sanctuary.
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-3xl overflow-hidden shadow-2xl border border-stone-200 aspect-[4/3]">
              <img
                src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1000&auto=format&fit=crop"
                alt="Shala studio interior"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-stone-900 text-white p-6 rounded-2xl shadow-xl max-w-xs hidden sm:block border border-stone-800">
              <p className="text-xs font-serif italic text-amber-200">
                "We do not practice yoga to get good at yoga. We practice yoga to get
                good at living."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Spatial Architecture */}
      <section className="bg-stone-100 border-y border-stone-200 py-20 px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-700">
              Spatial Design
            </span>
            <h2 className="text-3xl font-serif text-stone-900 mt-2">
              Spaces Designed for Nervous System Calm
            </h2>
            <p className="text-sm text-stone-600 font-light mt-3">
              Every detail—from the acoustically tuned plaster walls to the reclaimed
              hardwood—was selected to naturally ground cortisol levels.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center">
                <TreePine className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-serif text-stone-900">Reclaimed Teak Shala</h3>
              <p className="text-xs text-stone-600 leading-relaxed font-light">
                Our main movement floor is engineered with multi-layer sprung subflooring
                and vintage Nagpur teak, delivering optimum impact absorption for spinal
                and joint longevity.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
                <Sun className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-serif text-stone-900">Garden Veranda & Courtyard</h3>
              <p className="text-xs text-stone-600 leading-relaxed font-light">
                An open-air shaded haven shaded by 40-year-old foliage. Members gather
                post-class to sip cold-pressed elixirs, work on laptops, or engage in
                communal conversations.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-800 flex items-center justify-center">
                <Flame className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-serif text-stone-900">Zen Sound Room</h3>
              <p className="text-xs text-stone-600 leading-relaxed font-light">
                Dedicated sound acoustic chamber equipped with 432Hz frosted quartz singing
                bowls, symphonic German gongs, and ambient warm lighting for deep
                pranayama retreats.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sustainable Values */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-semibold uppercase tracking-widest text-amber-700">
            Our Commitments
          </span>
          <h2 className="text-3xl font-serif text-stone-900 mt-2">
            Conscious Stewardship in Pune
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl border border-stone-200 bg-white space-y-2">
            <span className="text-2xl">🌱</span>
            <h4 className="font-serif text-stone-900 text-base">Zero Single-Use Plastic</h4>
            <p className="text-[11px] text-stone-500 font-light leading-relaxed">
              Glass, terracotta, and compostable areca palm serveware throughout the studio and café.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-stone-200 bg-white space-y-2">
            <span className="text-2xl">🌾</span>
            <h4 className="font-serif text-stone-900 text-base">Sahyadri Farm Direct</h4>
            <p className="text-[11px] text-stone-500 font-light leading-relaxed">
              We partner directly with small regenerative farms in Mulshi, eliminating middlemen.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-stone-200 bg-white space-y-2">
            <span className="text-2xl">🧘</span>
            <h4 className="font-serif text-stone-900 text-base">Organic Mat Care</h4>
            <p className="text-[11px] text-stone-500 font-light leading-relaxed">
              All shala equipment is sanitized with organic tea tree and lavender hydrosols.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-stone-200 bg-white space-y-2">
            <span className="text-2xl">♻️</span>
            <h4 className="font-serif text-stone-900 text-base">Wet Waste Composting</h4>
            <p className="text-[11px] text-stone-500 font-light leading-relaxed">
              100% of café kitchen organic scraps are composted and returned to local soil.
            </p>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="bg-stone-100 border-t border-stone-200 py-20 px-6">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-700">
              Got Questions?
            </span>
            <h2 className="text-3xl font-serif text-stone-900 mt-2">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm transition"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-serif text-stone-900 text-sm md:text-base font-normal hover:text-amber-800 transition"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-stone-400 transition-transform duration-200 flex-shrink-0 ${
                      openFaq === idx ? "rotate-180 text-amber-700" : ""
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 text-xs text-stone-600 font-light leading-relaxed border-t border-stone-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <div className="bg-stone-900 text-white rounded-3xl p-8 md:p-14 text-center space-y-6">
          <span className="text-xs font-semibold uppercase tracking-widest text-amber-400">
            Begin Your Sadhana
          </span>
          <h2 className="text-3xl md:text-5xl font-serif text-stone-100">
            Step Inside the Shala
          </h2>
          <p className="max-w-xl mx-auto text-sm text-stone-300 font-light leading-relaxed">
            Take your complimentary trial class, taste our ceremonial matcha, and discover
            your new daily sanctuary in Koregaon Park.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/book"
              className="px-8 py-3.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-medium rounded-full text-xs uppercase tracking-widest transition-all shadow-lg hover:shadow-xl inline-flex items-center justify-center gap-2"
            >
              Book Complimentary Class <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/menu"
              className="px-6 py-3.5 border border-stone-700 hover:border-stone-500 text-stone-200 font-medium rounded-full text-xs uppercase tracking-widest transition-all hover:bg-stone-800"
            >
              Explore Café Menu
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
