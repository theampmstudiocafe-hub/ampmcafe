/**
 * THE AM:PM CAFE - Menu Catalog & 86 Item Availability Store
 * Manages dish availability, priced modifiers, and instant 86 toggling.
 */

export interface MenuItemModifier {
  id: string;
  name: string;
  pricePaise: number;
  recipeDeltaIngredientId?: string;
  recipeDeltaQuantity?: number; // in base units (e.g. +200 ml)
  isAvailable: boolean;
}

export interface MenuItemRecord {
  id: string;
  categoryId: string;
  category: 'food' | 'beverage' | 'dessert';
  name: string;
  description: string;
  pricePaise: number;
  station: 'food' | 'beverage' | 'dessert';
  dietaryTags: string[];
  imageUrl: string;
  isAvailable: boolean;
  modifiers?: MenuItemModifier[];
}

export const initialMenuCatalog: MenuItemRecord[] = [
  {
    id: "44444444-4444-4444-4444-444444444401",
    categoryId: "cat_food",
    category: "food",
    name: "AM:PM Earth Bowl",
    description: "Warm red quinoa, charred broccolini, roasted sweet potato, edamame, and turmeric tahini dressing.",
    pricePaise: 38000,
    station: "food",
    dietaryTags: ["vegan", "gluten_free"],
    imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop",
    isAvailable: true,
    modifiers: [
      { id: "mod_eb_1", name: "Add Hass Avocado", pricePaise: 8000, isAvailable: true },
      { id: "mod_eb_2", name: "Extra Broccolini", pricePaise: 6000, isAvailable: true },
      { id: "mod_eb_3", name: "Dressing on the Side", pricePaise: 0, isAvailable: true },
    ],
  },
  {
    id: "44444444-4444-4444-4444-444444444402",
    categoryId: "cat_food",
    category: "food",
    name: "Artisan Sourdough Tartine",
    description: "House fermented sourdough, crushed Hass avocado, hemp seeds, microgreens, and cold-pressed chili oil.",
    pricePaise: 34000,
    station: "food",
    dietaryTags: ["vegan"],
    imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=800&auto=format&fit=crop",
    isAvailable: true,
    modifiers: [
      { id: "mod_ast_1", name: "Extra Sourdough Slice", pricePaise: 5000, isAvailable: true },
      { id: "mod_ast_2", name: "Extra Chili Oil", pricePaise: 0, isAvailable: true },
    ],
  },
  {
    id: "44444444-4444-4444-4444-444444444403",
    categoryId: "cat_bev",
    category: "beverage",
    name: "Ceremonial Uji Matcha Latte",
    description: "First harvest Japanese ceremonial matcha whisked with velvety oat milk and raw wild honey.",
    pricePaise: 26000,
    station: "beverage",
    dietaryTags: ["organic", "dairy_free"],
    imageUrl: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?q=80&w=800&auto=format&fit=crop",
    isAvailable: true,
    modifiers: [
      { id: "mod_uml_1", name: "Oat Milk Substitution", pricePaise: 4000, isAvailable: true },
      { id: "mod_uml_2", name: "Extra Ceremonial Shot", pricePaise: 6000, isAvailable: true },
      { id: "mod_uml_3", name: "Unsweetened (No Honey)", pricePaise: 0, isAvailable: true },
    ],
  },
  {
    id: "44444444-4444-4444-4444-444444444404",
    categoryId: "cat_bev",
    category: "beverage",
    name: "Golden Turmeric Ashwagandha Elixir",
    description: "Fresh Lakadong turmeric, adaptogenic ashwagandha, black pepper, cardamom, and coconut milk.",
    pricePaise: 22000,
    station: "beverage",
    dietaryTags: ["vegan", "caffeine_free"],
    imageUrl: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?q=80&w=800&auto=format&fit=crop",
    isAvailable: true,
    modifiers: [
      { id: "mod_gta_1", name: "Add Ashwagandha Boost", pricePaise: 3000, isAvailable: true },
      { id: "mod_gta_2", name: "Substitute Almond Milk", pricePaise: 4000, isAvailable: true },
    ],
  },
  {
    id: "44444444-4444-4444-4444-444444444405",
    categoryId: "cat_dessert",
    category: "dessert",
    name: "Raw Cacao & Avocado Silk Mousse",
    description: "Single origin Indian cacao, Hass avocado, Medjool date nectar, and toasted hazelnut crumble.",
    pricePaise: 28000,
    station: "dessert",
    dietaryTags: ["vegan", "gluten_free", "sugar_free"],
    imageUrl: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=800&auto=format&fit=crop",
    isAvailable: true,
    modifiers: [
      { id: "mod_rcm_1", name: "Extra Toasted Hazelnuts", pricePaise: 4000, isAvailable: true },
      { id: "mod_rcm_2", name: "Extra Cacao Nibs", pricePaise: 3000, isAvailable: true },
    ],
  },
  {
    id: "44444444-4444-4444-4444-444444444406",
    categoryId: "cat_dessert",
    category: "dessert",
    name: "Cardamom & Rose Chia Pudding",
    description: "Coconut-soaked chia seeds, crushed pistachios, organic rose petal jam, and seasonal berries.",
    pricePaise: 24000,
    station: "dessert",
    dietaryTags: ["vegan", "gluten_free"],
    imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777?q=80&w=800&auto=format&fit=crop",
    isAvailable: true,
    modifiers: [
      { id: "mod_crp_1", name: "Extra Berries", pricePaise: 5000, isAvailable: true },
      { id: "mod_crp_2", name: "Pistachio Crunch", pricePaise: 4000, isAvailable: true },
    ],
  },
];

// In-memory active catalog state
export const activeMenuStore: Map<string, MenuItemRecord> = new Map(
  initialMenuCatalog.map((item) => [item.id, { ...item }])
);

/**
 * Returns all menu items.
 */
export function getAllMenuItems(): MenuItemRecord[] {
  return Array.from(activeMenuStore.values());
}

/**
 * Toggles availability (86) of a menu item or modifier.
 */
export function toggleItemAvailability(itemId: string, modifierId?: string): { success: boolean; isAvailable: boolean } {
  const item = activeMenuStore.get(itemId);
  if (!item) return { success: false, isAvailable: false };

  if (modifierId && item.modifiers) {
    const mod = item.modifiers.find((m) => m.id === modifierId);
    if (mod) {
      mod.isAvailable = !mod.isAvailable;
      return { success: true, isAvailable: mod.isAvailable };
    }
  } else {
    item.isAvailable = !item.isAvailable;
    return { success: true, isAvailable: item.isAvailable };
  }

  return { success: false, isAvailable: false };
}
