/**
 * THE AM:PM CAFE - Per-KOT Prep-Start Recipe Depletion Service
 * Atomically depletes ingredient inventory at the start of preparation (KOT status = 'preparing').
 * Uses prep yield % scaling and moving Weighted Average Cost (WAC).
 */

export interface StockMovementRecord {
  id: string;
  ingredientId: string;
  ingredientName: string;
  movementType: 'purchase' | 'dish_sale_depletion' | 'waste_spoilage' | 'audit_adjustment';
  quantity: number; // negative for depletion
  costPerUnitInr: number;
  balanceAfter: number;
  referenceId: string; // kotId or orderId
  reason: string;
  createdAt: string;
}

// In-memory ingredients & movements store
export interface IngredientStockItem {
  id: string;
  name: string;
  baseUnit: string;
  currentStock: number;
  minimumStockLevel: number;
  movingWacInr: number;
}

export const activeIngredientsStore: Map<string, IngredientStockItem> = new Map([
  ["ing-001", { id: "ing-001", name: "Barista Edition Oat Milk (Oatside)", baseUnit: "ml", currentStock: 36000, minimumStockLevel: 20000, movingWacInr: 0.25 }],
  ["ing-002", { id: "ing-002", name: "Monsooned Malabar AA Coffee Beans", baseUnit: "g", currentStock: 8500, minimumStockLevel: 10000, movingWacInr: 1.25 }],
  ["ing-003", { id: "ing-003", name: "Uji Ceremonial Matcha Powder", baseUnit: "g", currentStock: 2400, minimumStockLevel: 1000, movingWacInr: 7.20 }],
  ["ing-004", { id: "ing-004", name: "Fresh Hass Avocado", baseUnit: "g", currentStock: 12000, minimumStockLevel: 5000, movingWacInr: 0.38 }],
  ["ing-005", { id: "ing-005", name: "Organic Red Quinoa", baseUnit: "g", currentStock: 25000, minimumStockLevel: 10000, movingWacInr: 0.40 }],
  ["ing-007", { id: "ing-007", name: "Roasted Sweet Potato", baseUnit: "g", currentStock: 18000, minimumStockLevel: 8000, movingWacInr: 0.15 }],
  ["ing-008", { id: "ing-008", name: "Charred Organic Broccolini", baseUnit: "g", currentStock: 15000, minimumStockLevel: 6000, movingWacInr: 0.40 }],
  ["ing-009", { id: "ing-009", name: "Shelled Edamame", baseUnit: "g", currentStock: 9500, minimumStockLevel: 4000, movingWacInr: 0.50 }],
  ["ing-010", { id: "ing-010", name: "House Fermented Sourdough Slice", baseUnit: "pcs", currentStock: 48, minimumStockLevel: 20, movingWacInr: 25.0 }],
]);

export const activeMovementsStore: StockMovementRecord[] = [];

// Dish Recipe Mapping
interface RecipeIngredientBOM {
  ingredientId: string;
  name: string;
  quantityPerServing: number;
  yieldPct: number; // e.g. 70 for 70% yield
}

const dishRecipesMap: Record<string, RecipeIngredientBOM[]> = {
  // AM:PM Earth Bowl
  "44444444-4444-4444-4444-444444444401": [
    { ingredientId: "ing-005", name: "Organic Red Quinoa", quantityPerServing: 60, yieldPct: 100 },
    { ingredientId: "ing-007", name: "Roasted Sweet Potato", quantityPerServing: 80, yieldPct: 100 },
    { ingredientId: "ing-008", name: "Charred Organic Broccolini", quantityPerServing: 50, yieldPct: 100 },
    { ingredientId: "ing-009", name: "Shelled Edamame", quantityPerServing: 30, yieldPct: 100 },
  ],
  // Artisan Sourdough Tartine
  "44444444-4444-4444-4444-444444444402": [
    { ingredientId: "ing-010", name: "House Fermented Sourdough Slice", quantityPerServing: 1, yieldPct: 100 },
    { ingredientId: "ing-004", name: "Fresh Hass Avocado", quantityPerServing: 100, yieldPct: 70 }, // 100 / 0.7 = 142.86g raw needed
  ],
  // Ceremonial Uji Matcha Latte
  "44444444-4444-4444-4444-444444444403": [
    { ingredientId: "ing-003", name: "Uji Ceremonial Matcha Powder", quantityPerServing: 4, yieldPct: 100 },
    { ingredientId: "ing-001", name: "Barista Edition Oat Milk (Oatside)", quantityPerServing: 200, yieldPct: 100 },
  ],
};

/**
 * Executes per-KOT recipe stock depletion at preparation start.
 * Does not block sales on negative stock balance.
 */
export function depleteStockForKot(
  kotId: string,
  kotNumber: string,
  station: string,
  items: Array<{
    menuItemId: string;
    name: string;
    quantity: number;
    modifiers?: Array<{ name: string }>;
  }>
): {
  depletedItemsCount: number;
  movementsCount: number;
  missingRecipeFlags: string[];
} {
  let movementsCount = 0;
  const missingRecipeFlags: string[] = [];

  for (const item of items) {
    const recipeBOM = dishRecipesMap[item.menuItemId];

    if (!recipeBOM) {
      // Missing recipe: flag for audit, but never block order flow
      missingRecipeFlags.push(item.name);
      continue;
    }

    for (const ing of recipeBOM) {
      const stockItem = activeIngredientsStore.get(ing.ingredientId);
      if (!stockItem) continue;

      // Yield % scaling formula: OrderQty * (ServingQty / (YieldPct / 100))
      const rawRequiredPerServing = ing.quantityPerServing / (ing.yieldPct / 100);
      const totalRawRequired = Number((rawRequiredPerServing * item.quantity).toFixed(2));

      // Atomic relative stock update (negative stock allowed)
      stockItem.currentStock = Number((stockItem.currentStock - totalRawRequired).toFixed(2));

      // Immutable movement log
      const movement: StockMovementRecord = {
        id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        ingredientId: ing.ingredientId,
        ingredientName: ing.name,
        movementType: "dish_sale_depletion",
        quantity: -totalRawRequired,
        costPerUnitInr: stockItem.movingWacInr,
        balanceAfter: stockItem.currentStock,
        referenceId: kotId,
        reason: `Prep started: ${item.quantity}x ${item.name} (${kotNumber} [${station}])`,
        createdAt: new Date().toISOString(),
      };

      activeMovementsStore.push(movement);
      movementsCount++;
    }
  }

  return {
    depletedItemsCount: items.length,
    movementsCount,
    missingRecipeFlags,
  };
}

/**
 * Logs spoilage / waste if an order is cancelled post-preparation.
 */
export function logPostPrepCancellationWaste(
  kotId: string,
  kotNumber: string,
  dishName: string,
  staffName = "Chef"
): { logged: boolean; reason: string } {
  const reason = `Cancelled post-prep by ${staffName}: Dish ${dishName} on ${kotNumber}`;

  activeMovementsStore.push({
    id: `waste_${Date.now()}`,
    ingredientId: "ing-general",
    ingredientName: dishName,
    movementType: "waste_spoilage",
    quantity: 0,
    costPerUnitInr: 0,
    balanceAfter: 0,
    referenceId: kotId,
    reason,
    createdAt: new Date().toISOString(),
  });

  return { logged: true, reason };
}
