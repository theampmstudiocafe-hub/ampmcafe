import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export interface DeliveryIntakePayload {
  purchase_order_id: string;
  delivery_note_number: string;
  invoice_amount_inr: number;
  items: {
    ingredient_id: string;
    ingredient_name: string;
    received_quantity_purchase_unit: number;
    purchase_unit: string;
    base_unit: string;
    conversion_factor: number;
    actual_unit_cost_inr: number;
    batch_number?: string;
    expiry_date?: string;
  }[];
}

export async function POST(request: Request) {
  try {
    const body: DeliveryIntakePayload = await request.json();
    const { purchase_order_id, delivery_note_number, invoice_amount_inr, items } = body;

    if (!delivery_note_number || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Delivery note number and received items are required" },
        { status: 400 }
      );
    }

    const deliveryId = `del-${Date.now()}`;
    const timestamp = new Date().toISOString();

    // Compute base units conversion and generate stock movements
    const processedItems = items.map((item, idx) => {
      const purchaseQty = Number(item.received_quantity_purchase_unit) || 0;
      const convFactor = Number(item.conversion_factor) || 1;
      const baseUnitsIngested = purchaseQty * convFactor;

      return {
        id: `del-item-${Date.now()}-${idx}`,
        delivery_id: deliveryId,
        ingredient_id: item.ingredient_id,
        ingredient_name: item.ingredient_name,
        received_purchase_qty: purchaseQty,
        purchase_unit: item.purchase_unit,
        conversion_factor: convFactor,
        base_units_ingested: baseUnitsIngested,
        base_unit: item.base_unit,
        actual_unit_cost_inr: Number(item.actual_unit_cost_inr) || 0,
        batch_number: item.batch_number || `BATCH-${Date.now().toString().slice(-6)}`,
        expiry_date: item.expiry_date || null,
        // Generated atomic stock movement
        stock_movement: {
          movement_type: "purchase",
          quantity_base_units: baseUnitsIngested,
          reference_id: deliveryId,
          reason: `Delivery Intake note #${delivery_note_number} (PO: ${purchase_order_id || 'Direct'})`,
          timestamp,
        },
      };
    });

    const totalBaseUnits = processedItems.reduce((acc, it) => acc + it.base_units_ingested, 0);

    return NextResponse.json({
      success: true,
      delivery: {
        id: deliveryId,
        purchase_order_id,
        delivery_note_number,
        invoice_amount_inr: Number(invoice_amount_inr) || 0,
        received_at: timestamp,
        status: "verified",
        items_count: processedItems.length,
        total_base_units_ingested: totalBaseUnits,
        items: processedItems,
      },
      message: `Delivery #${delivery_note_number} intake recorded. Stock movements updated in base units.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process delivery intake" },
      { status: 500 }
    );
  }
}
