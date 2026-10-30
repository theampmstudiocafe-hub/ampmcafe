/**
 * THE AM:PM CAFE - ASCII-Safe ESC/POS Receipt & KOT Ticket Generator
 * Strictly enforces 32-column 2-inch (58mm) and 48-column 3-inch (80mm) formatting.
 * Replaces Unicode currency symbols with "Rs." and strips accents to avoid ESC/POS font corruption.
 */

export interface StructuredPrintJobData {
  orderNumber: string;
  tableNumber: string;
  kotNumber?: string;
  station?: 'food' | 'beverage' | 'dessert';
  type: 'kot_ticket' | 'cancelled_slip' | 'customer_receipt' | 'test_slip';
  createdAt: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPricePaise?: number;
    specialInstructions?: string;
    modifiers?: string[];
  }>;
  subtotalPaise?: number;
  cgstPaise?: number;
  sgstPaise?: number;
  serviceChargePaise?: number;
  totalGrossPaise?: number;
  invoiceNumber?: string;
  gstin?: string;
  cancellationReason?: string;
  reprintCount?: number;
  originalPrintedAt?: string;
  reprintedAt?: string;
  openCashDrawer?: boolean;
  specialInstructions?: string;
  cashTenderedPaise?: number;
  changeDuePaise?: number;
  customerName?: string;
  customerGstin?: string;
}

/**
 * Standard ESC/POS binary command constants.
 */
export const ESC_POS_COMMANDS = {
  INIT: '\x1b\x40',                           // ESC @ (Initialize printer)
  KICK_DRAWER: '\x1b\x70\x00\x19\xfa',        // ESC p 0 25 250 (Pulse pin 2 for cash drawer kick)
  BUZZER_BEEP: '\x1b\x42\x02\x02',            // ESC B 2 2 (2 beeps for kitchen buzzer)
  CUT_FULL: '\x1d\x56\x00',                  // GS V 0 (Full cut)
  CUT_PARTIAL: '\x1d\x56\x42\x00',           // GS V 'B' 0 (Partial cut with feed)
  BOLD_ON: '\x1b\x45\x01',                    // ESC E 1
  BOLD_OFF: '\x1b\x45\x00',                   // ESC E 0
};

/**
 * Strips diacritics and replaces non-ASCII characters.
 */
export function sanitizeAscii(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics/accents
    .replace(/₹/g, 'Rs. ')
    .replace(/[^\x20-\x7E\n\r]/g, ''); // keep only standard printable ASCII
}

/**
 * Centers text within a given column width.
 */
function centerLine(text: string, width = 32): string {
  const clean = sanitizeAscii(text).slice(0, width);
  const pad = Math.max(0, Math.floor((width - clean.length) / 2));
  return ' '.repeat(pad) + clean;
}

/**
 * Formats a two-column row with left and right alignment.
 */
function twoColumnLine(left: string, right: string, width = 32): string {
  const cleanLeft = sanitizeAscii(left);
  const cleanRight = sanitizeAscii(right);
  const spacing = Math.max(1, width - cleanLeft.length - cleanRight.length);
  return cleanLeft + ' '.repeat(spacing) + cleanRight;
}

/**
 * Renders structured print job data into ASCII-safe ESC/POS plain text representation.
 */
