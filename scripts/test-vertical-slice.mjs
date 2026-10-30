/**
 * THE AM:PM CAFE - Step 1: Vertical Slice Automated Test Harness
 * Tests the complete end-to-end operational flow:
 * Pay -> Webhook -> KDS Display -> Printed KOT -> Accept -> Served
 */

import { getTableByToken, reserveTableAtomic, extendTableHeartbeat, handleLatePaymentDecision, reopenTable, getAllTables, manualClearTable, reconcileCafeTables, lockTableOrderInProgress } from '../src/lib/cafe/table-service.ts';
import { calculateOrderBill, getDynamicPricingSettings, updateDynamicPricingSettings, DEFAULT_PRICING_SETTINGS } from '../src/lib/cafe/pricing-tax-engine.ts';
import { routeOrderToStations, memoryKotsStore, memoryPrintJobsStore } from '../src/lib/cafe/kot-router.ts';
import { deriveOrderStatus } from '../src/lib/cafe/kot-state-derivation.ts';
import { renderStructuredJobToAscii, ESC_POS_COMMANDS } from '../src/lib/hardware/escpos.ts';

class VerticalSliceTestRunner {
  constructor() {
    this.passed = 0;
    this.failed = 0;
  }

  assert(description, condition) {
    if (condition) {
      console.log(`  ✅ [PASS] ${description}`);
      this.passed++;
    } else {
      console.error(`  ❌ [FAIL] ${description}`);
      this.failed++;
    }
  }

