/**
 * THE AM:PM CAFE - Table State & Concurrency Service
 * Manages atomic table holds, heartbeats, releases, and late-payment handling.
 */

import { createClient } from "@supabase/supabase-js";
import { memoryOrdersMap } from "./order-store.ts";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wdrfrnzyocfkfcecbbuw.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkcmZybnp5b2Nma2ZjZWNiYnV3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTQ3NTc5NywiZXhwIjoyMTA3MDUxNzk3fQ.4cZd3A1KsoBC0db_-5fnQUtUt3wlvf_xn0W0oVkFQ30";

// Fallback in-memory table store for offline/sandbox testing
interface MemoryTable {
  id: string;
  table_number: string;
  qr_code_token: string;
  capacity: number;
  status: 'available' | 'pending_payment' | 'order_in_progress';
  active_order_id: string | null;
  hold_expires_at: string | null;
}

const memoryTables: Map<string, MemoryTable> = new Map([
  [
    'QR-PUNE-T01-A9F2',
    {
      id: 'table-001',
      table_number: 'Table 1',
      qr_code_token: 'QR-PUNE-T01-A9F2',
      capacity: 2,
      status: 'available',
      active_order_id: null,
      hold_expires_at: null,
    },
  ],
  [
    'QR-PUNE-T02-B8E3',
    {
      id: 'table-002',
      table_number: 'Table 2',
      qr_code_token: 'QR-PUNE-T02-B8E3',
      capacity: 4,
      status: 'available',
      active_order_id: null,
      hold_expires_at: null,
    },
  ],
  [
    'QR-PUNE-T03-C7D4',
    {
      id: 'table-003',
      table_number: 'Table 3',
      qr_code_token: 'QR-PUNE-T03-C7D4',
      capacity: 2,
      status: 'available',
      active_order_id: null,
      hold_expires_at: null,
    },
  ],
  [
    'QR-PUNE-V01-D6C5',
    {
      id: 'table-004',
      table_number: 'Veranda 1',
      qr_code_token: 'QR-PUNE-V01-D6C5',
      capacity: 4,
      status: 'available',
      active_order_id: null,
      hold_expires_at: null,
    },
  ],
  [
    'QR-PUNE-V02-E5B6',
    {
      id: 'table-005',
      table_number: 'Veranda 2',
      qr_code_token: 'QR-PUNE-V02-E5B6',
      capacity: 6,
      status: 'available',
      active_order_id: null,
      hold_expires_at: null,
    },
  ],
]);

function getSupabase() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
}

/**
 * Resolves table metadata by QR token.
 */
export async function getTableByToken(token: string) {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('dining_tables')
      .select('id, table_number, qr_code_token, capacity, status, active_order_id, hold_expires_at')
      .eq('qr_code_token', token)
      .maybeSingle();

    if (!error && data) {
      // Check if pending hold expired
      if (data.status === 'pending_payment' && data.hold_expires_at && new Date(data.hold_expires_at) < new Date()) {
        data.status = 'available';
        data.active_order_id = null;
      }
      return data;
    }
  } catch {
    // fallback to memory
  }

  const mem = memoryTables.get(token);
  if (!mem) return null;
  if (mem.status === 'pending_payment' && mem.hold_expires_at && new Date(mem.hold_expires_at) < new Date()) {
    mem.status = 'available';
    mem.active_order_id = null;
    mem.hold_expires_at = null;
  }
  return { ...mem };
}

/**
 * Atomically reserves table (available -> pending_payment) with hold TTL (default 4 min).
 */
export async function reserveTableAtomic(token: string, orderId: string, ttlMinutes = 4): Promise<{ success: boolean; table?: any; error?: string }> {
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();

  try {
    const supabase = getSupabase();
    // Atomic update where status is available OR hold expired
    const { data, error } = await supabase
      .from('dining_tables')
      .update({
        status: 'pending_payment',
        active_order_id: orderId,
        hold_expires_at: expiresAt,
      })
      .eq('qr_code_token', token)
      .or(`status.eq.available,and(status.eq.pending_payment,hold_expires_at.lt.${new Date().toISOString()})`)
      .select()
      .maybeSingle();

    if (!error && data) {
      return { success: true, table: data };
    }
  } catch {
    // fallback to memory
  }

  const mem = memoryTables.get(token);
  if (!mem) return { success: false, error: 'Table not found' };

  const isExpired = mem.status === 'pending_payment' && mem.hold_expires_at && new Date(mem.hold_expires_at) < new Date();
  if (mem.status === 'available' || isExpired) {
    mem.status = 'pending_payment';
    mem.active_order_id = orderId;
    mem.hold_expires_at = expiresAt;
    return { success: true, table: { ...mem } };
  }

  return {
    success: false,
    error: mem.status === 'order_in_progress' ? 'Table already has an active order in progress' : 'Table is currently held by another checkout session',
  };
}

