"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  Menu as MenuIcon,
  X,
  Calendar,
  Coffee,
  Sparkles,
  MapPin,
  Instagram,
  Phone,
  User,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [user, setUser] = useState<{ displayName?: string; role?: string } | null>(null);

  // Check auth status
  useEffect(() => {
    async function checkUser() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
        }
      } catch (e) {
        // Unauthenticated visitor
      }
    }
    checkUser();
  }, []);

  // Close menus on path change
  useEffect(() => {
    setMobileOpen(false);
    setActiveDropdown(null);
  }, [pathname]);

  interface DropdownItem {
    label: string;
    href: string;
    desc: string;
    external?: boolean;
  }

  interface NavLinkItem {
    title: string;
    href: string;
    dropdown: DropdownItem[];
  }

  const navLinks: NavLinkItem[] = [
    {
      title: "About",
      href: "/about",
      dropdown: [
        { label: "Our Story & Space", href: "/about#story", desc: "Mindful architecture in Koregaon Park" },
        { label: "Our Philosophy", href: "/about#philosophy", desc: "AM energy meets PM stillness" },
        { label: "The Shala & Courtyard", href: "/about#space", desc: "Bamboo flooring, singing bowls & garden" },
      ],
    },
    {
      title: "Menu",
      href: "/menu",
      dropdown: [
        { label: "Nourish Bowls & Food", href: "/menu#food", desc: "Organic quinoa, sourdough & greens" },
        { label: "Elixirs & Beverages", href: "/menu#beverage", desc: "Ceremonial matcha & turmeric tonics" },
        { label: "Guilt-Free Desserts", href: "/menu#dessert", desc: "Raw cacao, dates & cardamom chia" },
      ],
    },
    {
      title: "Trainers",
      href: "/trainers",
      dropdown: [
        { label: "Meet the Teachers", href: "/trainers", desc: "Traditional Mysore, Vinyasa & Yin guides" },
        { label: "1-on-1 Instruction", href: "/book?mode=private", desc: "Personalized alignment & breathwork" },
      ],
    },
    {
      title: "Events",
      href: "/events",
      dropdown: [
        { label: "Sound Healing Baths", href: "/events", desc: "Quartz bowls & gong meditations" },
        { label: "Weekend Masterclasses", href: "/events", desc: "Pranayama, inversions & anatomy" },
      ],
    },
    {
      title: "Community",
      href: "/community",
      dropdown: [
        { label: "Member Group Chat", href: "/community", desc: "Connect with Pune yoga practitioners" },
        { label: "Shala Announcements", href: "/community#announcements", desc: "Teacher & schedule updates" },
      ],
    },
    {
      title: "Contact Us",
      href: "/contact",
      dropdown: [
        { label: "Koregaon Park Shala", href: "/contact", desc: "Lane 6, South Main Road, Pune" },
        { label: "Directions & Parking", href: "/contact#directions", desc: "Valet & bicycle parking" },
      ],
    },
    {
      title: "Socials",
      href: "#",
      dropdown: [
        { label: "Instagram @theampmstudio", href: "https://instagram.com", external: true, desc: "Daily practice & courtyard moments" },
        { label: "WhatsApp Community", href: "https://whatsapp.com", external: true, desc: "Daily schedule & café specials broadcast" },
      ],
    },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#FAF7F2]/90 backdrop-blur-md border-b border-[#EAE3D6] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* 1. BRAND IDENTITY */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="px-2.5 py-1.5 rounded-xl bg-stone-900 text-amber-300 flex items-center justify-center font-mono text-xs font-bold tracking-wider shadow-sm group-hover:bg-[#C86D51] group-hover:text-white transition">
              AM:PM
            </div>
            <div>
              <span className="block text-base sm:text-lg font-serif font-bold text-[#1E2421] tracking-tight leading-none group-hover:text-[#C86D51] transition">
                THE AM:PM STUDIO
              </span>
              <span className="block text-[9px] tracking-[0.2em] uppercase font-semibold text-[#657E6B] mt-0.5">
                YOGA & CAFÉ • PUNE
              </span>
            </div>
          </Link>

          {/* 2. DESKTOP NAVIGATION */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((item) => (
              <div
                key={item.title}
                className="relative"
                onMouseEnter={() => setActiveDropdown(item.title)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link
                  href={item.href}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-1 transition ${
                    pathname === item.href
                      ? "text-[#C86D51]"
                      : "text-stone-700 hover:text-[#C86D51] hover:bg-black/5"
                  }`}
                >
                  <span>{item.title}</span>
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </Link>

                {/* Dropdown Menu */}
                {activeDropdown === item.title && (
                  <div className="absolute top-full left-0 w-64 pt-2 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="bg-white rounded-2xl shadow-xl border border-[#EAE3D6] p-2 space-y-1">
                      {item.dropdown.map((sub) => (
                        <Link
                          key={sub.label}
                          href={sub.href}
                          target={sub.external ? "_blank" : undefined}
                          className="block p-2.5 rounded-xl hover:bg-[#FAF7F2] transition group"
                        >
                          <div className="text-xs font-bold text-[#1E2421] group-hover:text-[#C86D51] transition">
                            {sub.label}
                          </div>
                          <div className="text-[11px] text-stone-500 mt-0.5 line-clamp-1">
                            {sub.desc}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* 3. PROMINENT "BOOK NOW" & MEMBER PORTAL */}
          <div className="hidden sm:flex items-center gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-stone-700 hover:bg-stone-100 transition"
              >
                <User className="w-4 h-4 text-[#657E6B]" />
                <span>{user.displayName || "Member"}</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-xs font-semibold text-stone-700 hover:text-[#C86D51] px-3 py-2 transition"
              >
                Sign In
              </Link>
            )}

            {/* FIRST & MOST PROMINENT CTA */}
            <Link
              href="/book"
              className="px-5 py-2.5 bg-[#C86D51] hover:bg-[#B65A3E] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm hover:shadow-md flex items-center gap-2 transform active:scale-95 transition"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Now</span>
            </Link>
          </div>

          {/* Mobile hamburger */}
          <div className="flex sm:hidden items-center gap-2">
            <Link
              href="/book"
              className="px-3.5 py-2 bg-[#C86D51] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm"
            >
              Book Now
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 text-stone-700 hover:text-black rounded-lg"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-[#EAE3D6] bg-white p-4 space-y-4 animate-in slide-in-from-top-2">
          <div className="space-y-1">
            {navLinks.map((item) => (
              <div key={item.title} className="py-2 border-b border-stone-100">
                <Link
                  href={item.href}
                  className="font-bold text-sm text-[#1E2421] block mb-2"
                >
                  {item.title}
                </Link>
                <div className="pl-3 space-y-2">
                  {item.dropdown.map((sub) => (
                    <Link
                      key={sub.label}
                      href={sub.href}
                      className="block text-xs text-stone-600 hover:text-[#C86D51]"
                    >
                      {sub.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 flex flex-col gap-2">
            {user ? (
              <Link
                href="/dashboard"
                className="w-full py-2.5 text-center text-xs font-semibold bg-stone-100 rounded-xl"
              >
                Go to Member Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                className="w-full py-2.5 text-center text-xs font-semibold border border-stone-200 rounded-xl"
              >
                Sign In
              </Link>
            )}
            <Link
              href="/book"
              className="w-full py-3 text-center text-xs font-bold uppercase tracking-wider bg-[#C86D51] text-white rounded-xl shadow-sm"
            >
              Reserve A Spot (Book Now)
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
