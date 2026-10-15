"use client";

import React, { useState, useEffect } from "react";
import {
  ChefHat,
  Search,
  Filter,
  Plus,
  UtensilsCrossed,
  Layers,
  Sparkles,
  PieChart,
  Percent,
  TrendingUp,
  Clock,
  ChevronRight,
  Info,
  X,
  Scale,
  DollarSign,
  Coffee,
  CheckCircle2,
} from "lucide-react";

interface RecipeIngredientItem {
  id: string;
  ingredient_id: string;
  name: string;
  quantity: number;
  unit: string;
  cost_per_unit_inr: number;
  yield_pct: number;
  effective_cost_inr: number;
  is_sub_recipe?: boolean;
}

interface DishRecipe {
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

interface SubRecipe {
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

export default function AdminRecipesPage() {
  const [activeTab, setActiveTab] = useState<"dishes" | "subrecipes">("dishes");
  const [dishRecipes, setDishRecipes] = useState<DishRecipe[]>([]);
  const [subRecipes, setSubRecipes] = useState<SubRecipe[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedRecipe, setSelectedRecipe] = useState<DishRecipe | null>(null);

  // New Recipe Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDishName, setNewDishName] = useState("");
  const [newCategory, setNewCategory] = useState<"food" | "beverage" | "dessert">("food");
  const [newSellingPrice, setNewSellingPrice] = useState("320");
  const [newPrepInstructions, setNewPrepInstructions] = useState("");
  const [newIngredients, setNewIngredients] = useState<
    { name: string; quantity: string; unit: string; cost_per_unit_inr: string; yield_pct: string }[]
  >([
    { name: "Organic Ingredient A", quantity: "100", unit: "g", cost_per_unit_inr: "0.5", yield_pct: "100" },
    { name: "Organic Ingredient B", quantity: "50", unit: "g", cost_per_unit_inr: "0.8", yield_pct: "90" },
  ]);

  const fetchRecipes = () => {
    setLoading(true);
    fetch("/api/admin/recipes")
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          setDishRecipes(res.dish_recipes);
          setSubRecipes(res.sub_recipes);
          setMetrics(res.metrics);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  const handleAddIngredientRow = () => {
    setNewIngredients([
      ...newIngredients,
      { name: "", quantity: "50", unit: "g", cost_per_unit_inr: "0.5", yield_pct: "100" },
    ]);
  };

  const handleCreateRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      dish_name: newDishName,
      category: newCategory,
      selling_price_inr: Number(newSellingPrice),
      preparation_instructions: newPrepInstructions,
      ingredients: newIngredients.map((ing) => ({
        name: ing.name,
        quantity: Number(ing.quantity),
        unit: ing.unit,
        cost_per_unit_inr: Number(ing.cost_per_unit_inr),
        yield_pct: Number(ing.yield_pct),
      })),
    };

    try {
      const res = await fetch("/api/admin/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        fetchRecipes();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredDishes = dishRecipes.filter((dish) => {
    const matchesSearch = dish.dish_name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === "all" || dish.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-900 text-[11px] font-semibold uppercase tracking-wider border border-amber-200 mb-2">
            <ChefHat className="w-3.5 h-3.5 text-amber-600" />
            Kitchen Recipes & Culinary BOM
          </div>
          <h1 className="text-3xl font-serif text-stone-900">
            Recipes, Sub-Recipes & Food Cost
          </h1>
          <p className="text-xs text-stone-500 font-light mt-1">
            Bill of materials (BOM), ingredient prep yield percentages, portion cost calculations, and menu margin analysis.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 text-stone-50 text-xs font-medium hover:bg-stone-800 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Recipe BOM
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-sm text-xs">
            <span className="text-[10px] text-stone-400 font-mono uppercase block">Active Dish BOMs</span>
            <span className="text-lg font-serif font-medium text-stone-900">
              {metrics.total_recipes} Dishes
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-sm text-xs">
            <span className="text-[10px] text-stone-400 font-mono uppercase block">Kitchen Sub-Recipes</span>
            <span className="text-lg font-serif font-medium text-stone-900">
              {metrics.total_sub_recipes} Batches
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-sm text-xs">
            <span className="text-[10px] text-stone-400 font-mono uppercase block">Average Food Cost</span>
            <span className="text-lg font-mono font-semibold text-stone-800">
              {metrics.average_food_cost_pct}%
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-sm text-xs">
            <span className="text-[10px] text-stone-400 font-mono uppercase block">Average Gross Margin</span>
            <span className="text-lg font-mono font-semibold text-emerald-700">
              {metrics.average_margin_pct}%
            </span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-stone-200 gap-6">
        <button
          onClick={() => setActiveTab("dishes")}
          className={`pb-3 text-xs font-medium transition-all relative ${
            activeTab === "dishes"
              ? "text-stone-900 font-semibold border-b-2 border-stone-900"
              : "text-stone-400 hover:text-stone-600"
          }`}
        >
          Menu Dish Recipes ({dishRecipes.length})
        </button>
        <button
          onClick={() => setActiveTab("subrecipes")}
          className={`pb-3 text-xs font-medium transition-all relative ${
            activeTab === "subrecipes"
              ? "text-stone-900 font-semibold border-b-2 border-stone-900"
              : "text-stone-400 hover:text-stone-600"
          }`}
        >
          Kitchen Prep Sub-Recipes ({subRecipes.length})
        </button>
      </div>

      {/* TAB 1: MENU DISH RECIPES */}
      {activeTab === "dishes" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search recipe dishes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
              {["all", "food", "beverage", "dessert"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setCategoryFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs capitalize font-medium whitespace-nowrap transition-colors ${
                    categoryFilter === tab
                      ? "bg-stone-900 text-stone-100"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDishes.map((dish) => (
              <div
                key={dish.id}
                onClick={() => setSelectedRecipe(dish)}
                className="p-5 rounded-2xl bg-white border border-stone-200/80 hover:border-stone-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="text-base font-serif font-medium text-stone-900">
                        {dish.dish_name}
                      </h3>
                      <p className="text-[11px] text-stone-400 font-mono capitalize">
                        {dish.category} • Prep: {dish.prep_time_minutes}m
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                        dish.food_cost_pct <= 30
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}
                    >
                      {dish.gross_margin_pct}% Margin
                    </span>
                  </div>

                  <div className="space-y-1.5 py-3 border-t border-b border-stone-100 text-xs">
                    <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                      Ingredients BOM ({dish.ingredients.length})
                    </div>
                    {dish.ingredients.slice(0, 3).map((ing) => (
                      <div key={ing.id} className="flex justify-between items-center text-[11px] text-stone-600">
                        <span className="truncate max-w-[180px]">
                          {ing.name} {ing.is_sub_recipe && <span className="text-amber-800 font-medium">(Sub)</span>}
                        </span>
                        <span className="font-mono text-stone-400">
                          {ing.quantity} {ing.unit}
                        </span>
                      </div>
                    ))}
                    {dish.ingredients.length > 3 && (
                      <div className="text-[10px] text-stone-400 italic">
                        +{dish.ingredients.length - 3} additional components...
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-stone-400 block text-[10px]">Selling Price</span>
                    <span className="font-semibold text-stone-900">
                      ₹{dish.selling_price_inr}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-stone-400 block text-[10px]">Portion Cost (BOM)</span>
                    <span className="font-mono font-medium text-stone-700">
                      ₹{dish.portion_cost_inr.toFixed(2)} ({dish.food_cost_pct}%)
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: SUB-RECIPES */}
      {activeTab === "subrecipes" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {subRecipes.map((sub) => (
            <div
              key={sub.id}
              className="p-5 rounded-2xl bg-white border border-stone-200/80 shadow-sm space-y-4"
            >
              <div className="flex items-start justify-between pb-3 border-b border-stone-100">
                <div>
                  <span className="text-[10px] font-mono uppercase text-amber-800 font-medium">
                    Prep Sub-Recipe Batch
                  </span>
                  <h3 className="text-base font-serif font-medium text-stone-900">
                    {sub.name}
                  </h3>
                  <p className="text-xs text-stone-500">
                    Yield: {sub.batch_yield} {sub.unit} • Shelf life: {sub.shelf_life_days} days
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-stone-400 block text-[10px]">Cost / Unit</span>
                  <span className="font-mono font-semibold text-stone-900 text-xs">
                    ₹{sub.cost_per_unit_inr.toFixed(2)}/{sub.unit}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-stone-600">
                <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                  Batch Components (Total: ₹{sub.batch_cost_inr})
                </div>
                {sub.ingredients.map((ing) => (
                  <div key={ing.ingredient_id} className="flex justify-between items-center text-[11px]">
                    <span>{ing.name}</span>
                    <span className="font-mono text-stone-500">
                      {ing.quantity} {ing.unit} (₹{ing.cost_inr})
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-stone-100 text-xs flex items-center justify-between">
                <span className="text-stone-400 text-[11px]">Used in parent dishes:</span>
                <span className="font-medium text-stone-800">
                  {sub.used_in_dishes.join(", ")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DISH BOM DETAIL DRAWER */}
      {selectedRecipe && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl p-6 overflow-y-auto space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-start justify-between pb-4 border-b border-stone-200">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
                    Dish Recipe Bill of Materials
                  </span>
                  <h2 className="text-xl font-serif font-medium text-stone-900">
                    {selectedRecipe.dish_name}
                  </h2>
                  <p className="text-xs text-stone-500 capitalize">
                    {selectedRecipe.category} • Prep time: {selectedRecipe.prep_time_minutes} mins
                  </p>
                </div>
                <button
                  onClick={() => setSelectedRecipe(null)}
                  className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                >
                  ✕
                </button>
              </div>

              {/* Economic Overview */}
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                  <span className="text-stone-400 block text-[10px]">Selling Price</span>
                  <span className="font-semibold text-stone-900">₹{selectedRecipe.selling_price_inr}</span>
                </div>
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                  <span className="text-stone-400 block text-[10px]">Portion Cost</span>
                  <span className="font-semibold text-stone-900">₹{selectedRecipe.portion_cost_inr.toFixed(2)}</span>
                </div>
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                  <span className="text-stone-400 block text-[10px]">Gross Margin</span>
                  <span className="font-semibold text-emerald-700">{selectedRecipe.gross_margin_pct}%</span>
                </div>
              </div>

              {/* Ingredients Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                  Ingredient Breakdown & Yield
                </h4>
                <div className="border border-stone-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 text-[10px] font-mono uppercase">
                      <tr>
                        <th className="p-2.5">Component</th>
                        <th className="p-2.5">Portion</th>
                        <th className="p-2.5">Yield %</th>
                        <th className="p-2.5 text-right">Cost (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {selectedRecipe.ingredients.map((ing) => (
                        <tr key={ing.id} className="hover:bg-stone-50/50">
                          <td className="p-2.5">
                            <span className="font-medium text-stone-800">{ing.name}</span>
                            {ing.is_sub_recipe && (
                              <span className="block text-[10px] text-amber-700 font-medium">
                                Sub-Recipe
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 font-mono text-stone-600">
                            {ing.quantity} {ing.unit}
                          </td>
                          <td className="p-2.5 font-mono text-stone-600">
                            {ing.yield_pct}%
                          </td>
                          <td className="p-2.5 font-mono font-medium text-right text-stone-900">
                            ₹{ing.effective_cost_inr.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                  Kitchen Preparation Standard
                </h4>
                <p className="p-3.5 rounded-xl bg-stone-50 border border-stone-100 text-xs text-stone-700 leading-relaxed">
                  {selectedRecipe.preparation_instructions}
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedRecipe(null)}
              className="w-full py-2.5 rounded-xl bg-stone-900 text-stone-50 text-xs font-medium hover:bg-stone-800 transition-colors"
            >
              Close Recipe BOM
            </button>
          </div>
        </div>
      )}

      {/* CREATE RECIPE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-stone-200">
              <div>
                <h3 className="text-lg font-serif font-medium text-stone-900">
                  Build New Dish Recipe (BOM)
                </h3>
                <p className="text-xs text-stone-500">Define portion ingredients, prep yield % and compute food cost</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRecipe} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-stone-600 mb-1 font-medium">Dish Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Raw Cacao & Avocado Silk Mousse"
                    value={newDishName}
                    onChange={(e) => setNewDishName(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 mb-1 font-medium">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e: any) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                  >
                    <option value="food">Food</option>
                    <option value="beverage">Beverage</option>
                    <option value="dessert">Dessert</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-stone-600 mb-1 font-medium">Selling Price (₹)</label>
                <input
                  type="number"
                  required
                  value={newSellingPrice}
                  onChange={(e) => setNewSellingPrice(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-mono"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-stone-700 uppercase tracking-wider text-[11px]">
                    Ingredients & Prep Yield %
                  </span>
                  <button
                    type="button"
                    onClick={handleAddIngredientRow}
                    className="inline-flex items-center gap-1 text-[11px] text-amber-800 font-medium hover:underline"
                  >
                    <Plus className="w-3 h-3" /> Add Ingredient
                  </button>
                </div>

                {newIngredients.map((ing, idx) => (
                  <div key={idx} className="grid grid-cols-5 gap-2 items-center p-2 rounded-lg bg-stone-50 border border-stone-200">
                    <input
                      type="text"
                      placeholder="Ingredient name"
                      value={ing.name}
                      onChange={(e) => {
                        const copy = [...newIngredients];
                        copy[idx].name = e.target.value;
                        setNewIngredients(copy);
                      }}
                      className="col-span-2 px-2 py-1 bg-white border border-stone-200 rounded text-xs"
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      value={ing.quantity}
                      onChange={(e) => {
                        const copy = [...newIngredients];
                        copy[idx].quantity = e.target.value;
                        setNewIngredients(copy);
                      }}
                      className="px-2 py-1 bg-white border border-stone-200 rounded text-xs font-mono"
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="₹/unit"
                      value={ing.cost_per_unit_inr}
                      onChange={(e) => {
                        const copy = [...newIngredients];
                        copy[idx].cost_per_unit_inr = e.target.value;
                        setNewIngredients(copy);
                      }}
                      className="px-2 py-1 bg-white border border-stone-200 rounded text-xs font-mono"
                    />
                    <input
                      type="number"
                      placeholder="Yield %"
                      value={ing.yield_pct}
                      onChange={(e) => {
                        const copy = [...newIngredients];
                        copy[idx].yield_pct = e.target.value;
                        setNewIngredients(copy);
                      }}
                      className="px-2 py-1 bg-white border border-stone-200 rounded text-xs font-mono"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-stone-600 mb-1">Preparation Instructions</label>
                <textarea
                  rows={2}
                  value={newPrepInstructions}
                  onChange={(e) => setNewPrepInstructions(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-stone-900 text-stone-50 text-xs font-medium hover:bg-stone-800 transition-colors shadow-sm"
                >
                  Save Recipe BOM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