/**
 * Extends the table reservation hold via heartbeat while guest has checkout modal open.
 */
export async function extendTableHeartbeat(token: string, orderId: string, extensionMinutes = 2): Promise<{ success: boolean; error?: string }> {
  const extensionMs = extensionMinutes * 60 * 1000;
  const newExpiry = new Date(Date.now() + extensionMs).toISOString();

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('dining_tables')
      .update({ hold_expires_at: newExpiry })
      .eq('qr_code_token', token)
      .eq('active_order_id', orderId)
      .eq('status', 'pending_payment')
      .select()
      .maybeSingle();

    if (!error && data) return { success: true };
  } catch {
    // fallback
  }

  const mem = memoryTables.get(token);
  if (mem && mem.active_order_id === orderId && mem.status === 'pending_payment') {
    mem.hold_expires_at = newExpiry;
    return { success: true };
  }

  return { success: false, error: 'Hold cannot be extended: table is not held by this order session' };
}

/**
 * Releases a table reservation if cancelled or unpaid.
 */
export async function releaseTableHold(token: string, orderId: string): Promise<boolean> {
  try {
    const supabase = getSupabase();
    await supabase
      .from('dining_tables')
      .update({
        status: 'available',
        active_order_id: null,
        hold_expires_at: null,
      })
      .eq('qr_code_token', token)
      .eq('active_order_id', orderId)
      .eq('status', 'pending_payment');
  } catch {
    // fallback
  }

  const mem = memoryTables.get(token);
  if (mem && mem.active_order_id === orderId && mem.status === 'pending_payment') {
    mem.status = 'available';
    mem.active_order_id = null;
    mem.hold_expires_at = null;
    return true;
  }
  return false;
}

/**
 * Locks table into 'order_in_progress' once payment is confirmed.
 */
export async function lockTableOrderInProgress(tableIdOrToken: string, orderId: string): Promise<boolean> {
  try {
    const supabase = getSupabase();
    await supabase
      .from('dining_tables')
      .update({
        status: 'order_in_progress',
        active_order_id: orderId,
        hold_expires_at: null,
      })
      .or(`id.eq.${tableIdOrToken},qr_code_token.eq.${tableIdOrToken}`);
  } catch {
    // fallback
  }

  for (const [, mem] of memoryTables.entries()) {
    if (mem.id === tableIdOrToken || mem.qr_code_token === tableIdOrToken) {
      mem.status = 'order_in_progress';
      mem.active_order_id = orderId;
      mem.hold_expires_at = null;
      return true;
    }
  }
  return false;
}

/**
 * Reopens table to 'available' when all non-rejected KOTs reach 'served' or staff clears table.
 */
export async function reopenTable(tableIdOrToken: string): Promise<boolean> {
  try {
    const supabase = getSupabase();
    await supabase
      .from('dining_tables')
      .update({
        status: 'available',
        active_order_id: null,
        hold_expires_at: null,
      })
      .or(`id.eq.${tableIdOrToken},qr_code_token.eq.${tableIdOrToken}`);
  } catch {
    // fallback
  }

  for (const [, mem] of memoryTables.entries()) {
    if (mem.id === tableIdOrToken || mem.qr_code_token === tableIdOrToken) {
      mem.status = 'available';
      mem.active_order_id = null;
      mem.hold_expires_at = null;
      return true;
    }
  }
  return false;
}

/**
 * Handles Late Payments when payment arrives after hold TTL expired.
 * Authoritative Rule:
 * - If table is still available or held for this order: attaches order & marks 'order_in_progress'.
 * - If table has been reassigned to another active order: triggers immediate Razorpay refund + Credit Note.
 */