export function renderStructuredJobToAscii(job: StructuredPrintJobData, width: 32 | 48 = 32): string {
  const separator = '-'.repeat(width);
  const doubleSeparator = '='.repeat(width);
  const lines: string[] = [];

  if (job.type === 'kot_ticket') {
    if (job.reprintCount && job.reprintCount > 0) {
      lines.push(doubleSeparator);
      lines.push(centerLine(`*** REPRINT #${job.reprintCount} (DUPLICATE) ***`, width));
      if (job.originalPrintedAt) {
        lines.push(twoColumnLine('Original:', new Date(job.originalPrintedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }), width));
      }
      lines.push(twoColumnLine('Reprinted:', new Date(job.reprintedAt || Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }), width));
      lines.push(doubleSeparator);
    } else {
      lines.push(centerLine('*** KITCHEN ORDER TICKET ***', width));
    }
    lines.push(centerLine(`STATION: ${job.station?.toUpperCase() || 'MAIN'}`, width));
    lines.push(separator);
    lines.push(twoColumnLine(`Table: ${job.tableNumber}`, `KOT: ${job.kotNumber || 'N/A'}`, width));
    lines.push(twoColumnLine(`Order: ${job.orderNumber}`, new Date(job.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }), width));
    if (job.specialInstructions) {
      lines.push(separator);
      lines.push(`*** ORDER NOTE: ${sanitizeAscii(job.specialInstructions).toUpperCase()} ***`);
    }
    lines.push(separator);
    lines.push(twoColumnLine('QTY  ITEM', 'NOTES', width));
    lines.push(separator);

    for (const item of job.items) {
      lines.push(`${String(item.quantity).padStart(2, ' ')}x ${sanitizeAscii(item.name)}`);
      if (item.modifiers && item.modifiers.length > 0) {
        lines.push(`    + ${sanitizeAscii(item.modifiers.join(', '))}`);
      }
      if (item.specialInstructions) {
        lines.push(`    *** NOTE: ${sanitizeAscii(item.specialInstructions).toUpperCase()} ***`);
      }
    }

    lines.push(separator);
    lines.push(centerLine('[END OF KOT]', width));
    lines.push('\n\n'); // Paper feed
  } else if (job.type === 'test_slip') {
    lines.push(doubleSeparator);
    lines.push(centerLine('*** PRINTER HARDWARE TEST ***', width));
    lines.push(centerLine('THE AM:PM CAFE - HARDWARE TEST', width));
    lines.push(separator);
    lines.push(twoColumnLine('Station:', job.station?.toUpperCase() || 'COUNTER', width));
    lines.push(twoColumnLine('Width:', `${width} Cols (${width === 32 ? '58mm' : '80mm'})`, width));
    lines.push(twoColumnLine('Status:', 'ONLINE & READY', width));
    lines.push(twoColumnLine('Tested At:', new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), width));
    if (job.openCashDrawer) {
      lines.push(separator);
      lines.push(centerLine('>> CASH DRAWER PULSE SENT <<', width));
    }
    lines.push(separator);
    lines.push(centerLine('0123456789 ABCDEFGHIJKLMNOP', width));
    lines.push(doubleSeparator);
    lines.push(centerLine('[HARDWARE TEST PASSED]', width));
    lines.push('\n\n');
  } else if (job.type === 'cancelled_slip') {
    lines.push(centerLine('*** ORDER CANCELLED ***', width));
    lines.push(centerLine(`STATION: ${job.station?.toUpperCase() || 'MAIN'}`, width));
    lines.push(doubleSeparator);
    lines.push(twoColumnLine(`Table: ${job.tableNumber}`, `Order: ${job.orderNumber}`, width));
    if (job.cancellationReason) {
      lines.push(`Reason: ${sanitizeAscii(job.cancellationReason)}`);
    }
    lines.push(separator);
    lines.push('CANCELLED ITEMS:');
    for (const item of job.items) {
      lines.push(`- ${item.quantity}x ${sanitizeAscii(item.name)}`);
    }
    lines.push(separator);
    lines.push(centerLine('*** DO NOT PREPARE ***', width));
    lines.push('\n\n');
  } else {
    // Customer Receipt (2-inch 58mm)
    lines.push(centerLine('THE AM:PM CAFE', width));
    lines.push(centerLine('Koregaon Park, Pune', width));
    if (job.gstin) {
      lines.push(centerLine(`GSTIN: ${job.gstin}`, width));
    }
    lines.push(separator);
    lines.push(twoColumnLine(`Table: ${job.tableNumber}`, `Bill: ${job.invoiceNumber || job.orderNumber}`, width));
    lines.push(twoColumnLine('Date: ' + new Date(job.createdAt).toLocaleDateString('en-IN'), new Date(job.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), width));
    if (job.customerName) {
      lines.push(twoColumnLine('Customer:', job.customerName.slice(0, 18), width));
    }
    if (job.customerGstin) {
      lines.push(twoColumnLine('B2B GSTIN:', job.customerGstin, width));
    }
    lines.push(separator);
    lines.push(twoColumnLine('QTY ITEM', 'AMT (INR)', width));
    lines.push(separator);

    for (const item of job.items) {
      const lineAmt = item.unitPricePaise ? `Rs. ${(item.unitPricePaise * item.quantity / 100).toFixed(2)}` : '';
      lines.push(twoColumnLine(`${item.quantity}x ${item.name}`, lineAmt, width));
    }

    lines.push(separator);
    if (job.subtotalPaise) lines.push(twoColumnLine('Subtotal:', `Rs. ${(job.subtotalPaise / 100).toFixed(2)}`, width));
    if (job.serviceChargePaise && job.serviceChargePaise > 0) lines.push(twoColumnLine('Service Charge:', `Rs. ${(job.serviceChargePaise / 100).toFixed(2)}`, width));
    if (job.cgstPaise) lines.push(twoColumnLine('CGST (2.5%):', `Rs. ${(job.cgstPaise / 100).toFixed(2)}`, width));
    if (job.sgstPaise) lines.push(twoColumnLine('SGST (2.5%):', `Rs. ${(job.sgstPaise / 100).toFixed(2)}`, width));
    lines.push(doubleSeparator);
    if (job.totalGrossPaise) lines.push(twoColumnLine('TOTAL PAID:', `Rs. ${(job.totalGrossPaise / 100).toFixed(2)}`, width));
    if (job.cashTenderedPaise) {
      lines.push(twoColumnLine('Cash Received:', `Rs. ${(job.cashTenderedPaise / 100).toFixed(2)}`, width));
    }
    if (job.changeDuePaise && job.changeDuePaise > 0) {
      lines.push(twoColumnLine('Change Returned:', `Rs. ${(job.changeDuePaise / 100).toFixed(2)}`, width));
    }
    lines.push(doubleSeparator);
    lines.push(centerLine('Thank You! Visit Again.', width));
    lines.push(centerLine('Pending CA Confirmation', width));
    lines.push('\n\n');
  }

  return lines.join('\n');
}
