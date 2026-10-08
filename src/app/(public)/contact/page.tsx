"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Clock,
  Phone,
  Mail,
  Instagram,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Compass,
} from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "General Studio Inquiry",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900">
      {/* Header Banner */}
      <section className="relative pt-32 pb-20 px-6 bg-stone-900 text-stone-100 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div
            className="w-full h-full bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=2000&auto=format&fit=crop')",
            }}
          />
        </div>
        <div className="relative max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold uppercase tracking-widest border border-amber-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            Connect With Us
          </div>
          <h1 className="text-4xl md:text-6xl font-light tracking-tight font-serif text-white">
            Visit THE AM:PM STUDIO in <br className="hidden sm:inline" />
            <span className="italic font-normal text-amber-200">Koregaon Park</span>
          </h1>
          <p className="max-w-2xl mx-auto text-stone-300 text-base md:text-lg leading-relaxed font-light">
            We welcome you to drop into our tranquil space in Pune. Speak to our front desk,
            inquire about private retreats, or chat directly via WhatsApp.
          </p>
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Contact Details & Location Column */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-white rounded-3xl p-8 border border-stone-200 shadow-sm space-y-6">
              <h2 className="text-2xl font-serif text-stone-900">
                Studio & Café Location
              </h2>

              <div className="space-y-5 text-xs text-stone-600 font-light">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-stone-900 font-medium text-sm">
                      Address
                    </strong>
                    <p className="mt-0.5 leading-relaxed">
                      Lane 6, South Main Road, Koregaon Park,<br />
                      Pune, Maharashtra 411001, India
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-stone-900 font-medium text-sm">
                      Operating Timings
                    </strong>
                    <p className="mt-0.5 leading-relaxed">
                      <strong>Yoga Shala:</strong> Mon – Sun: 06:00 AM – 09:00 PM<br />
                      <strong>Nourish Café:</strong> Mon – Sun: 07:30 AM – 10:00 PM
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-stone-900 font-medium text-sm">
                      Phone & Front Desk
                    </strong>
                    <p className="mt-0.5 leading-relaxed">
                      +91 98230 12345 / +91 (020) 2615 4321
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-stone-900 font-medium text-sm">
                      Direct Email
                    </strong>
                    <p className="mt-0.5 leading-relaxed">
                      namaste@theampmstudio.com
                    </p>
                  </div>
                </div>
              </div>

              {/* Direct WhatsApp Callout */}
              <div className="pt-4 border-t border-stone-100">
                <a
                  href="https://wa.me/919823012345?text=Hi%20THE%20AM%3APM%20STUDIO%20Pune,%20I'd%20like%20to%20inquire%20about%20a%20class..."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs uppercase tracking-wider font-medium transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <MessageSquare className="w-4 h-4" /> Chat on WhatsApp Directly
                </a>
              </div>
            </div>

            {/* Neighborhood & Commute Guide */}
            <div className="bg-stone-100 p-6 rounded-3xl border border-stone-200 space-y-3 text-xs text-stone-600 font-light">
              <h3 className="text-sm font-serif text-stone-900 font-medium flex items-center gap-2">
                <Compass className="w-4 h-4 text-amber-700" /> Getting Here
              </h3>
              <p className="leading-relaxed">
                Located just 3 minutes from Osho Teerth Park on peaceful Lane 6.
                Bicycle stands are available in the front garden. Valet parking is
                available for all morning and evening classes.
              </p>
            </div>
          </div>

          {/* Interactive Inquiry Form Column */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl p-8 md:p-10 border border-stone-200 shadow-sm">
              <div className="space-y-2 mb-8">
                <span className="text-xs font-semibold uppercase tracking-widest text-amber-700">
                  Send a Message
                </span>
                <h2 className="text-2xl md:text-3xl font-serif text-stone-900">
                  How Can We Support Your Practice?
                </h2>
                <p className="text-xs text-stone-500 font-light">
                  Our front desk responds to all messages within 2 to 4 business hours.
                </p>
              </div>

              {submitted ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-serif text-stone-900">
                    Message Received
                  </h3>
                  <p className="text-xs text-stone-600 max-w-sm mx-auto leading-relaxed font-light">
                    Thank you, {formData.name || "Friend"}. Our team at THE AM:PM STUDIO in Koregaon Park has
                    received your inquiry and will be in touch shortly.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({
                        name: "",
                        email: "",
                        phone: "",
                        subject: "General Studio Inquiry",
                        message: "",
                      });
                    }}
                    className="mt-4 px-5 py-2.5 bg-stone-900 text-white rounded-full text-xs uppercase tracking-wider font-medium hover:bg-stone-800 transition"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-1.5">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Radhika Joshi"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full px-4 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-1.5">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="radhika@example.com"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="w-full px-4 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-1.5">
                        Phone Number (Optional)
                      </label>
                      <input
                        type="tel"
                        placeholder="+91 98230 12345"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className="w-full px-4 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-1.5">
                        Topic / Interest
                      </label>
                      <select
                        value={formData.subject}
                        onChange={(e) =>
                          setFormData({ ...formData, subject: e.target.value })
                        }
                        className="w-full px-4 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900"
                      >
                        <option value="General Studio Inquiry">
                          General Studio Inquiry
                        </option>
                        <option value="Complimentary Free Trial">
                          Complimentary Free Trial Question
                        </option>
                        <option value="Private 1-on-1 Session">
                          Private 1-on-1 Instruction
                        </option>
                        <option value="Corporate Retreat / Workshop Hosting">
                          Corporate Retreat / Space Hire
                        </option>
                        <option value="Café Catering & Events">
                          Café Catering & Special Events
                        </option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1.5">
                      Your Message *
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Tell us about your practice, preferred timings, or any specific questions..."
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                      className="w-full px-4 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900 leading-relaxed"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-3.5 bg-stone-900 hover:bg-stone-800 text-white rounded-full text-xs uppercase tracking-widest font-medium transition flex items-center justify-center gap-2 shadow-md"
                    >
                      Send Message <ArrowRight className="w-4 h-4" />
                    </button>
                    <p className="text-[10px] text-stone-400 text-center mt-2.5 flex items-center justify-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-stone-400" />
                      We respect your privacy. No marketing lists or unsolicited messages.
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Prominent Bottom Book Now Banner */}
      <section className="bg-stone-900 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <span className="text-xs font-semibold uppercase tracking-widest text-amber-400">
            Ready to Begin?
          </span>
          <h2 className="text-3xl md:text-4xl font-serif text-stone-100">
            Step Onto the Mat Today
          </h2>
          <p className="max-w-md mx-auto text-sm text-stone-300 font-light leading-relaxed">
            Reserve your complimentary trial session or explore multi-class practice packs.
          </p>
          <div className="pt-2">
            <Link
              href="/book"
              className="px-8 py-3.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-medium rounded-full text-xs uppercase tracking-widest transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-2"
            >
              Book Class Now <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