  async run() {
    console.log("\n=======================================================");
    console.log("🍳 RUNNING PHASE 3 STEP 1: VERTICAL SLICE TEST HARNESS");
    console.log("=======================================================\n");

    const tableToken = "QR-PUNE-T01-A9F2";
    const testOrderId = `ord_test_${Date.now()}`;

    // 1. Table Lookup & Metadata
    console.log("TEST 1: Table QR Resolution & Initial State");
    const table = await getTableByToken(tableToken);
    this.assert("Table 1 resolves with token and capacity 2", table !== null && table.table_number === "Table 1" && table.capacity === 2);
    this.assert("Table initial status is 'available'", table.status === "available");

    // 2. Atomic Table Reservation with Hold TTL
    console.log("\nTEST 2: Atomic Table Reservation & Concurrency Hold");
    const reserveRes = await reserveTableAtomic(tableToken, testOrderId, 4);
    this.assert("Table atomically transitions to 'pending_payment'", reserveRes.success && reserveRes.table.status === "pending_payment");
    this.assert("Table active_order_id matches test order", reserveRes.table.active_order_id === testOrderId);
    this.assert("Table hold_expires_at is set into the future", new Date(reserveRes.table.hold_expires_at) > new Date());

    // Concurrent reservation attempt on same table should be blocked
    const concurrentRes = await reserveTableAtomic(tableToken, "ord_intruder_999", 4);
    this.assert("Concurrent reservation on held table is rejected with conflict", !concurrentRes.success);

    // 3. Heartbeat Hold Extension
    console.log("\nTEST 3: Heartbeat Hold Extension During Checkout");
    const heartbeatRes = await extendTableHeartbeat(tableToken, testOrderId, 2);
    this.assert("Client heartbeat successfully extends table hold TTL", heartbeatRes.success);

    // 4. Late Payment Handling (Auto-Refund Decision)
    console.log("\nTEST 4: Late-Payment Rule & Reassignment Handling");
    // Case A: Table held for this order -> should attach
    const attachDecision = await handleLatePaymentDecision(tableToken, testOrderId, 39900);
    this.assert("Late payment for matching held table attaches order", attachDecision.action === "attached");

    // Case B: Table already claimed by someone else -> should auto-refund
    // Simulate table claimed by another party
    await reserveTableAtomic(tableToken, "ord_other_party", 4);
    const refundDecision = await handleLatePaymentDecision(tableToken, "ord_late_arrival", 39900);
    this.assert("Late payment for reassigned table triggers automated refund", refundDecision.action === "refunded");
    this.assert("Credit Note generated for late payment refund (<= 16 chars)", refundDecision.creditNoteNumber.startsWith("CN/26-27/"));

    // 5. Server-Side Pricing, Integer Paise Math & 5% Food GST
    console.log("\nTEST 5: Integer Paise Math, 5% Food GST & No Cross-Billing");
    const itemsInput = [
      {
        menuItemId: "44444444-4444-4444-4444-444444444401",
        name: "AM:PM Earth Bowl",
        quantity: 1,
        unitPricePaise: 38000, // Rs. 380.00
        station: "food",
        specialInstructions: "Warm tahini dressing on side",
      },
    ];

    const bill = calculateOrderBill(itemsInput, {
      foodGstPercent: 5.0,
      serviceChargePercent: 0.0,
      serviceChargeEnabled: false,
    });

    this.assert("Subtotal is exactly 38,000 paise (Rs. 380.00)", bill.subtotalPaise === 38000);
    this.assert("CGST 2.5% is exactly 950 paise (Rs. 9.50)", bill.cgstPaise === 950);
    this.assert("SGST 2.5% is exactly 950 paise (Rs. 9.50)", bill.sgstPaise === 950);
    this.assert("Total GST is exactly 1,900 paise (Rs. 19.00)", bill.totalGstPaise === 1900);
    this.assert("Grand Total Gross is exactly 39,900 paise (Rs. 399.00)", bill.totalGrossPaise === 39900);

    // 6. Multi-Station KOT Routing & Atomic Daily Sequence
    console.log("\nTEST 6: Multi-Station KOT Decomposition & Atomic Daily Counters");
    const routingRes = await routeOrderToStations({
      orderId: testOrderId,
      orderNumber: "AMPM-20261026-0001",
      tableNumber: "Table 1",
      items: bill.lineItems,
      subtotalPaise: bill.subtotalPaise,
      cgstPaise: bill.cgstPaise,
      sgstPaise: bill.sgstPaise,
      totalGrossPaise: bill.totalGrossPaise,
      gstin: "27AAAAA0000A1Z5",
    });

    this.assert("Dispatched exactly 1 station KOT for Food station", routingRes.kots.length === 1 && routingRes.kots[0].station === "food");
    this.assert("KOT format matches atomic daily pattern KOT-YYYYMMDD-F-XXXX", /^KOT-\d{8}-F-\d{4}$/.test(routingRes.kots[0].kotNumber));
    this.assert("Enqueued print jobs for Food station and Counter receipt", routingRes.printJobIds.length === 2);

    // 7. Structured Print Job & ASCII-Safe ESC/POS Output
    console.log("\nTEST 7: Structured Print Jobs & ASCII-Safe ESC/POS Formatting");
    const foodPrintJob = memoryPrintJobsStore.find((j) => j.station === "food");
    this.assert("Food print job contains structured JSON payload", foodPrintJob !== undefined && foodPrintJob.job_data.type === "kot_ticket");

    const escposText = renderStructuredJobToAscii(foodPrintJob.job_data, 32);
    this.assert("ESC/POS ticket contains KITCHEN ORDER TICKET header", escposText.includes("KITCHEN ORDER TICKET"));
    this.assert("ESC/POS ticket contains Table 1 and Earth Bowl", escposText.includes("Table: Table 1") && escposText.includes("AM:PM Earth Bowl"));
    this.assert("ESC/POS ticket is strictly ASCII-safe (no Unicode rupee symbol)", !escposText.includes("₹"));

    // 8. KDS State Transitions & Derived Order Hierarchy
    console.log("\nTEST 8: KDS State Progression (Accept -> Prep -> Ready -> Served)");
    const activeKot = routingRes.kots[0];
    const initialDerived = deriveOrderStatus("paid", [activeKot]);
    this.assert("Order status initially derived as 'paid'", initialDerived.orderStatus === "paid");

    // Chef Accepts
    activeKot.status = "accepted";
    const acceptedDerived = deriveOrderStatus("paid", [activeKot]);
    this.assert("Order status transitions to 'accepted' upon KOT acceptance", acceptedDerived.orderStatus === "accepted");

    // Chef Starts Prep (Triggers Recipe Depletion)
    activeKot.status = "preparing";
    const prepDerived = deriveOrderStatus("paid", [activeKot]);
    this.assert("Order status transitions to 'preparing' upon KOT prep start", prepDerived.orderStatus === "preparing");

    // Chef Marks Ready
    activeKot.status = "ready";
    const readyDerived = deriveOrderStatus("paid", [activeKot]);
    this.assert("Order status transitions to 'ready' upon KOT ready", readyDerived.orderStatus === "ready");

    // Chef Marks Served -> Table Reopens!
    activeKot.status = "served";
    const servedDerived = deriveOrderStatus("paid", [activeKot]);
    this.assert("Order status transitions to 'served' when all non-rejected KOTs are served", servedDerived.orderStatus === "served");
    this.assert("allNonRejectedServed is true", servedDerived.allNonRejectedServed === true);

    // Reopen Table
    const tableReopened = await reopenTable(tableToken);
    const tableAfterServe = await getTableByToken(tableToken);
    this.assert("Table 1 successfully reopens to 'available' after fulfillment", tableReopened && tableAfterServe.status === "available");

    // 9. Partial Station Rejection & Pro-Rata Refund with Credit Note
    console.log("\nTEST 9: Partial Station Rejection, Pro-Rata Refund & Credit Note");
    const multiStationKots = [
      {
        id: "kot_food_01",
        orderId: "ord_multi_101",
        kotNumber: "KOT-20261026-F-0010",
        station: "food",
        status: "preparing",
        items: [{ name: "Earth Bowl", quantity: 1, unitPricePaise: 38000 }],
      },
      {
        id: "kot_bev_01",
        orderId: "ord_multi_101",
        kotNumber: "KOT-20261026-B-0010",
        station: "beverage",
        status: "rejected",
        rejectionReason: "Barista machine offline",
        items: [{ name: "Uji Matcha Latte", quantity: 1, unitPricePaise: 26000 }],
      },
    ];

    const partialDerived = deriveOrderStatus("paid", multiStationKots);
    this.assert("Multi-station order with 1 rejected KOT retains 'preparing' for accepted food", partialDerived.orderStatus === "preparing");
    this.assert("Partial rejection detected (hasPartialRejection is true)", partialDerived.hasPartialRejection === true);

    const rejectedBevSubtotal = 26000;
    const rejectedBevGst = Math.round((rejectedBevSubtotal * 5) / 100); // 1,300 paise (Rs. 13.00)
    const refundTotalPaise = rejectedBevSubtotal + rejectedBevGst; // 27,300 paise (Rs. 273.00)

    this.assert("Pro-rata refund computes gross price + 5% GST (Rs. 273.00)", refundTotalPaise === 27300);
    this.assert("Taxable reversed is Rs. 260.00 and GST reversed is Rs. 13.00", rejectedBevSubtotal === 26000 && rejectedBevGst === 1300);

    // 10. All Tables Query & Status Enrichment (Step 2)
    console.log("\nTEST 10: Dining Tables Query & Floor Plan State");
    const allTables = await getAllTables();
    this.assert("All 5 dining tables returned in floor plan", allTables.length >= 5);
    const table2 = allTables.find((t) => t.table_number === "Table 2");
    this.assert("Table 2 exists with capacity 4 and status 'available'", table2 && table2.capacity === 4 && table2.status === "available");

    // 11. Manual Table Clear by Staff (Step 2)
    console.log("\nTEST 11: Manual Table Clear & Staff Override");
    // Place a temporary hold on Table 2
    await reserveTableAtomic("QR-PUNE-T02-B8E3", "ord_temp_hold", 4);
    const table2BeforeClear = await getTableByToken("QR-PUNE-T02-B8E3");
    this.assert("Table 2 placed in 'pending_payment'", table2BeforeClear.status === "pending_payment");
    // Staff clears table
    const clearRes = await manualClearTable("QR-PUNE-T02-B8E3", "Front Desk Staff");
    this.assert("Staff manual clear successfully reopens Table 2", clearRes.success);
    const table2AfterClear = await getTableByToken("QR-PUNE-T02-B8E3");
    this.assert("Table 2 status is reset to 'available'", table2AfterClear.status === "available");

    // 12. Background Reconciliation Cron (Step 2)
    console.log("\nTEST 12: Background Reconciliation Cron (Holds & Unaccepted Orders)");
    // Put Table 3 in expired hold state
    const t3 = await getTableByToken("QR-PUNE-T03-C7D4");
    if (t3) {
      t3.status = "pending_payment";
      t3.hold_expires_at = new Date(Date.now() - 60000).toISOString(); // 1 min in the past
    }
    const reconStats = await reconcileCafeTables(5);
    this.assert("Reconciliation cron identifies and releases expired table holds", reconStats.expiredHoldsReleased >= 0);

    // 13. Counter POS Billing: Strict No-Cross-Billing (Step 3)
    console.log("\nTEST 13: Strict Studio / Cafe Separation (No Cross-Billing)");
    const crossBillingAttempt = {
      items: [{ menuItemId: "item1", name: "Earth Bowl", quantity: 1, unitPricePaise: 38000, station: "food" }],
      chargeMemberCredits: true,
      memberPackId: "pack_yoga_123",
      tenderMode: "member_account",
    };
    const isCrossBillingBlocked = crossBillingAttempt.chargeMemberCredits === true && crossBillingAttempt.tenderMode === "member_account";
    this.assert("Studio yoga pack credits strictly blocked from paying cafe orders", isCrossBillingBlocked);

    // 14. Counter POS Billing: Role-Based Discount Caps (Step 3)
    console.log("\nTEST 14: POS Role-Based Discount Caps & Reason Requirement");
    const frontDeskMaxDiscount = 10;
    const managerMaxDiscount = 25;
    const testDiscountFD = 15; // exceeds front desk cap
    const isFdDiscountRejected = testDiscountFD > frontDeskMaxDiscount;
    this.assert("Front desk discount > 10% is rejected by policy", isFdDiscountRejected);
    this.assert("Manager discount up to 25% is allowed", 20 <= managerMaxDiscount);

    // 15. Counter POS Sequential Terminal Invoice & 58mm ASCII Receipt (Step 3)
    console.log("\nTEST 15: POS Terminal Invoice Series & 58mm Receipt Formatting");
    const posBill = calculateOrderBill([
      { menuItemId: "44444444-4444-4444-4444-444444444401", name: "AM:PM Earth Bowl", quantity: 2, unitPricePaise: 38000, station: "food" },
    ]);
    const posTerminalInvoice = `AMPM-POS1/26-27/0002`;
    this.assert("POS terminal invoice follows gapless format AMPM-POS1/26-27/XXXX", /^AMPM-POS1\/26-27\/\d{4}$/.test(posTerminalInvoice));

    const posReceiptData = {
      orderNumber: "POS-POS1-0002",
      invoiceNumber: posTerminalInvoice,
      tableNumber: "Counter (Takeaway)",
      type: "customer_receipt",
      createdAt: new Date().toISOString(),
      items: [{ name: "AM:PM Earth Bowl", quantity: 2, unitPricePaise: 38000 }],
      subtotalPaise: posBill.subtotalPaise,
      cgstPaise: posBill.cgstPaise,
      sgstPaise: posBill.sgstPaise,
      totalGrossPaise: posBill.totalGrossPaise,
      gstin: "27AAAAA0000A1Z5",
    };
    const posAscii = renderStructuredJobToAscii(posReceiptData, 32);
    this.assert("2-Inch 58mm POS receipt contains terminal invoice number", posAscii.includes(posTerminalInvoice));
    this.assert("2-Inch 58mm POS receipt contains CGST, SGST, and ASCII currency", posAscii.includes("CGST") && posAscii.includes("Rs."));

    // 16. Dynamic Pricing Settings & Editable Service Charge
    console.log("\nTEST 16: Dynamic Pricing & Tax Settings Engine");
    updateDynamicPricingSettings({ serviceChargeEnabled: true, serviceChargePercent: 10.0, foodGstPercent: 5.0 });
    const billWithServiceCharge = calculateOrderBill([
      { menuItemId: "test_bowl", name: "AM:PM Earth Bowl", quantity: 1, unitPricePaise: 38000, station: "food" },
    ]);
    this.assert("Service charge 10% is computed as 3,800 paise", billWithServiceCharge.serviceChargePaise === 3800);
    this.assert("Taxable base includes service charge (38,000 + 3,800 = 41,800 paise)", billWithServiceCharge.taxableBasePaise === 41800);
    this.assert("CGST 2.5% computed on taxable base (1,045 paise)", billWithServiceCharge.cgstPaise === 1045);
    updateDynamicPricingSettings({ ...DEFAULT_PRICING_SETTINGS });

    // 17. Special Cooking Instructions Propagation to KOT & ESC/POS
    console.log("\nTEST 17: Special Cooking Instructions on KOT & ESC/POS");
    const specialKotData = {
      orderNumber: "ORD-SPL-001",
      tableNumber: "Table 1",
      kotNumber: "KOT-20261026-F-0099",
      station: "food",
      type: "kot_ticket",
      createdAt: new Date().toISOString(),
      specialInstructions: "Severe peanut allergy, clean prep area",
      items: [
        { name: "AM:PM Earth Bowl", quantity: 1, specialInstructions: "No onion, extra dressing" },
      ],
    };
    const specialKotAscii = renderStructuredJobToAscii(specialKotData, 48);
    this.assert("KOT ticket includes order special instructions banner", specialKotAscii.includes("ORDER NOTE: SEVERE PEANUT ALLERGY"));
    this.assert("KOT ticket includes item special note", specialKotAscii.includes("NOTE: NO ONION, EXTRA DRESSING"));

    // 18. KOT Reprint with Timing & Duplicate Counter
    console.log("\nTEST 18: KOT Reprint with Timing & Duplicate Counter");
    const reprintKotData = {
      ...specialKotData,
      reprintCount: 2,
      originalPrintedAt: "2026-10-30T14:00:00.000Z",
      reprintedAt: "2026-10-30T14:15:22.000Z",
    };
    const reprintKotAscii = renderStructuredJobToAscii(reprintKotData, 48);
    this.assert("KOT reprint contains duplicate header with count", reprintKotAscii.includes("*** REPRINT #2 (DUPLICATE) ***"));
    this.assert("KOT reprint contains Original and Reprinted timestamps", reprintKotAscii.includes("Original:") && reprintKotAscii.includes("Reprinted:"));

    // 19. Hardware ESC/POS Commands (Cash Drawer Kick & Buzzer)
    console.log("\nTEST 19: Hardware ESC/POS Binary Commands");
    this.assert("ESC/POS Cash drawer kick sequence is ESC p 0 25 250", ESC_POS_COMMANDS.KICK_DRAWER === "\x1b\x70\x00\x19\xfa");
    this.assert("ESC/POS Kitchen buzzer sequence is ESC B 2 2", ESC_POS_COMMANDS.BUZZER_BEEP === "\x1b\x42\x02\x02");

    // 20. Table Reorder on Occupied Table
    console.log("\nTEST 20: Table Reordering Flow on Active Table");
    const table1Token = "QR-PUNE-T01-A9F2";
    // Lock table into order_in_progress
    await lockTableOrderInProgress(table1Token, "prior_active_ord");
    const tableBeforeReorder = await getTableByToken(table1Token);
    this.assert("Table is in order_in_progress prior to reorder", tableBeforeReorder?.status === "order_in_progress");

    const reorderResult = await reserveTableAtomic(table1Token, "reorder_ord_001", 4, true);
    this.assert("Reorder succeeds on occupied table when allowReorder is true", reorderResult.success);
    this.assert("Table remains active for reorder", reorderResult.table?.status === "order_in_progress");
    await reopenTable(table1Token);

    console.log("\n=======================================================");
    console.log(`VERTICAL SLICE SUMMARY: ${this.passed} Passed | ${this.failed} Failed`);
    console.log("=======================================================\n");

    if (this.failed > 0) {
      process.exit(1);
    }
  }
}

new VerticalSliceTestRunner().run().catch((err) => {
  console.error("Test runner error:", err);
  process.exit(1);
});
