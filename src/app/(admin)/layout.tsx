"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Layers,
  ShieldAlert,
  UserCheck,
  ArrowLeft,
  Sparkles,
  ExternalLink,
  Calendar,
  UtensilsCrossed,
  IndianRupee,
  Receipt,
  Users,
  UserCog,
  Truck,
  Boxes,
  ChefHat,
  MessageSquareHeart,
  TrendingUp,
} from "lucide-react";
import { OfflineSyncTray } from "@/components/admin/OfflineSyncTray";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navSections = [
    {
      title: "Overview & Finance",
      items: [
        { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { title: "Financials & P&L", href: "/admin/financials", icon: IndianRupee },
        { title: "Operating Expenses", href: "/admin/expenses", icon: Receipt },
      ],
    },
    {
      title: "Yoga Studio",
      items: [
        { title: "Bookings & Roster", href: "/admin/bookings", icon: Calendar },
        { title: "Members Directory", href: "/admin/members", icon: Users },
        { title: "Class Packs & Pricing", href: "/admin/packs", icon: Layers },
        { title: "Staff & Trainers HR", href: "/admin/staff", icon: UserCog },
      ],
    },
    {
      title: "Café Operations",
      items: [
        { title: "Suppliers & POs", href: "/admin/suppliers", icon: Truck },
        { title: "Stock & Stocktake", href: "/admin/inventory", icon: Boxes },
        { title: "Kitchen Recipes (BOM)", href: "/admin/recipes", icon: ChefHat },
      ],
    },
    {
      title: "Integrity & Feedback",
      items: [
        { title: "Trial Safeguards", href: "/admin/trials", icon: UserCheck },
        { title: "Moderation Queue", href: "/admin/moderation", icon: ShieldAlert },
        { title: "Customer Feedback", href: "/admin/feedback", icon: MessageSquareHeart },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col md:flex-row text-stone-900">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-stone-900 text-stone-100 flex flex-col justify-between shrink-0 h-screen sticky top-0 overflow-y-auto">
        <div>
          {/* Brand */}
          <div className="p-5 border-b border-stone-800">
            <div className="flex items-center gap-2.5">
              <div className="px-2 py-1 rounded-lg bg-amber-500 text-stone-950 font-mono font-bold text-xs shadow">
                AM:PM
              </div>
              <div>
                <h1 className="font-serif text-sm font-semibold tracking-wide text-white">
                  THE AM:PM STUDIO
                </h1>
                <p className="text-[10px] text-stone-400 font-light">
                  Property Management System
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Sections */}
          <div className="p-3 space-y-4">
            {navSections.map((section) => (
              <div key={section.title} className="space-y-1">
                <span className="px-3 text-[10px] uppercase font-bold tracking-wider text-stone-400">
                  {section.title}
                </span>
                <nav className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                          isActive
                            ? "bg-amber-500 text-stone-950 font-semibold shadow-sm"
                            : "text-stone-300 hover:bg-stone-800 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span>{item.title}</span>
                        </div>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Sidebar Links */}
        <div className="p-4 border-t border-stone-800 space-y-2">
          <Link
            href="/"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs text-stone-400 hover:text-white hover:bg-stone-800 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Public Website</span>
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs text-stone-400 hover:text-white hover:bg-stone-800 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Member Dashboard</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>

      {/* Persistent Offline Sync Tray */}
      <OfflineSyncTray />
    </div>
  );
}
