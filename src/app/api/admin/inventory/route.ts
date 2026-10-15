import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export interface IngredientInventoryItem {
  id: string;
  name: string;
  category: "coffee_beverage" | "dry_goods" | "fresh_produce" | "superfoods" | "dairy_alt";
  base_unit: "g" | "ml" | "pcs";
  current_stock: number;
  minimum_stock_level: number;
  reorder_quantity: number;
  cost_per_base_unit_inr: number;
  days_of_supply_threshold_days: number;
  storage_areas: string[];
  total_inventory_value_inr: number;
  status: "optimal" | "low_stock" | "critical";
}

let inventoryStore: IngredientInventoryItem[] = [
  {
    id: "ing-001",
    name: "Barista Edition Oat Milk (Oatside)",
    category: "dairy_alt",
    base_unit: "ml",
    current_stock: 36000, // 36 Liters
    minimum_stock_level: 20000,
    reorder_quantity: 24000,
    cost_per_base_unit_inr: 0.25, // ₹250 per Liter
    days_of_supply_threshold_days: 5,
    storage_areas: ["Barista Bar", "Walk-in Chiller"],
    total_inventory_value_inr: 9000,
    status: "optimal",
  },
  {
    id: "ing-002",
    name: "Monsooned Malabar AA Coffee Beans",
    category: "coffee_beverage",
    base_unit: "g",
    current_stock: 8500, // 8.5 kg
    minimum_stock_level: 10000,
    reorder_quantity: 15000,
    cost_per_base_unit_inr: 1.25, // ₹1,250 per kg
    days_of_supply_threshold_days: 7,
    storage_areas: ["Barista Bar", "Main Kitchen Dry Store"],
    total_inventory_value_inr: 10625,
    status: "low_stock",
  },
  {
    id: "ing-003",
    name: "Uji Ceremonial Matcha Powder",
    category: "superfoods",
    base_unit: "g",
    current_stock: 2400, // 2.4 kg
    minimum_stock_level: 1000,
    reorder_quantity: 3000,
    cost_per_base_unit_inr: 7.2, // ₹7,200 per kg
    days_of_supply_threshold_days: 14,
    storage_areas: ["Barista Bar Chiller", "Main Kitchen Dry Store"],
    total_inventory_value_inr: 17280,
    status: "optimal",
  },
  {
    id: "ing-004",
    name: "Fresh Hass Avocado",
    category: "fresh_produce",
    base_unit: "g",
    current_stock: 3200, // 3.2 kg
    minimum_stock_level: 5000,
    reorder_quantity: 10000,
    cost_per_base_unit_inr: 0.38, // ₹380 per kg
    days_of_supply_threshold_days: 3,
    storage_areas: ["Walk-in Chiller", "Prep Station"],
    total_inventory_value_inr: 1216,
    status: "low_stock",
  },
  {
    id: "ing-005",
    name: "Organic Red Quinoa",
    category: "dry_goods",
    base_unit: "g",
    current_stock: 12500, // 12.5 kg
    minimum_stock_level: 6000,
    reorder_quantity: 10000,
    cost_per_base_unit_inr: 0.4, // ₹400 per kg
    days_of_supply_threshold_days: 10,
    storage_areas: ["Main Kitchen Dry Store"],
    total_inventory_value_inr: 5000,
    status: "optimal",
  },
  {
    id: "ing-006",
    name: "Single Origin Raw Cacao Nibs",
    category: "superfoods",
    base_unit: "g",
    current_stock: 4500, // 4.5 kg
    minimum_stock_level: 3000,
    reorder_quantity: 5000,
    cost_per_base_unit_inr: 0.85, // ₹850 per kg
    days_of_supply_threshold_days: 14,
    storage_areas: ["Main Kitchen Dry Store"],
    total_inventory_value_inr: 3825,
    status: "optimal",
  },
];

export async function GET() {
  try {
    const totalVal = inventoryStore.reduce((acc, it) => acc + it.total_inventory_value_inr, 0);
    const lowStockCount = inventoryStore.filter((it) => it.current_stock <= it.minimum_stock_level).length;

    return NextResponse.json({
      success: true,
      inventory: inventoryStore,
      summary: {
        total_items: inventoryStore.length,
        total_inventory_value_inr: totalVal,
        low_stock_count: lowStockCount,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch inventory" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, minimum_stock_level, days_of_supply_threshold_days, reorder_quantity } = body;

    const itemIndex = inventoryStore.findIndex((i) => i.id === id);
    if (itemIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Ingredient not found" },
        { status: 404 }
      );
    }

    if (minimum_stock_level !== undefined) {
      inventoryStore[itemIndex].minimum_stock_level = Number(minimum_stock_level);
    }
    if (days_of_supply_threshold_days !== undefined) {
      inventoryStore[itemIndex].days_of_supply_threshold_days = Number(days_of_supply_threshold_days);
    }
    if (reorder_quantity !== undefined) {
      inventoryStore[itemIndex].reorder_quantity = Number(reorder_quantity);
    }

    // Recompute status
    const item = inventoryStore[itemIndex];
    item.status = item.current_stock <= item.minimum_stock_level ? "low_stock" : "optimal";

    return NextResponse.json({
      success: true,
      ingredient: item,
      message: "Ingredient thresholds updated successfully",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update ingredient" },
      { status: 500 }
    );
  }
}
