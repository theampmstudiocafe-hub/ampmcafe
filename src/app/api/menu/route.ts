import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const admin = createAdminClient();

    // 1. Fetch active categories
    const { data: categories, error: catError } = await admin
      .from("menu_categories")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (catError || !categories || categories.length === 0) {
      // Graceful fallback to verified seed data
      const fallbackCategories = [
        {
          id: "44444444-4444-4444-4444-444444444401",
          name: "Nourish Bowls & Food",
          slug: "food",
          kitchen_station: "food",
          items: [
            {
              id: "item-1",
              name: "AM:PM Earth Bowl",
              description: "Warm red quinoa, charred broccolini, roasted sweet potato, edamame, and turmeric tahini dressing.",
              price_inr: 380,
              dietary_tags: ["vegan", "gluten_free", "organic"],
              image_url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop",
              is_available: true,
            },
            {
              id: "item-2",
              name: "Artisan Sourdough Tartine",
              description: "House fermented sourdough, crushed Hass avocado, hemp seeds, microgreens, and cold-pressed chili oil.",
              price_inr: 340,
              dietary_tags: ["vegan", "organic"],
              image_url: "https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=800&auto=format&fit=crop",
              is_available: true,
            },
            {
              id: "item-3",
              name: "Mediterranean Protein Mezze",
              description: "Sprouted lentil falafel, beetroot hummus, marinated kalamata olives, cucumber ribbons, and seeded seed-crackers.",
              price_inr: 390,
              dietary_tags: ["vegan", "gluten_free", "high_protein"],
              image_url: "https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=800&auto=format&fit=crop",
              is_available: true,
            }
          ]
        },
        {
          id: "44444444-4444-4444-4444-444444444402",
          name: "Elixirs & Beverages",
          slug: "beverage",
          kitchen_station: "beverage",
          items: [
            {
              id: "item-4",
              name: "Ceremonial Uji Matcha Latte",
              description: "First harvest Japanese ceremonial matcha whisked with velvety oat milk and raw wild forest honey.",
              price_inr: 260,
              dietary_tags: ["organic", "dairy_free"],
              image_url: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?q=80&w=800&auto=format&fit=crop",
              is_available: true,
            },
            {
              id: "item-5",
              name: "Golden Turmeric Ashwagandha Elixir",
              description: "Fresh Lakadong turmeric, adaptogenic ashwagandha, black pepper, cardamom, and warm coconut milk.",
              price_inr: 220,
              dietary_tags: ["vegan", "caffeine_free", "ayurvedic"],
              image_url: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?q=80&w=800&auto=format&fit=crop",
              is_available: true,
            },
            {
              id: "item-6",
              name: "Single-Estate Cold Brew Tonic",
              description: "Araku Valley single origin light roast cold brewed for 18 hours, infused with botanic tonic and orange peel.",
              price_inr: 240,
              dietary_tags: ["vegan", "organic"],
              image_url: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?q=80&w=800&auto=format&fit=crop",
              is_available: true,
            }
          ]
        },
        {
          id: "44444444-4444-4444-4444-444444444403",
          name: "Guilt-Free Desserts",
          slug: "dessert",
          kitchen_station: "dessert",
          items: [
            {
              id: "item-7",
              name: "Raw Cacao & Avocado Silk Mousse",
              description: "Single origin Indian cacao, Hass avocado, Medjool date nectar, and toasted hazelnut crumble.",
              price_inr: 280,
              dietary_tags: ["vegan", "gluten_free", "sugar_free"],
              image_url: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=800&auto=format&fit=crop",
              is_available: true,
            },
            {
              id: "item-8",
              name: "Cardamom & Rose Chia Pudding",
              description: "Coconut-soaked chia seeds, crushed pistachios, organic rose petal jam, and seasonal Mahabaleshwar berries.",
              price_inr: 240,
              dietary_tags: ["vegan", "gluten_free", "organic"],
              image_url: "https://images.unsplash.com/photo-1488477181946-6428a0291777?q=80&w=800&auto=format&fit=crop",
              is_available: true,
            }
          ]
        }
      ];

      return NextResponse.json({
        success: true,
        categories: fallbackCategories,
      });
    }

    // 2. Fetch available menu items
    const { data: items, error: itemError } = await admin
      .from("menu_items")
      .select("*")
      .eq("is_available", true)
      .order("display_order", { ascending: true });

    // Group items by category
    const categorized = categories.map((cat) => ({
      ...cat,
      items: (items || []).filter((item) => item.category_id === cat.id),
    }));

    return NextResponse.json({
      success: true,
      categories: categorized,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
