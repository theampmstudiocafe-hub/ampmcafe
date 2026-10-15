import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export interface RecipeIngredientItem {
  id: string;
  ingredient_id: string;
  name: string;
  quantity: number;
  unit: string;
  cost_per_unit_inr: number;
  yield_pct: number; // e.g. 70% for avocado after peeling/pitting
  effective_cost_inr: number;
  is_sub_recipe?: boolean;
}

export interface DishRecipe {
  id: string;
  menu_item_id: string;
  dish_name: string;
  category: "food" | "beverage" | "dessert";
  selling_price_inr: number;
  portion_cost_inr: number;
  food_cost_pct: number;
  gross_margin_pct: number;
  yield_servings: number;
  prep_time_minutes: number;
  ingredients: RecipeIngredientItem[];
  preparation_instructions: string;
}

export interface SubRecipe {
  id: string;
  name: string;
  batch_yield: number;
  unit: string;
  batch_cost_inr: number;
  cost_per_unit_inr: number;
  shelf_life_days: number;
  used_in_dishes: string[];
  ingredients: {
    ingredient_id: string;
    name: string;
    quantity: number;
    unit: string;
    cost_inr: number;
  }[];
}

let dishRecipesStore: DishRecipe[] = [
  {
    id: "rec-001",
    menu_item_id: "menu-001",
    dish_name: "AM:PM Earth Bowl",
    category: "food",
    selling_price_inr: 380,
    portion_cost_inr: 92.0,
    food_cost_pct: 24.2,
    gross_margin_pct: 75.8,
    yield_servings: 1,
    prep_time_minutes: 8,
    preparation_instructions: "Layer warm quinoa base, arrange charred broccolini and sweet potato, drizzle with turmeric tahini.",
    ingredients: [
      {
        id: "ri-101",
        ingredient_id: "ing-005",
        name: "Organic Red Quinoa",
        quantity: 60,
        unit: "g",
        cost_per_unit_inr: 0.4,
        yield_pct: 100,
        effective_cost_inr: 24.0,
      },
      {
        id: "ri-102",
        ingredient_id: "ing-007",
        name: "Roasted Sweet Potato",
        quantity: 80,
        unit: "g",
        cost_per_unit_inr: 0.15,
        yield_pct: 100,
        effective_cost_inr: 12.0,
      },
      {
        id: "ri-103",
        ingredient_id: "ing-008",
        name: "Charred Organic Broccolini",
        quantity: 50,
        unit: "g",
        cost_per_unit_inr: 0.4,
        yield_pct: 100,
        effective_cost_inr: 20.0,
      },
      {
        id: "ri-104",
        ingredient_id: "ing-009",
        name: "Shelled Edamame",
        quantity: 30,
        unit: "g",
        cost_per_unit_inr: 0.5,
        yield_pct: 100,
        effective_cost_inr: 15.0,
      },
      {
        id: "ri-105",
        ingredient_id: "sub-001",
        name: "Turmeric Tahini Dressing (Sub-Recipe)",
        quantity: 35,
        unit: "g",
        cost_per_unit_inr: 0.6,
        yield_pct: 100,
        effective_cost_inr: 21.0,
        is_sub_recipe: true,
      },
    ],
  },
  {
    id: "rec-002",
    menu_item_id: "menu-002",
    dish_name: "Artisan Sourdough Tartine",
    category: "food",
    selling_price_inr: 340,
    portion_cost_inr: 99.3,
    food_cost_pct: 29.2,
    gross_margin_pct: 70.8,
    yield_servings: 1,
    prep_time_minutes: 6,
    preparation_instructions: "Toast sourdough slice, mash 100g ripe Hass avocado with cold-pressed chili oil, top with hemp seeds.",
    ingredients: [
      {
        id: "ri-201",
        ingredient_id: "ing-010",
        name: "House Fermented Sourdough Slice",
        quantity: 1,
        unit: "pcs",
        cost_per_unit_inr: 25.0,
        yield_pct: 100,
        effective_cost_inr: 25.0,
      },
      {
        id: "ri-202",
        ingredient_id: "ing-004",
        name: "Fresh Hass Avocado",
        quantity: 100,
        unit: "g",
        cost_per_unit_inr: 0.38,
        yield_pct: 70, // 30% skin & pit wastage -> 100 / 0.70 = 142.8g raw needed
        effective_cost_inr: 54.3,
      },
      {
        id: "ri-203",
        ingredient_id: "ing-011",
        name: "Organic Hemp Seeds",
        quantity: 10,
        unit: "g",
        cost_per_unit_inr: 1.2,
        yield_pct: 100,
        effective_cost_inr: 12.0,
      },
      {
        id: "ri-204",
        ingredient_id: "ing-012",
        name: "Cold-Pressed Chili Oil",
        quantity: 10,
        unit: "ml",
        cost_per_unit_inr: 0.8,
        yield_pct: 100,
        effective_cost_inr: 8.0,
      },
    ],
  },
  {
    id: "rec-003",
    menu_item_id: "menu-003",
    dish_name: "Ceremonial Uji Matcha Latte",
    category: "beverage",
    selling_price_inr: 260,
    portion_cost_inr: 91.8,
    food_cost_pct: 35.3,
    gross_margin_pct: 64.7,
    yield_servings: 1,
    prep_time_minutes: 4,
    preparation_instructions: "Sift 4g ceremonial matcha, whisk with 30ml 80°C water with bamboo chasen, top with steamed oat milk.",
    ingredients: [
      {
        id: "ri-301",
        ingredient_id: "ing-003",
        name: "Uji Ceremonial Matcha Powder",
        quantity: 4,
        unit: "g",
        cost_per_unit_inr: 7.2,
        yield_pct: 100,
        effective_cost_inr: 28.8,
      },
      {
        id: "ri-302",
        ingredient_id: "ing-001",
        name: "Barista Edition Oat Milk (Oatside)",
        quantity: 220,
        unit: "ml",
        cost_per_unit_inr: 0.25,
        yield_pct: 100,
        effective_cost_inr: 55.0,
      },
      {
        id: "ri-303",
        ingredient_id: "ing-013",
        name: "Raw Wild Honey",
        quantity: 10,
        unit: "g",
        cost_per_unit_inr: 0.8,
        yield_pct: 100,
        effective_cost_inr: 8.0,
      },
    ],
  },
];

