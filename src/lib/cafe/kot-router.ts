/**
 * THE AM:PM CAFE - Multi-Station KOT Decomposition & Routing Engine
 * Decomposes order items into station-specific KOT tickets with fast atomic daily counters.
 * Generates structured print_jobs records rendered at send time.
 */

import { createClient } from "@supabase/supabase-js";
import type { StructuredPrintJobData } from "../hardware/escpos.ts";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wdrfrnzyocfkfcecbbuw.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkcmZybnp5b2Nma2ZjZWNiYnV3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTQ3NTc5NywiZXhwIjoyMTA3MDUxNzk3fQ.4cZd3A1KsoBC0db_-5fnQUtUt3wlvf_xn0W0oVkFQ30";

export interface OrderItemRoutingInput {
  menuItemId: string;
  name: string;
  quantity: number;
  station: 'food' | 'beverage' | 'dessert';
  unitPricePaise: number;
  specialInstructions?: string;
  modifiers?: Array<{ name: string; pricePaise: number }>;
}

export interface OrderRoutingInput {
  orderId: string;
  orderNumber: string;
  tableNumber: string;
  items: OrderItemRoutingInput[];
  subtotalPaise?: number;
  cgstPaise?: number;
  sgstPaise?: number;
  serviceChargePaise?: number;
  totalGrossPaise?: number;
  gstin?: string;
  specialInstructions?: string;
}

// In-memory atomic sequence store for testing / offline
const memoryDailyCounters: Map<string, number> = new Map();
export const memoryKotsStore: any[] = [];
export const memoryPrintJobsStore: any[] = [];

/**
 * Gets fast atomic daily sequence for a station (KOT-YYYYMMDD-[F/B/D]-XXXX).
 * Does not use gapless locking.
 */
export async function getNextAtomicKotSequence(station: 'food' | 'beverage' | 'dessert', dateStr?: string): Promise<string> {
  const d = dateStr || new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const stationCode = station === 'food' ? 'F' : station === 'beverage' ? 'B' : 'D';
  const key = `${d}-${station}`;

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const opDate = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase.rpc('get_next_kot_counter', {
      p_op_date: opDate,
      p_station: station,
    });
    if (!error && data) {
      return `KOT-${d}-${stationCode}-${String(data).padStart(4, '0')}`;
    }
  } catch {
    // fallback to memory
  }

  const current = memoryDailyCounters.get(key) || 0;
  const next = current + 1;
  memoryDailyCounters.set(key, next);
  return `KOT-${d}-${stationCode}-${String(next).padStart(4, '0')}`;
}

/**
 * Decomposes an order into station KOTs and creates structured print jobs.
 */
export async function routeOrderToStations(order: OrderRoutingInput): Promise<{
  kots: Array<{ id: string; kotNumber: string; station: 'food' | 'beverage' | 'dessert'; items: any[] }>;
  printJobIds: string[];
}> {
  // 1. Group items by station
  const stationGroups: Record<string, OrderItemRoutingInput[]> = {};
  for (const item of order.items) {
    const st = item.station || 'food';
    if (!stationGroups[st]) stationGroups[st] = [];
    stationGroups[st].push(item);
  }

  const generatedKots: any[] = [];
  const printJobIds: string[] = [];

  for (const [station, items] of Object.entries(stationGroups)) {
    const typedStation = station as 'food' | 'beverage' | 'dessert';
    const kotNumber = await getNextAtomicKotSequence(typedStation);
    const kotId = `kot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const kotRecord = {
      id: kotId,
      orderId: order.orderId,
      kotNumber,
      station: typedStation,
      status: 'pending',
      items,
      createdAt: new Date().toISOString(),
    };

    generatedKots.push(kotRecord);
    memoryKotsStore.push(kotRecord);

    // 2. Structured print job for this station
    const printerTarget = typedStation === 'food' ? 'printer_food' : typedStation === 'beverage' ? 'printer_bev' : 'printer_dessert';
    const structuredData: StructuredPrintJobData = {
      orderNumber: order.orderNumber,
      tableNumber: order.tableNumber,
      kotNumber,
      station: typedStation,
      type: 'kot_ticket',
      createdAt: new Date().toISOString(),
      specialInstructions: order.specialInstructions,
      items: items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        specialInstructions: i.specialInstructions,
        modifiers: i.modifiers?.map((m) => m.name),
      })),
    };

    const printJobId = `pj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const printJob = {
      id: printJobId,
      order_id: order.orderId,
      kot_id: kotId,
      station: typedStation,
      job_type: 'kot_ticket',
      printer_target: printerTarget,
      status: 'queued',
      job_data: structuredData,
      retry_count: 0,
      created_at: new Date().toISOString(),
    };

    printJobIds.push(printJobId);
    memoryPrintJobsStore.push(printJob);
  }

  // 3. Customer Receipt print job (Counter 2-inch thermal printer)
  const receiptJobId = `pj_rcpt_${Date.now()}`;
  const receiptData: StructuredPrintJobData = {
    orderNumber: order.orderNumber,
    tableNumber: order.tableNumber,
    type: 'customer_receipt',
    createdAt: new Date().toISOString(),
    items: order.items.map((i) => ({
      name: i.name,
      quantity: i.quantity,
      unitPricePaise: i.unitPricePaise,
    })),
    subtotalPaise: order.subtotalPaise,
    serviceChargePaise: order.serviceChargePaise,
    cgstPaise: order.cgstPaise,
    sgstPaise: order.sgstPaise,
    totalGrossPaise: order.totalGrossPaise,
    gstin: order.gstin || '27AAAAA0000A1Z5',
  };

  memoryPrintJobsStore.push({
    id: receiptJobId,
    order_id: order.orderId,
    kot_id: null,
    station: null,
    job_type: 'customer_receipt',
    printer_target: 'printer_pos',
    status: 'queued',
    job_data: receiptData,
    retry_count: 0,
    created_at: new Date().toISOString(),
  });
  printJobIds.push(receiptJobId);

  return {
    kots: generatedKots,
    printJobIds,
  };
}
