import React from "react";
import Link from "next/link";
import { MapPin, Phone, Mail, Instagram, Clock, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#1E2421] text-[#F9F6F0] pt-16 pb-12 border-t border-[#343E38]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="px-2.5 py-1.5 rounded-xl bg-stone-800 text-amber-300 flex items-center justify-center font-mono text-xs font-bold tracking-wider border border-stone-700">
                AM:PM
              </div>
              <div>
                <span className="block text-xl font-serif font-bold text-white tracking-tight">
                  THE AM:PM STUDIO
                </span>
                <span className="block text-[10px] tracking-[0.2em] uppercase font-semibold text-[#D4A373]">
                  YOGA STUDIO & NOURISH CAFÉ • PUNE
                </span>
              </div>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed max-w-sm">
              Morning movement meets evening stillness in Koregaon Park, Pune. From sunrise dynamic vinyasa and ceremonial matcha to sunset sound baths and restorative herbal elixirs.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-[#C86D51] text-stone-300 hover:text-white flex items-center justify-center transition"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://whatsapp.com"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-[#657E6B]/30 hover:bg-[#657E6B] text-emerald-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <span>WhatsApp Community</span>
              </a>
            </div>
          </div>

          {/* Quick Links: Yoga Studio */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4A373]">
              Yoga Studio
            </h4>
            <ul className="space-y-2 text-xs text-stone-300">
              <li>
                <Link href="/book" className="hover:text-white transition">
                  Book A Class
                </Link>
              </li>
              <li>
                <Link href="/packs" className="hover:text-white transition">
                  Class Packs & Pricing
                </Link>
              </li>
              <li>
                <Link href="/trainers" className="hover:text-white transition">
                  Our Teachers & Lineage
                </Link>
              </li>
              <li>
                <Link href="/events" className="hover:text-white transition">
                  Sound Baths & Events
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-white transition">
                  Claim Free Trial Class
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links: Courtyard Café */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4A373]">
              Nourish Café
            </h4>
            <ul className="space-y-2 text-xs text-stone-300">
              <li>
                <Link href="/menu#food" className="hover:text-white transition">
                  Nourish Bowls & Tartines
                </Link>
              </li>
              <li>
                <Link href="/menu#beverage" className="hover:text-white transition">
                  Ceremonial Matcha & Elixirs
                </Link>
              </li>
              <li>
                <Link href="/menu#dessert" className="hover:text-white transition">
                  Guilt-Free Raw Desserts
                </Link>
              </li>
              <li>
                <Link href="/about#space" className="hover:text-white transition">
                  Courtyard Garden Space
                </Link>
              </li>
            </ul>
          </div>

          {/* Location & Timings */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4A373]">
              Pune Location & Hours
            </h4>
            <div className="space-y-2.5 text-xs text-stone-300">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#C86D51] shrink-0 mt-0.5" />
                <span>Lane 6, South Main Road, Koregaon Park, Pune 411001</span>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-[#657E6B] shrink-0 mt-0.5" />
                <div>
                  <p><strong>Shala:</strong> 6:30 AM – 8:30 PM</p>
                  <p><strong>Café:</strong> 7:30 AM – 10:00 PM</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#D4A373] shrink-0" />
                <span>+91 98230 12345</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright & attribution */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-400 gap-4">
          <p>© {new Date().getFullYear()} THE AM:PM STUDIO (Pune). All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/about" className="hover:text-white">Philosophy</Link>
            <Link href="/contact" className="hover:text-white">Contact</Link>
            <Link href="/login" className="hover:text-white">Member Sign In</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