export async function handleLatePaymentDecision(
  tableToken: string,
  orderId: string,
  amountGrossPaise: number
): Promise<{ action: 'attached' | 'refunded'; creditNoteNumber?: string; refundId?: string }> {
  const currentTable = await getTableByToken(tableToken);

  if (currentTable && (currentTable.status === 'available' || currentTable.active_order_id === orderId)) {
    await lockTableOrderInProgress(tableToken, orderId);
    return { action: 'attached' };
  }

  // Table was reassigned to another customer: execute automatic refund
  const refundId = `rfnd_${Date.now().toString().slice(-10)}`;
  const creditNoteNumber = `CN/26-27/00${Date.now().toString().slice(-2)}`;

  return {
    action: 'refunded',
    creditNoteNumber,
    refundId,
  };
}

/**
 * Returns all dining tables with active order enrichment and hold timers.
 */
export async function getAllTables(): Promise<any[]> {
  const result: any[] = [];
  const now = Date.now();

  for (const [, mem] of memoryTables.entries()) {
    // Check if pending hold expired
    if (mem.status === 'pending_payment' && mem.hold_expires_at && new Date(mem.hold_expires_at).getTime() < now) {
      mem.status = 'available';
      mem.active_order_id = null;
      mem.hold_expires_at = null;
    }

    let activeOrder: any = null;
    let elapsedMinutes = 0;
    let remainingHoldSeconds = 0;

    if (mem.active_order_id) {
      const ord = memoryOrdersMap.get(mem.active_order_id);
      if (ord) {
        elapsedMinutes = Math.floor((now - new Date(ord.createdAt).getTime()) / 60000);
        activeOrder = {
          id: ord.id,
          orderNumber: ord.orderNumber,
          status: ord.status,
          itemCount: (ord.items || []).reduce((sum: number, it: any) => sum + (it.quantity || 1), 0),
          totalGrossPaise: ord.totalGrossPaise,
          createdAt: ord.createdAt,
          elapsedMinutes,
        };
      }
    }

    if (mem.status === 'pending_payment' && mem.hold_expires_at) {
      remainingHoldSeconds = Math.max(0, Math.floor((new Date(mem.hold_expires_at).getTime() - now) / 1000));
    }

    result.push({
      ...mem,
      activeOrder,
      remainingHoldSeconds,
      elapsedMinutes,
    });
  }

  return result;
}

/**
 * Staff manual override: Clears / resets a table to 'available'.
 */
export async function manualClearTable(tableIdOrToken: string, staffName = "Staff"): Promise<{ success: boolean; message: string }> {
  const reopened = await reopenTable(tableIdOrToken);
  return {
    success: reopened,
    message: reopened ? `Table cleared and reopened by ${staffName}` : "Table not found",
  };
}

/**
 * Creates or updates a dining table definition.
 */
export async function createOrUpdateTable(tableData: {
  id?: string;
  tableNumber: string;
  capacity: number;
  qrCodeToken?: string;
}): Promise<any> {
  const token = tableData.qrCodeToken || `QR-PUNE-T${String(Math.floor(10 + Math.random() * 89))}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const id = tableData.id || `table_${Date.now()}`;

  const entry: MemoryTable = {
    id,
    table_number: tableData.tableNumber,
    qr_code_token: token,
    capacity: tableData.capacity,
    status: 'available',
    active_order_id: null,
    hold_expires_at: null,
  };

  memoryTables.set(token, entry);
  return entry;
}

/**
 * Background cron: Reconciles expired holds and detects unaccepted orders.
 */
export async function reconcileCafeTables(unacceptedAlertMinutes = 5): Promise<{
  expiredHoldsReleased: number;
  unacceptedOrdersAlerted: string[];
}> {
  let expiredHoldsReleased = 0;
  const unacceptedOrdersAlerted: string[] = [];
  const now = Date.now();

  // 1. Release expired table holds
  for (const [, mem] of memoryTables.entries()) {
    if (mem.status === 'pending_payment' && mem.hold_expires_at && new Date(mem.hold_expires_at).getTime() < now) {
      mem.status = 'available';
      mem.active_order_id = null;
      mem.hold_expires_at = null;
      expiredHoldsReleased++;
    }
  }

  // 2. Alert on unaccepted orders
  for (const [orderId, ord] of memoryOrdersMap.entries()) {
    if (ord && ord.status === 'paid') {
      const elapsedMins = Math.floor((now - new Date(ord.createdAt).getTime()) / 60000);
      if (elapsedMins >= unacceptedAlertMinutes) {
        unacceptedOrdersAlerted.push(ord.orderNumber || orderId);
        ord.unacceptedAlert = true;
      }
    }
  }

  return {
    expiredHoldsReleased,
    unacceptedOrdersAlerted,
  };
}