let subRecipesStore: SubRecipe[] = [
  {
    id: "sub-001",
    name: "Turmeric Tahini Dressing",
    batch_yield: 500,
    unit: "g",
    batch_cost_inr: 300,
    cost_per_unit_inr: 0.6,
    shelf_life_days: 5,
    used_in_dishes: ["AM:PM Earth Bowl"],
    ingredients: [
      { ingredient_id: "ing-tahini", name: "Roasted Sesame Tahini", quantity: 300, unit: "g", cost_inr: 180 },
      { ingredient_id: "ing-lemon", name: "Fresh Squeezed Lemon Juice", quantity: 100, unit: "g", cost_inr: 40 },
      { ingredient_id: "ing-turmeric", name: "Lakadong Turmeric Root", quantity: 30, unit: "g", cost_inr: 30 },
      { ingredient_id: "ing-honey", name: "Wild Honey", quantity: 40, unit: "g", cost_inr: 32 },
      { ingredient_id: "ing-garlic", name: "Garlic & Sea Salt", quantity: 30, unit: "g", cost_inr: 18 },
    ],
  },
];

export async function GET() {
  try {
    const avgFoodCost =
      dishRecipesStore.reduce((acc, d) => acc + d.food_cost_pct, 0) / dishRecipesStore.length;

    return NextResponse.json({
      success: true,
      dish_recipes: dishRecipesStore,
      sub_recipes: subRecipesStore,
      metrics: {
        total_recipes: dishRecipesStore.length,
        total_sub_recipes: subRecipesStore.length,
        average_food_cost_pct: Number(avgFoodCost.toFixed(1)),
        average_margin_pct: Number((100 - avgFoodCost).toFixed(1)),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch recipes" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { dish_name, category, selling_price_inr, ingredients, preparation_instructions } = body;

    if (!dish_name || !selling_price_inr || !ingredients || !Array.isArray(ingredients)) {
      return NextResponse.json(
        { success: false, error: "Dish name, selling price, and ingredients are required" },
        { status: 400 }
      );
    }

    // Calculate effective costs taking yield % into account:
    // Raw qty needed = quantity / (yield_pct / 100)
    // Effective cost = raw qty needed * cost_per_unit
    let totalPortionCost = 0;
    const processedIngredients: RecipeIngredientItem[] = ingredients.map((ing: any, idx: number) => {
      const qty = Number(ing.quantity) || 0;
      const unitCost = Number(ing.cost_per_unit_inr) || 0;
      const yieldPct = Math.max(1, Math.min(100, Number(ing.yield_pct) || 100));
      const rawNeeded = qty / (yieldPct / 100);
      const effectiveCost = Number((rawNeeded * unitCost).toFixed(2));
      totalPortionCost += effectiveCost;

      return {
        id: `ri-${Date.now()}-${idx}`,
        ingredient_id: ing.ingredient_id || `ing-${idx}`,
        name: ing.name || "Ingredient",
        quantity: qty,
        unit: ing.unit || "g",
        cost_per_unit_inr: unitCost,
        yield_pct: yieldPct,
        effective_cost_inr: effectiveCost,
        is_sub_recipe: !!ing.is_sub_recipe,
      };
    });

    const sellingPrice = Number(selling_price_inr);
    const foodCostPct = sellingPrice > 0 ? Number(((totalPortionCost / sellingPrice) * 100).toFixed(1)) : 0;
    const grossMarginPct = Number((100 - foodCostPct).toFixed(1));

    const newRecipe: DishRecipe = {
      id: `rec-${Date.now()}`,
      menu_item_id: `menu-${Date.now()}`,
      dish_name,
      category: category || "food",
      selling_price_inr: sellingPrice,
      portion_cost_inr: Number(totalPortionCost.toFixed(2)),
      food_cost_pct: foodCostPct,
      gross_margin_pct: grossMarginPct,
      yield_servings: 1,
      prep_time_minutes: 8,
      ingredients: processedIngredients,
      preparation_instructions: preparation_instructions || "",
    };

    dishRecipesStore.unshift(newRecipe);

    return NextResponse.json({
      success: true,
      recipe: newRecipe,
      message: `Recipe for '${dish_name}' saved with portion cost ₹${totalPortionCost.toFixed(2)} (${foodCostPct}% food cost)`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create recipe" },
      { status: 500 }
    );
  }
}
