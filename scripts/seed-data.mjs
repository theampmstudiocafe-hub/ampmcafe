import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wdrfrnzyocfkfcecbbuw.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkcmZybnp5b2Nma2ZjZWNiYnV3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTQ3NTc5NywiZXhwIjoyMTA3MDUxNzk3fQ.4cZd3A1KsoBC0db_-5fnQUtUt3wlvf_xn0W0oVkFQ30";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function seed() {
  console.log("Seeding live Supabase database...");

  // 1. Business Settings
  const settings = [
    { key: "cancellation_window_hours", value: 12, description: "Hours prior to session start where cancellation refunds full credit" },
    { key: "refund_credit_policy", value: "return_credit_if_cancelled_before_window", description: "Default refund rule when cancellation is within policy" },
    { key: "waitlist_enabled", value: true, description: "Whether members can join a waitlist when class session is full" },
    { key: "waitlist_auto_promote", value: true, description: "Whether waitlisted members are automatically promoted when a spot opens" },
    { key: "one_on_one_default_price_inr", value: 2500, description: "Standard price for 60-minute private 1-on-1 yoga instruction" },
    { key: "trial_allow_free", value: true, description: "Whether verified new members receive one complimentary trial class" },
    {
      key: "studio_profile",
      value: {
        name: "THE AM:PM STUDIO",
        city: "Pune",
        neighborhood: "Koregaon Park",
        address: "Lane 6, South Main Road, Koregaon Park, Pune 411001",
        phone: "+91 98230 12345",
        email: "namaste@theampmstudio.com",
        instagram: "@theampmstudio.pune"
      },
      description: "Core brand and studio location identity"
    }
  ];

  for (const s of settings) {
    const { error } = await supabase.from("business_settings").upsert(s, { onConflict: "key" });
    if (error) console.error("Error setting:", s.key, error.message);
  }
  console.log("✓ Business settings seeded");

  // 2. Class Types
  const classTypes = [
    {
      id: "11111111-1111-1111-1111-111111111101",
      name: "Vinyasa Flow",
      slug: "vinyasa-flow",
      description: "Dynamic, breath-synchronized sequence building strength, flexibility, and moving meditation.",
      duration_minutes: 60,
      default_capacity: 16,
      color_hex: "#C86D51",
      image_url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1000&auto=format&fit=crop"
    },
    {
      id: "11111111-1111-1111-1111-111111111102",
      name: "Ashtanga Primary",
      slug: "ashtanga-primary",
      description: "Traditional set sequence of postures promoting endurance, mental clarity, and internal heat.",
      duration_minutes: 75,
      default_capacity: 14,
      color_hex: "#657E6B",
      image_url: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1000&auto=format&fit=crop"
    },
    {
      id: "11111111-1111-1111-1111-111111111103",
      name: "Yin Yoga & Sound Bath",
      slug: "yin-sound-bath",
      description: "Slow, passive floor poses held for deep connective release, accompanied by Tibetan singing bowls.",
      duration_minutes: 75,
      default_capacity: 18,
      color_hex: "#7A6F82",
      image_url: "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1000&auto=format&fit=crop"
    },
    {
      id: "11111111-1111-1111-1111-111111111104",
      name: "Pranayama & Breathwork",
      slug: "pranayama-breathwork",
      description: "Conscious yogic breath regulation techniques for nervous system rejuvenation and stillness.",
      duration_minutes: 45,
      default_capacity: 20,
      color_hex: "#D4A373",
      image_url: "https://images.unsplash.com/photo-1508672019048-805b876b67e2?q=80&w=1000&auto=format&fit=crop"
    }
  ];

  for (const ct of classTypes) {
    const { error } = await supabase.from("class_types").upsert(ct, { onConflict: "slug" });
    if (error) console.error("Error class type:", ct.slug, error.message);
  }
  console.log("✓ Class types seeded");

  // 3. Pack Types
  const packTypes = [
    {
      id: "22222222-2222-2222-2222-222222222201",
      name: "Introductory 3-Class Pack",
      description: "Ideal for newcomers to experience our shala instructors and styles.",
      price_inr: 1800,
      credits: 3,
      validity_days: 30,
      active: true,
      display_order: 1
    },
    {
      id: "22222222-2222-2222-2222-222222222202",
      name: "10-Class Practice Pack",
      description: "Our most loved pack for consistent weekly practice and community wellness.",
      price_inr: 5500,
      credits: 10,
      validity_days: 60,
      active: true,
      display_order: 2
    },
    {
      id: "22222222-2222-2222-2222-222222222203",
      name: "20-Class Commitment Pack",
      description: "Maximum value for dedicated daily and multi-session practitioners.",
      price_inr: 9800,
      credits: 20,
      validity_days: 90,
      active: true,
      display_order: 3
    },
    {
      id: "22222222-2222-2222-2222-222222222204",
      name: "Single Drop-In Pass",
      description: "Flexible single session pass for drop-ins and travelers in Pune.",
      price_inr: 700,
      credits: 1,
      validity_days: 14,
      active: true,
      display_order: 4
    }
  ];

  for (const pt of packTypes) {
    const { error } = await supabase.from("pack_types").upsert(pt, { onConflict: "id" });
    if (error) console.error("Error pack type:", pt.name, error.message);
  }
  console.log("✓ Pack types seeded");

  // 4. Trainers
  const trainers = [
    {
      id: "33333333-3333-3333-3333-333333333301",
      name: "Ananya Kulkarni",
      slug: "ananya-kulkarni",
      bio: "Senior Vinyasa and Functional Movement teacher with 10+ years exploring yogic anatomy and mindful transitions.",
      story: "Ananya discovered yoga during her corporate years in Pune, finding in it an anchor of presence and deep physiological healing. Certified in Mysore and Rishikesh.",
      specialties: ["Vinyasa Flow", "Asana Alignment", "Mobility & Restorative"],
      instagram_handle: "@ananya.yoga.pune",
      display_order: 1,
      media_urls: ["https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=800&auto=format&fit=crop"]
    },
    {
      id: "33333333-3333-3333-3333-333333333302",
      name: "Rohan Deshmukh",
      slug: "rohan-deshmukh",
      bio: "Ashtanga practitioner and breathwork guide dedicated to traditional Mysore discipline and stillness.",
      story: "Born and raised in Pune, Rohan apprenticed under renowned Ashtanga masters. He combines rigorous technique with compassionate presence.",
      specialties: ["Ashtanga Vinyasa", "Pranayama", "Bandhas & Breath"],
      instagram_handle: "@rohan.ashtanga",
      display_order: 2,
      media_urls: ["https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=800&auto=format&fit=crop"]
    },
    {
      id: "33333333-3333-3333-3333-333333333303",
      name: "Maya Shenoy",
      slug: "maya-shenoy",
      bio: "Sound alchemist and Yin Yoga practitioner weaving quartz singing bowls, gongs, and meditative stillness.",
      story: "Maya blends sound therapy and myofascial yin release, holding grounding spaces where the nervous system naturally recalibrates.",
      specialties: ["Yin Yoga", "Sound Bath", "Nervous System Reset"],
      instagram_handle: "@maya.sounds",
      display_order: 3,
      media_urls: ["https://images.unsplash.com/photo-1545205597-3d9d02c29597?q=80&w=800&auto=format&fit=crop"]
    }
  ];

  for (const tr of trainers) {
    const { error } = await supabase.from("trainers").upsert(tr, { onConflict: "slug" });
    if (error) console.error("Error trainer:", tr.slug, error.message);
  }
  console.log("✓ Trainers seeded");

  // 5. Menu Categories
  const categories = [
    { id: "44444444-4444-4444-4444-444444444401", name: "Nourish Bowls & Food", slug: "food", display_order: 1, kitchen_station: "food", is_active: true },
    { id: "44444444-4444-4444-4444-444444444402", name: "Elixirs & Beverages", slug: "beverage", display_order: 2, kitchen_station: "beverage", is_active: true },
    { id: "44444444-4444-4444-4444-444444444403", name: "Guilt-Free Desserts", slug: "dessert", display_order: 3, kitchen_station: "dessert", is_active: true }
  ];

  for (const cat of categories) {
    const { error } = await supabase.from("menu_categories").upsert(cat, { onConflict: "slug" });
    if (error) console.error("Error category:", cat.slug, error.message);
  }
  console.log("✓ Menu categories seeded");

  // 6. Menu Items
  const menuItems = [
    {
      category_id: "44444444-4444-4444-4444-444444444401",
      name: "AM:PM Earth Bowl",
      description: "Warm red quinoa, charred broccolini, roasted sweet potato, edamame, and turmeric tahini dressing.",
      price_inr: 380,
      dietary_tags: ["vegan", "gluten_free"],
      image_url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop",
      is_available: true,
      display_order: 1
    },
    {
      category_id: "44444444-4444-4444-4444-444444444401",
      name: "Artisan Sourdough Tartine",
      description: "House fermented sourdough, crushed Hass avocado, hemp seeds, microgreens, and cold-pressed chili oil.",
      price_inr: 340,
      dietary_tags: ["vegan"],
      image_url: "https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=800&auto=format&fit=crop",
      is_available: true,
      display_order: 2
    },
    {
      category_id: "44444444-4444-4444-4444-444444444402",
      name: "Ceremonial Uji Matcha Latte",
      description: "First harvest Japanese ceremonial matcha whisked with velvety oat milk and raw wild honey.",
      price_inr: 260,
      dietary_tags: ["organic", "dairy_free"],
      image_url: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?q=80&w=800&auto=format&fit=crop",
      is_available: true,
      display_order: 1
    },
    {
      category_id: "44444444-4444-4444-4444-444444444402",
      name: "Golden Turmeric Ashwagandha Elixir",
      description: "Fresh Lakadong turmeric, adaptogenic ashwagandha, black pepper, cardamom, and coconut milk.",
      price_inr: 220,
      dietary_tags: ["vegan", "caffeine_free"],
      image_url: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?q=80&w=800&auto=format&fit=crop",
      is_available: true,
      display_order: 2
    },
    {
      category_id: "44444444-4444-4444-4444-444444444403",
      name: "Raw Cacao & Avocado Silk Mousse",
      description: "Single origin Indian cacao, Hass avocado, Medjool date nectar, and toasted hazelnut crumble.",
      price_inr: 280,
      dietary_tags: ["vegan", "gluten_free", "sugar_free"],
      image_url: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=800&auto=format&fit=crop",
      is_available: true,
      display_order: 1
    },
    {
      category_id: "44444444-4444-4444-4444-444444444403",
      name: "Cardamom & Rose Chia Pudding",
      description: "Coconut-soaked chia seeds, crushed pistachios, organic rose petal jam, and seasonal berries.",
      price_inr: 240,
      dietary_tags: ["vegan", "gluten_free"],
      image_url: "https://images.unsplash.com/photo-1488477181946-6428a0291777?q=80&w=800&auto=format&fit=crop",
      is_available: true,
      display_order: 2
    }
  ];

  for (const mi of menuItems) {
    const { error } = await supabase.from("menu_items").insert(mi);
    if (error) console.error("Error menu item:", mi.name, error.message);
  }
  console.log("✓ Menu items seeded");

  // 7. Dining Tables
  const tables = [
    { table_number: "Table 1", qr_code_token: "QR-PUNE-T01-A9F2", capacity: 2, is_active: true },
    { table_number: "Table 2", qr_code_token: "QR-PUNE-T02-B8E3", capacity: 4, is_active: true },
    { table_number: "Table 3", qr_code_token: "QR-PUNE-T03-C7D4", capacity: 2, is_active: true },
    { table_number: "Veranda 1", qr_code_token: "QR-PUNE-V01-D6C5", capacity: 4, is_active: true },
    { table_number: "Veranda 2", qr_code_token: "QR-PUNE-V02-E5B6", capacity: 6, is_active: true }
  ];

  for (const tb of tables) {
    const { error } = await supabase.from("dining_tables").upsert(tb, { onConflict: "table_number" });
    if (error) console.error("Error dining table:", tb.table_number, error.message);
  }
  console.log("✓ Dining tables seeded");

  console.log("\n🎉 ALL LIVE SUPABASE SEED DATA POPULATED SUCCESSFULLY!");
}

seed();
