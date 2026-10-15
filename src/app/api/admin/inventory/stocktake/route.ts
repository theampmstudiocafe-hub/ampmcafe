import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export interface AreaCountEntry {
  area: string;
  ingredient_id: string;
  count: number;
  counted_at: string;
  counted_by?: string;
}

export interface StocktakeSession {
  id: string;
  started_at: string;
  status: "in_progress" | "reconciled";
  expected_balances: Record<string, number>; // captured at count time: ingredient_id -> balance
  area_counts: AreaCountEntry[];
  variance_summary?: {
    ingredient_id: string;
    ingredient_name: string;
    base_unit: string;
    expected: number;
    counted_total: number;
    variance: number;
    variance_pct: number;
    cost_impact_inr: number;
  }[];
}

// Active session state
let activeStocktakeSession: StocktakeSession = {
  id: "stk-session-2026-10-15",
  started_at: new Date().toISOString(),
  status: "in_progress",
  expected_balances: {
    "ing-001": 36000,
    "ing-002": 8500,
    "ing-003": 2400,
    "ing-004": 3200,
    "ing-005": 12500,
    "ing-006": 4500,
  },
  area_counts: [
    {
      area: "Barista Bar",
      ingredient_id: "ing-001",
      count: 12000, // 12 Liters at Barista Bar
      counted_at: "2026-10-15T09:00:00Z",
    },
    {
      area: "Walk-in Chiller",
      ingredient_id: "ing-001",
      count: 24000, // 24 Liters in Chiller (Total: 36,000ml -> 0 variance)
      counted_at: "2026-10-15T09:10:00Z",
    },
    {
      area: "Barista Bar",
      ingredient_id: "ing-002",
      count: 2500, // 2.5 kg at Bar
      counted_at: "2026-10-15T09:05:00Z",
    },
    {
      area: "Main Kitchen Dry Store",
      ingredient_id: "ing-002",
      count: 5800, // 5.8 kg in Dry Store (Total: 8,300g vs expected 8,500g -> -200g variance)
      counted_at: "2026-10-15T09:15:00Z",
    },
  ],
};

const ingredientNames: Record<string, { name: string; unit: string; cost: number }> = {
  "ing-001": { name: "Barista Edition Oat Milk (Oatside)", unit: "ml", cost: 0.25 },
  "ing-002": { name: "Monsooned Malabar AA Coffee Beans", unit: "g", cost: 1.25 },
  "ing-003": { name: "Uji Ceremonial Matcha Powder", unit: "g", cost: 7.2 },
  "ing-004": { name: "Fresh Hass Avocado", unit: "g", cost: 0.38 },
  "ing-005": { name: "Organic Red Quinoa", unit: "g", cost: 0.4 },
  "ing-006": { name: "Single Origin Raw Cacao Nibs", unit: "g", cost: 0.85 },
};

export async function GET() {
  try {
    // Compute current aggregated counts per ingredient across all storage areas
    const aggregatedCounts: Record<string, number> = {};
    activeStocktakeSession.area_counts.forEach((entry) => {
      aggregatedCounts[entry.ingredient_id] =
        (aggregatedCounts[entry.ingredient_id] || 0) + Number(entry.count);
    });

    // Compute live variance table
    const varianceSummary = Object.keys(activeStocktakeSession.expected_balances).map((ingId) => {
      const meta = ingredientNames[ingId] || { name: ingId, unit: "units", cost: 1 };
      const expected = activeStocktakeSession.expected_balances[ingId] || 0;
      const counted = aggregatedCounts[ingId] ?? expected; // if not counted yet, default to expected
      const variance = counted - expected;
      const variancePct = expected > 0 ? (variance / expected) * 100 : 0;
      const costImpact = variance * meta.cost;

      return {
        ingredient_id: ingId,
        ingredient_name: meta.name,
        base_unit: meta.unit,
        expected,
        counted_total: counted,
        variance,
        variance_pct: Number(variancePct.toFixed(1)),
        wac_unit_cost_inr: meta.cost,
        cost_impact_inr: Number(costImpact.toFixed(2)),
        valuation_method: "Weighted Average Cost (WAC)",
      };
    });

    return NextResponse.json({
      success: true,
      session: {
        ...activeStocktakeSession,
        valuation_method: "Weighted Average Cost (WAC)",
        valuation_rule: "Variance cost impact is strictly calculated as Variance (base units) * Weighted Average Cost (WAC).",
        variance_summary: varianceSummary,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch stocktake session" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { area, counts, client_mutation_id } = body;

    if (!area || !counts || !Array.isArray(counts)) {
      return NextResponse.json(
        { success: false, error: "Storage area and count entries are required" },
        { status: 400 }
      );
    }

    const timestamp = new Date().toISOString();

    // Check for duplicate repeat counts of the SAME storage area (Amendment 3 rule)
    // Counts for DIFFERENT areas sum; only repeat counts of the SAME area overwrite/conflict
    counts.forEach((item: { ingredient_id: string; count: number }) => {
      const existingIdx = activeStocktakeSession.area_counts.findIndex(
        (e) => e.area === area && e.ingredient_id === item.ingredient_id
      );

      if (existingIdx !== -1) {
        // Update / overwrite repeat count for the same area
        activeStocktakeSession.area_counts[existingIdx] = {
          area,
          ingredient_id: item.ingredient_id,
          count: Number(item.count),
          counted_at: timestamp,
        };
      } else {
        // Additive count for this area
        activeStocktakeSession.area_counts.push({
          area,
          ingredient_id: item.ingredient_id,
          count: Number(item.count),
          counted_at: timestamp,
        });
      }
    });

    return NextResponse.json({
      success: true,
      client_mutation_id,
      message: `Recorded ${counts.length} item counts for storage area '${area}'. Area sums updated.`,
      area_counts_total: activeStocktakeSession.area_counts.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to record stocktake count" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    // Reconcile and post stock adjustments
    const aggregatedCounts: Record<string, number> = {};
    activeStocktakeSession.area_counts.forEach((entry) => {
      aggregatedCounts[entry.ingredient_id] =
        (aggregatedCounts[entry.ingredient_id] || 0) + Number(entry.count);
    });

    const adjustments = Object.keys(activeStocktakeSession.expected_balances).map((ingId) => {
      const expected = activeStocktakeSession.expected_balances[ingId];
      const counted = aggregatedCounts[ingId] ?? expected;
      const variance = counted - expected;

      return {
        ingredient_id: ingId,
        movement_type: "audit_adjustment",
        quantity: variance, // positive if surplus, negative if shrinkage
        expected_balance: expected,
        actual_balance: counted,
        reason: `Physical stocktake audit reconciliation session ${activeStocktakeSession.id}`,
      };
    });

    activeStocktakeSession.status = "reconciled";

    return NextResponse.json({
      success: true,
      message: "Stocktake reconciled and audit_adjustment stock movements posted successfully",
      adjustments,
      reconciled_at: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to reconcile stocktake" },
      { status: 500 }
    );
  }
}
