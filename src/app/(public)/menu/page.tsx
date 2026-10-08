"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  UtensilsCrossed,
  Coffee,
  Sparkles,
  Leaf,
  Wheat,
  ShieldCheck,
  Search,
  Filter,
  ArrowRight,
  QrCode,
  Flame,
  HeartHandshake,
  CheckCircle2,
} from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price_inr: number;
  dietary_tags: string[];
  image_url: string;
  is_available: boolean;
}

interface MenuCategory {
  id: string;
  name: string;
  slug: string;
  kitchen_station: string;
  items: MenuItem[];
}

export default function MenuPage() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    async function fetchMenu() {
      try {
        const res = await fetch("/api/menu");
        const json = await res.json();
        if (json.categories) {
          setCategories(json.categories);
        }
      } catch (err) {
        console.error("Failed to load menu", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMenu();
  }, []);

  const dietaryTagsList = [
    { label: "All Diets", value: "all" },
    { label: "🌱 Vegan", value: "vegan" },
    { label: "🌾 Gluten-Free", value: "gluten_free" },
    { label: "🌿 Organic", value: "organic" },
    { label: "🍯 Sugar-Free", value: "sugar_free" },
    { label: "⚡ High Protein", value: "high_protein" },
  ];

  // Flatten and filter items
  const allItems: (MenuItem & { categoryName: string; categorySlug: string })[] = [];
  categories.forEach((cat) => {
    cat.items.forEach((item) => {
      allItems.push({
        ...item,
        categoryName: cat.name,
        categorySlug: cat.slug,
      });
    });
  });

  const filteredItems = allItems.filter((item) => {
    const matchesCategory =
      selectedCategory === "all" || item.categorySlug === selectedCategory;
    const matchesTag =
      selectedTag === "all" ||
      (item.dietary_tags && item.dietary_tags.includes(selectedTag));
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description &&
        item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesTag && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900">
      {/* Header Banner */}
      <section className="relative pt-32 pb-20 px-6 bg-stone-900 text-stone-100 overflow-hidden">
        <div className="absolute inset-0 opacity-15">
          <div
            className="w-full h-full bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=2000&auto=format&fit=crop')",
            }}
          />
        </div>
        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold uppercase tracking-widest border border-amber-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            THE AM:PM STUDIO • Nourish Café
          </div>
          <h1 className="text-4xl md:text-6xl font-light tracking-tight font-serif text-white">
            Conscious Cuisine for <br className="hidden sm:inline" />
            <span className="italic font-normal text-amber-200">All-Day Vitality</span>
          </h1>
          <p className="max-w-2xl mx-auto text-stone-300 text-base md:text-lg leading-relaxed font-light">
            Designed to complement your yoga practice. Wholesome organic ingredients,
            botanical adaptogens, zero refined sugars, and cold-pressed oils.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4 text-xs tracking-wider uppercase text-stone-300">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 100% Plant-Forward
            </span>
            <span className="text-stone-600">•</span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Sahyadri Farm Sourced
            </span>
            <span className="text-stone-600">•</span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Ayurvedic Balance
            </span>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section className="sticky top-20 z-30 bg-[#FDFBF7]/95 backdrop-blur-md border-b border-stone-200 shadow-sm py-4 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-2 rounded-full text-xs font-medium uppercase tracking-wider transition-all whitespace-nowrap ${
                selectedCategory === "all"
                  ? "bg-stone-900 text-white shadow-sm"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              All Offerings
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-4 py-2 rounded-full text-xs font-medium uppercase tracking-wider transition-all whitespace-nowrap ${
                  selectedCategory === cat.slug
                    ? "bg-stone-900 text-white shadow-sm"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search dishes or ingredients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-stone-300 rounded-full focus:outline-none focus:ring-1 focus:ring-stone-900 focus:border-stone-900 transition-all placeholder:text-stone-400"
            />
          </div>
        </div>

        {/* Dietary Filters */}
        <div className="max-w-6xl mx-auto mt-3 pt-3 border-t border-stone-100 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-600 flex items-center gap-1 mr-2 whitespace-nowrap">
            <Filter className="w-3 h-3" /> Diet:
          </span>
          {dietaryTagsList.map((tag) => (
            <button
              key={tag.value}
              onClick={() => setSelectedTag(tag.value)}
              className={`px-3 py-1 rounded-full text-xs transition-all whitespace-nowrap ${
                selectedTag === tag.value
                  ? "bg-amber-100 text-amber-900 font-medium border border-amber-300"
                  : "bg-white text-stone-600 border border-stone-200 hover:border-stone-300"
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>
      </section>

      {/* Menu Grid */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900" />
            <p className="mt-3 text-sm text-stone-500 font-light">
              Gathering garden-fresh menu...
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 bg-stone-50 rounded-2xl border border-dashed border-stone-200 p-8">
            <UtensilsCrossed className="w-10 h-10 text-stone-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-stone-800">No dishes found</h3>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
              Try adjusting your dietary filter or search query to see other nourishing
              options.
            </p>
            <button
              onClick={() => {
                setSelectedCategory("all");
                setSelectedTag("all");
                setSearchQuery("");
              }}
              className="mt-4 px-4 py-2 bg-stone-900 text-white rounded-full text-xs uppercase tracking-wider font-medium hover:bg-stone-800 transition"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="group bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Item Image */}
                  <div className="relative h-52 w-full overflow-hidden bg-stone-100">
                    <img
                      src={
                        item.image_url ||
                        "https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=800&auto=format&fit=crop"
                      }
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                      <span className="px-2.5 py-1 rounded-full bg-stone-900/80 backdrop-blur-sm text-[10px] font-medium tracking-wider uppercase text-stone-100">
                        {item.categoryName}
                      </span>
                    </div>
                  </div>

                  {/* Item Info */}
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-lg font-serif text-stone-900 group-hover:text-amber-800 transition-colors">
                        {item.name}
                      </h3>
                      <span className="text-base font-semibold text-stone-900 whitespace-nowrap">
                        ₹{item.price_inr}
                      </span>
                    </div>

                    <p className="text-xs text-stone-600 font-light leading-relaxed mb-4">
                      {item.description}
                    </p>

                    {/* Dietary Tags */}
                    {item.dietary_tags && item.dietary_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {item.dietary_tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded text-[10px] font-medium tracking-wide uppercase bg-stone-100 text-stone-600 border border-stone-200"
                          >
                            {tag.replace("_", " ")}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer / In-House Ordering Preview */}
                <div className="p-6 pt-0 border-t border-stone-100 mt-2 flex items-center justify-between text-xs text-stone-500">
                  <span className="flex items-center gap-1.5 text-stone-500 font-light">
                    <QrCode className="w-3.5 h-3.5 text-amber-600" />
                    Scan QR at Table (Phase 3)
                  </span>
                  <span className="text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded">
                    Fresh in Kitchen
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Philosophy Callout */}
      <section className="bg-stone-100 border-y border-stone-200 py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-700">
              Our Sourcing Standard
            </span>
            <h2 className="text-3xl font-serif text-stone-900 mt-2">
              AM Nourishment to PM Restoration
            </h2>
            <p className="text-sm text-stone-600 font-light mt-3">
              We never compromise with commercial shortcuts. Food at THE AM:PM STUDIO is
              medicine for your cells.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 mb-4">
                <Leaf className="w-5 h-5" />
              </div>
              <h4 className="font-serif text-stone-900 text-lg mb-2">
                Local Organic Soil
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed font-light">
                Herbs and greens arrive daily from certified regenerative farms in
                Mulshi and the Sahyadri foothills, free of chemical pesticides.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 mb-4">
                <Flame className="w-5 h-5" />
              </div>
              <h4 className="font-serif text-stone-900 text-lg mb-2">
                Cold-Pressed Oils Only
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed font-light">
                We strictly ban industrial seed oils and palm oil. Every dish is
                prepared with wooden cold-pressed sesame, virgin coconut, or A2 bilona
                ghee.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-800 mb-4">
                <Wheat className="w-5 h-5" />
              </div>
              <h4 className="font-serif text-stone-900 text-lg mb-2">
                Zero Refined Sugar
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed font-light">
                All elixirs and desserts derive sweetness from whole Medjool dates,
                wild unpasteurized forest honey, or stone-ground Khandsari.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Synergistic Yoga & Café CTA */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <div className="bg-stone-900 text-white rounded-3xl p-8 md:p-14 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-400">
              Practice & Nourish
            </span>
            <h2 className="text-3xl md:text-4xl font-serif text-stone-100">
              Join Us on the Mat, Stay for Brunch
            </h2>
            <p className="text-sm text-stone-300 font-light leading-relaxed">
              Experience the harmony of our Koregaon Park shala. Practice your morning
              Vinyasa or Sound Bath, followed by a ceremonial matcha on the garden
              veranda.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <Link
              href="/book"
              className="px-8 py-3.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-medium rounded-full text-xs uppercase tracking-widest transition-all text-center shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              Book Class Now <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="px-6 py-3.5 border border-stone-700 hover:border-stone-500 text-stone-200 font-medium rounded-full text-xs uppercase tracking-widest transition-all text-center hover:bg-stone-800"
            >
              Visit Shala
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
