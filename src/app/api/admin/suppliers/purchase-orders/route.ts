import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export interface POItem {
  id: string;
  ingredient_id: string;
  ingredient_name: string;
  ordered_quantity: number;
  purchase_unit: string; // e.g. "5 kg bag", "1 L bottle", "25 kg sack"
  base_unit: string;     // e.g. "g", "ml", "pcs"
  conversion_factor: number; // e.g. 5000 (1 bag = 5000g)
  agreed_unit_cost_inr: number;
  total_cost_inr: number;
  received_quantity: number;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  supplier_name: string;
  status: "draft" | "ordered" | "partially_received" | "received" | "cancelled";
  total_estimated_cost_inr: number;
  ordered_at: string | null;
  expected_delivery_at: string;
  created_at: string;
  items: POItem[];
  notes?: string;
}

// In-memory / initial purchase orders for THE AM:PM STUDIO operations
let purchaseOrdersStore: PurchaseOrder[] = [
  {
    id: "po-001",
    po_number: "PO-2026-0042",
    supplier_id: "sup-003",
    supplier_name: "Deccan Roasters & Oatworks",
    status: "ordered",
    total_estimated_cost_inr: 18500,
    ordered_at: "2026-10-13T10:00:00Z",
    expected_delivery_at: "2026-10-16",
    created_at: "2026-10-13T09:30:00Z",
    notes: "Weekly specialty single-origin roast and organic barista oat milk delivery",
    items: [
      {
        id: "poi-101",
        ingredient_id: "ing-001",
        ingredient_name: "Barista Edition Oat Milk (Oatside)",
        ordered_quantity: 24,
        purchase_unit: "1 L carton",
        base_unit: "ml",
        conversion_factor: 1000,
        agreed_unit_cost_inr: 250,
        total_cost_inr: 6000,
        received_quantity: 0,
      },
      {
        id: "poi-102",
        ingredient_id: "ing-002",
        ingredient_name: "Monsooned Malabar AA Coffee Beans",
        ordered_quantity: 10,
        purchase_unit: "1 kg bag",
        base_unit: "g",
        conversion_factor: 1000,
        agreed_unit_cost_inr: 1250,
        total_cost_inr: 12500,
        received_quantity: 0,
      },
    ],
  },
  {
    id: "po-002",
    po_number: "PO-2026-0043",
    supplier_id: "sup-002",
    supplier_name: "Kyoto Botanicals India",
    status: "received",
    total_estimated_cost_inr: 21600,
    ordered_at: "2026-10-10T11:15:00Z",
    expected_delivery_at: "2026-10-14",
    created_at: "2026-10-10T10:45:00Z",
    notes: "First harvest ceremonial grade matcha from Uji, Kyoto",
    items: [
      {
        id: "poi-201",
        ingredient_id: "ing-003",
        ingredient_name: "Uji Ceremonial Matcha Powder",
        ordered_quantity: 3,
        purchase_unit: "1 kg tin",
        base_unit: "g",
        conversion_factor: 1000,
        agreed_unit_cost_inr: 7200,
        total_cost_inr: 21600,
        received_quantity: 3,
      },
    ],
  },
  {
    id: "po-003",
    po_number: "PO-2026-0044",
    supplier_id: "sup-001",
    supplier_name: "Sahyadri Bio-Farms & Dairy",
    status: "draft",
    total_estimated_cost_inr: 8900,
    ordered_at: null,
    expected_delivery_at: "2026-10-17",
    created_at: "2026-10-15T08:00:00Z",
    notes: "Organic Hass avocados, broccolini, and red quinoa",
    items: [
      {
        id: "poi-301",
        ingredient_id: "ing-004",
        ingredient_name: "Fresh Hass Avocado",
        ordered_quantity: 15,
        purchase_unit: "1 kg crate",
        base_unit: "g",
        conversion_factor: 1000,
        agreed_unit_cost_inr: 380,
        total_cost_inr: 5700,
        received_quantity: 0,
      },
      {
        id: "poi-302",
        ingredient_id: "ing-005",
        ingredient_name: "Organic Red Quinoa",
        ordered_quantity: 8,
        purchase_unit: "1 kg pack",
        base_unit: "g",
        conversion_factor: 1000,
        agreed_unit_cost_inr: 400,
        total_cost_inr: 3200,
        received_quantity: 0,
      },
    ],
  },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let filtered = purchaseOrdersStore;
    if (status && status !== "all") {
      filtered = filtered.filter((po) => po.status === status);
    }

    return NextResponse.json({
      success: true,
      purchase_orders: filtered,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch purchase orders" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { supplier_id, supplier_name, items, expected_delivery_at, notes } = body;

    if (!supplier_id || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Supplier ID and at least one line item are required" },
        { status: 400 }
      );
    }

    // Auto-generate PO sequence number: PO-2026-XXXX
    const nextSeq = purchaseOrdersStore.length + 45;
    const po_number = `PO-2026-${String(nextSeq).padStart(4, "0")}`;

    const lineItems: POItem[] = items.map((item: any, idx: number) => {
      const orderedQty = Number(item.ordered_quantity) || 1;
      const unitCost = Number(item.agreed_unit_cost_inr) || 0;
      const convFactor = Number(item.conversion_factor) || 1;

      return {
        id: `poi-${Date.now()}-${idx}`,
        ingredient_id: item.ingredient_id || `ing-${idx}`,
        ingredient_name: item.ingredient_name || "Ingredient Item",
        ordered_quantity: orderedQty,
        purchase_unit: item.purchase_unit || "unit",
        base_unit: item.base_unit || "g",
        conversion_factor: convFactor,
        agreed_unit_cost_inr: unitCost,
        total_cost_inr: orderedQty * unitCost,
        received_quantity: 0,
      };
    });

    const totalEstimatedCost = lineItems.reduce((acc, it) => acc + it.total_cost_inr, 0);

    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      po_number,
      supplier_id,
      supplier_name: supplier_name || "Selected Supplier",
      status: "ordered",
      total_estimated_cost_inr: totalEstimatedCost,
      ordered_at: new Date().toISOString(),
      expected_delivery_at: expected_delivery_at || new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
      created_at: new Date().toISOString(),
      items: lineItems,
      notes: notes || "",
    };

    purchaseOrdersStore.unshift(newPO);

    return NextResponse.json({
      success: true,
      purchase_order: newPO,
      message: `Purchase order ${po_number} created and transmitted successfully`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create purchase order" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    const poIndex = purchaseOrdersStore.findIndex((p) => p.id === id);
    if (poIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Purchase order not found" },
        { status: 404 }
      );
    }

    purchaseOrdersStore[poIndex].status = status;
    return NextResponse.json({
      success: true,
      purchase_order: purchaseOrdersStore[poIndex],
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update purchase order" },
      { status: 500 }
    );
  }
}
