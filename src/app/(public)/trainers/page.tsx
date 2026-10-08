"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Instagram,
  Calendar,
  CheckCircle2,
  Heart,
  Award,
  BookOpen,
} from "lucide-react";

interface Trainer {
  id: string;
  name: string;
  slug: string;
  bio: string;
  story: string;
  specialties: string[];
  instagram_handle: string;
  media_urls: string[];
}

export default function TrainersPage() {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrainers() {
      try {
        const res = await fetch("/api/content/trainers");
        const json = await res.json();
        if (json.trainers) {
          setTrainers(json.trainers);
        }
      } catch (err) {
        console.error("Failed to load trainers", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTrainers();
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
                "url('https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=2000&auto=format&fit=crop')",
            }}
          />
        </div>
        <div className="relative max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold uppercase tracking-widest border border-amber-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            Our Shala Instructors
          </div>
          <h1 className="text-4xl md:text-6xl font-light tracking-tight font-serif text-white">
            Guides Dedicated to Your <br className="hidden sm:inline" />
            <span className="italic font-normal text-amber-200">Inner Evolution</span>
          </h1>
          <p className="max-w-2xl mx-auto text-stone-300 text-base md:text-lg leading-relaxed font-light">
            Our teachers hold deep reverence for traditional lineages while embracing
            functional biomechanics, somatic breathwork, and mindful presence.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-6 text-xs uppercase tracking-wider text-stone-400">
            <span className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" /> 500+ Hour Certified
            </span>
            <span className="text-stone-700">•</span>
            <span className="flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-rose-400" /> Trauma-Informed
            </span>
            <span className="text-stone-700">•</span>
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-emerald-400" /> Mysore & Rishikesh Lineage
            </span>
          </div>
        </div>
      </section>

      {/* Trainers Directory Grid */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900" />
            <p className="mt-3 text-sm text-stone-500 font-light">Loading teachers...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {trainers.map((trainer) => (
              <div
                key={trainer.id}
                className="group bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Portrait photo */}
                  <div className="relative h-80 w-full overflow-hidden bg-stone-100">
                    <img
                      src={
                        trainer.media_urls?.[0] ||
                        "https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=800&auto=format&fit=crop"
                      }
                      alt={trainer.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                      <span className="text-white text-xs font-light tracking-wide flex items-center gap-2">
                        View Teacher Profile <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-serif text-stone-900 group-hover:text-amber-800 transition-colors">
                        {trainer.name}
                      </h3>
                      {trainer.instagram_handle && (
                        <a
                          href={`https://instagram.com/${trainer.instagram_handle.replace("@", "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-stone-400 hover:text-rose-600 transition"
                          title="Instagram"
                        >
                          <Instagram className="w-4 h-4" />
                        </a>
                      )}
                    </div>

                    {/* Specialties Badges */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {trainer.specialties?.map((spec) => (
                        <span
                          key={spec}
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-medium tracking-wide uppercase bg-amber-50 text-amber-900 border border-amber-200"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>

                    <p className="text-xs text-stone-600 font-light leading-relaxed line-clamp-3">
                      {trainer.bio}
                    </p>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-6 pt-0 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={`/trainers/${trainer.slug}`}
                      className="px-4 py-2.5 border border-stone-200 hover:border-stone-900 rounded-xl text-xs font-medium text-stone-700 hover:text-stone-900 text-center transition"
                    >
                      Read Story
                    </Link>
                    <Link
                      href={`/book?trainer=${trainer.slug}`}
                      className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-medium text-center transition flex items-center justify-center gap-1.5"
                    >
                      <Calendar className="w-3.5 h-3.5" /> Book Class
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Teaching Standard Section */}
      <section className="bg-stone-100 border-t border-stone-200 py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-700">
              The Shala Standard
            </span>
            <h2 className="text-3xl font-serif text-stone-900 mt-2">
              Commitment to Authentic Teaching
            </h2>
            <p className="text-sm text-stone-600 font-light mt-3">
              We vet every instructor not just for asana capability, but for their
              somatic sensitivity, communication ethics, and dedication to personal sadhana.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-stone-200">
              <h4 className="font-serif text-stone-900 text-lg mb-2">
                1. Individualized Adjustments
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed font-light">
                Every body possesses unique skeletal architecture. Our teachers guide
                you with consent-based modifications, ensuring safe and sustainable
                growth.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-stone-200">
              <h4 className="font-serif text-stone-900 text-lg mb-2">
                2. Somatic & Nervous System Tone
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed font-light">
                Beyond physical flexibility, our focus is the down-regulation of the
                sympathetic nervous system, restoring natural parasympathetic calm.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-stone-200">
              <h4 className="font-serif text-stone-900 text-lg mb-2">
                3. Continuous Lineage Study
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed font-light">
                Our team regularly retreats to traditional shalas in Mysore,
                Rishikesh, and Pune's renowned Iyengar institutes to refine their teaching craft.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <div className="bg-stone-900 text-white rounded-3xl p-8 md:p-14 text-center space-y-6">
          <span className="text-xs font-semibold uppercase tracking-widest text-amber-400">
            Complimentary First Class
          </span>
          <h2 className="text-3xl md:text-5xl font-serif text-stone-100">
            Meet Your Guide on the Mat
          </h2>
          <p className="max-w-xl mx-auto text-sm text-stone-300 font-light leading-relaxed">
            Experience the difference of conscious instruction in our serene Koregaon
            Park shala. Claim your free trial class today.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/book"
              className="px-8 py-3.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-medium rounded-full text-xs uppercase tracking-widest transition-all shadow-lg hover:shadow-xl inline-flex items-center justify-center gap-2"
            >
              Book Complimentary Class <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/packs"
              className="px-6 py-3.5 border border-stone-700 hover:border-stone-500 text-stone-200 font-medium rounded-full text-xs uppercase tracking-widest transition-all hover:bg-stone-800"
            >
              Explore Class Packs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
