"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Banknote,
  QrCode,
  Printer,
  Trash2,
  Plus,
  Minus,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  UtensilsCrossed,
  Layers,
  Sparkles,
  ShoppingBag,
  Percent,
  Lock,
} from "lucide-react";
import { renderStructuredJobToAscii, StructuredPrintJobData } from "@/lib/hardware/escpos";

interface CartItem {
  id: string;
  name: string;
  pricePaise: number;
  quantity: number;
  station: "food" | "beverage" | "dessert";
  dietaryTags?: string[];
  specialInstructions?: string;
}

export default function CounterPosPage() {
  const [categories, setCategories] = useState<string[]>(["All", "food", "beverage", "dessert"]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<"takeaway" | "dine_in" | "bar_counter">("takeaway");
  const [tables, setTables] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [tenderMode, setTenderMode] = useState<"cash" | "card_swipe" | "counter_upi_qr">("cash");
  const [upiUtr, setUpiUtr] = useState("");
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState("");
  const [userRole, setUserRole] = useState<"front_desk" | "manager" | "owner">("front_desk");
  const [invoicingMode, setInvoicingMode] = useState<"per_terminal_series" | "provisional_slip">("per_terminal_series");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any>(null);
  const [receiptAscii, setReceiptAscii] = useState<string | null>(null);

  // Seed Menu Catalog
  const catalog = [
    {
      id: "44444444-4444-4444-4444-444444444401",
      name: "AM:PM Earth Bowl",
      category: "food",
      pricePaise: 38000,
      station: "food" as const,
      dietaryTags: ["vegan", "gluten_free"],
    },
    {
      id: "44444444-4444-4444-4444-444444444402",
      name: "Artisan Sourdough Tartine",
      category: "food",
      pricePaise: 34000,
      station: "food" as const,
      dietaryTags: ["vegan"],
    },
    {
      id: "44444444-4444-4444-4444-444444444403",
      name: "Ceremonial Uji Matcha Latte",
      category: "beverage",
      pricePaise: 26000,
      station: "beverage" as const,
      dietaryTags: ["organic", "dairy_free"],
    },
    {
      id: "44444444-4444-4444-4444-444444444404",
      name: "Golden Turmeric Ashwagandha Elixir",
      category: "beverage",
      pricePaise: 22000,
      station: "beverage" as const,
      dietaryTags: ["vegan", "caffeine_free"],
    },
    {
      id: "44444444-4444-4444-4444-444444444405",
      name: "Raw Cacao & Avocado Silk Mousse",
      category: "dessert",
      pricePaise: 28000,
      station: "dessert" as const,
      dietaryTags: ["vegan", "gluten_free", "sugar_free"],
    },
    {
      id: "44444444-4444-4444-4444-444444444406",
      name: "Cardamom & Rose Chia Pudding",
      category: "dessert",
      pricePaise: 24000,
      station: "dessert" as const,
      dietaryTags: ["vegan", "gluten_free"],
    },
  ];

  // Fetch available tables
  useEffect(() => {
    async function loadTables() {
      try {
        const res = await fetch("/api/admin/tables");
        const data = await res.json();
        if (data.success) {
          setTables(data.tables || []);
          const available = (data.tables || []).filter((t: any) => t.status === "available");
          if (available.length > 0) {
            setSelectedTable(available[0]);
          }
        }
      } catch (e) {
        console.warn("Failed to load tables in POS", e);
      }
    }
    loadTables();
  }, []);

  // Filter Catalog
  const filteredCatalog = catalog.filter((item) => {
    const matchesCat = activeCategory === "All" || item.category === activeCategory;
    const matchesQuery = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  // Cart operations
  function addToCart(item: any) {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }

  function updateQuantity(id: string, delta: number) {
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  }

  function clearCart() {
    setCart([]);
    setDiscountPercent(0);
    setDiscountReason("");
  }

  // Calculations
  const rawSubtotalPaise = cart.reduce((sum, item) => sum + item.pricePaise * item.quantity, 0);
  const discountPaise = discountPercent > 0 ? Math.round((rawSubtotalPaise * discountPercent) / 100) : 0;
  const taxableSubtotalPaise = rawSubtotalPaise - discountPaise;
  const cgstPaise = Math.round((taxableSubtotalPaise * 2.5) / 100);
  const sgstPaise = Math.round((taxableSubtotalPaise * 2.5) / 100);
  const totalGrossPaise = taxableSubtotalPaise + cgstPaise + sgstPaise;

  const formatInr = (paise: number) => `₹${(paise / 100).toFixed(2)}`;

  // Submit Order & Print
  async function handleCheckout() {
    if (cart.length === 0) return;

    if (discountPercent > 0 && (!discountReason || discountReason.trim().length < 5)) {
      alert("A mandatory audit reason of at least 5 characters is required for any discount.");
      return;
    }

    if (orderType === "dine_in" && !selectedTable) {
      alert("Please select an available dining table.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/pos/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ampm-role": userRole,
          "x-ampm-user": "Front Desk Cashier",
        },
        body: JSON.stringify({
          terminalId: "POS1",
          orderType,
          tableNumber: orderType === "dine_in" ? selectedTable.table_number : null,
          tableToken: orderType === "dine_in" ? selectedTable.qr_code_token : null,
          items: cart.map((i) => ({
            menuItemId: i.id,
            name: i.name,
            quantity: i.quantity,
            unitPricePaise: i.pricePaise,
            station: i.station,
          })),
          tenderMode,
          upiUtrReference: upiUtr || null,
          discountPercent,
          discountReason,
          invoicingMode,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCompletedOrder(data.order);

        // Generate ASCII-safe 2-inch (58mm) receipt
        const receiptData: StructuredPrintJobData = {
          orderNumber: data.order.orderNumber,
          invoiceNumber: data.order.invoiceNumber,
          tableNumber: data.order.tableNumber,
          type: "customer_receipt",
          createdAt: new Date().toISOString(),
          items: cart.map((c) => ({
            name: c.name,
            quantity: c.quantity,
            unitPricePaise: c.pricePaise,
          })),
          subtotalPaise: taxableSubtotalPaise,
          cgstPaise,
          sgstPaise,
          totalGrossPaise,
          gstin: "27AAAAA0000A1Z5",
        };

        const ascii = renderStructuredJobToAscii(receiptData, 32);
        setReceiptAscii(ascii);
        clearCart();
      } else {
        alert(data.error || "Billing failed");
      }
    } catch (e: any) {
      alert(e.message || "Network error");
    } finally {
      setIsSubmitting(false);
    }
  }

  // 1-Click Browser Print for 2-inch thermal
  function handleBrowserPrint() {
    if (!receiptAscii) return;
    const printWindow = window.open("", "_blank", "width=320,height=600");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt Print</title>
            <style>
              @page { size: 58mm auto; margin: 0; }
              body { font-family: monospace; font-size: 11px; margin: 5px; white-space: pre-wrap; line-height: 1.2; }
            </style>
          </head>
          <body>
            ${receiptAscii}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-stone-100 overflow-hidden text-stone-900">
      {/* Left 65%: Fast Touch Menu Grid */}
      <div className="flex-1 flex flex-col h-full border-r border-stone-200 overflow-hidden">
        {/* Top Control Bar */}
        <div className="p-4 bg-white border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-stone-900 text-amber-400 font-mono font-bold text-xs">
              TERMINAL POS1
            </span>
            <span className="text-xs text-stone-500 font-medium hidden sm:inline">
              Pune Studio & Café Front Desk
            </span>
          </div>

          {/* Role & Invoicing Mode Selector */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl text-xs">
              <span className="text-[10px] text-stone-500 font-semibold uppercase px-1">Role:</span>
              {(["front_desk", "manager", "owner"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setUserRole(r)}
                  className={`px-2 py-0.5 rounded-lg font-semibold capitalize transition ${
                    userRole === r ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"
                  }`}
                >
                  {r.replace("_", " ")}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl text-xs hidden md:flex">
              <span className="text-[10px] text-stone-500 font-semibold uppercase px-1">Series:</span>
              <button
                onClick={() => setInvoicingMode("per_terminal_series")}
                className={`px-2 py-0.5 rounded-lg font-semibold transition ${
                  invoicingMode === "per_terminal_series" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"
                }`}
                title="Option 1: Autonomous per-terminal sequential series (Pending CA)"
              >
                POS1 Series
              </button>
              <button
                onClick={() => setInvoicingMode("provisional_slip")}
                className={`px-2 py-0.5 rounded-lg font-semibold transition ${
                  invoicingMode === "provisional_slip" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"
                }`}
                title="Option 2: Provisional slips with cloud counter on reconnect (Pending CA)"
              >
                Provisional
              </button>
            </div>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="p-4 bg-white border-b border-stone-200 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items by name..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-stone-100 border border-stone-200 text-xs focus:outline-none focus:bg-white focus:border-amber-600"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  activeCategory === cat
                    ? "bg-amber-600 text-white shadow-sm"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                {cat === "All"
                  ? "All Dishes"
                  : cat === "food"
                  ? "Nourish Bowls"
                  : cat === "beverage"
                  ? "Elixirs & Beverages"
                  : "Guilt-Free Desserts"}
              </button>
            ))}
          </div>
        </div>

        {/* Product Touch Grid */}
        <div className="flex-1 p-4 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filteredCatalog.map((item) => (
            <button
              key={item.id}
              onClick={() => addToCart(item)}
              className="p-4 rounded-2xl bg-white border border-stone-200/80 hover:border-amber-600 hover:shadow-md transition text-left flex flex-col justify-between group"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold bg-stone-100 text-stone-600 group-hover:bg-amber-50 group-hover:text-amber-800">
                    {item.station}
                  </span>
                  <Plus className="w-4 h-4 text-stone-400 group-hover:text-amber-600" />
                </div>
                <h3 className="font-serif text-sm font-bold text-stone-900 group-hover:text-amber-900 leading-snug">
                  {item.name}
                </h3>
              </div>
              <p className="font-mono text-sm font-bold text-amber-700 mt-3">
                {formatInr(item.pricePaise)}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Right 35%: Order Ticket & Checkout Pane */}
      <div className="w-full lg:w-96 bg-white flex flex-col h-full border-t lg:border-t-0 border-stone-200 shadow-xl overflow-hidden">
        {/* Ticket Header & Dining Mode */}
        <div className="p-4 border-b border-stone-200 space-y-3 bg-stone-50">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-base font-bold text-stone-900 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-amber-600" />
              <span>Current Order</span>
            </h2>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-[11px] text-red-600 hover:text-red-700 font-semibold"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Dining Type Selector */}
          <div className="grid grid-cols-3 gap-1 bg-stone-200 p-1 rounded-xl text-xs font-semibold text-center">
            <button
              onClick={() => setOrderType("takeaway")}
              className={`py-1.5 rounded-lg transition ${
                orderType === "takeaway" ? "bg-white text-stone-900 shadow-sm" : "text-stone-600"
              }`}
            >
              Takeaway
            </button>
            <button
              onClick={() => setOrderType("dine_in")}
              className={`py-1.5 rounded-lg transition ${
                orderType === "dine_in" ? "bg-white text-stone-900 shadow-sm" : "text-stone-600"
              }`}
            >
              Dine-In
            </button>
            <button
              onClick={() => setOrderType("bar_counter")}
              className={`py-1.5 rounded-lg transition ${
                orderType === "bar_counter" ? "bg-white text-stone-900 shadow-sm" : "text-stone-600"
              }`}
            >
              Counter
            </button>
          </div>

          {orderType === "dine_in" && (
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-stone-500 font-medium">Table:</span>
              <select
                value={selectedTable?.qr_code_token || ""}
                onChange={(e) => {
                  const t = tables.find((tb) => tb.qr_code_token === e.target.value);
                  setSelectedTable(t);
                }}
                className="flex-1 px-2.5 py-1.5 rounded-xl border border-stone-300 text-xs font-semibold bg-white"
              >
                {tables.map((t) => (
                  <option key={t.qr_code_token} value={t.qr_code_token} disabled={t.status !== "available"}>
                    {t.table_number} ({t.status === "available" ? "Free" : "Occupied"})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-stone-400 space-y-2">
              <UtensilsCrossed className="w-8 h-8 opacity-40" />
              <p className="text-xs">Cart is empty. Tap items on the left to add.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2.5 rounded-xl border border-stone-200/80 bg-stone-50/50"
              >
                <div className="space-y-0.5 flex-1 pr-2">
                  <p className="font-serif text-xs font-bold text-stone-900">{item.name}</p>
                  <p className="font-mono text-[11px] text-stone-500">
                    {formatInr(item.pricePaise)} each
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-stone-300 bg-white rounded-lg">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-6 h-6 flex items-center justify-center text-stone-600 hover:bg-stone-100"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-mono text-xs font-bold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-6 h-6 flex items-center justify-center text-stone-600 hover:bg-stone-100"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="font-mono text-xs font-bold w-16 text-right text-stone-900">
                    {formatInr(item.pricePaise * item.quantity)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Discount, Tender & Financial Summary */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 space-y-3">
          {/* Discount Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-stone-600 flex items-center gap-1">
                <Percent className="w-3 h-3 text-amber-600" />
                <span>Discount / Promo:</span>
              </span>
              <div className="flex gap-1">
                {[0, 5, 10, 20].map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      if (userRole === "front_desk" && d > 10) {
                        alert("Front Desk staff discount is capped at maximum 10%. Overrides require Manager or Owner.");
                        return;
                      }
                      setDiscountPercent(d);
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      discountPercent === d ? "bg-amber-600 text-white" : "bg-stone-200 text-stone-700"
                    }`}
                  >
                    {d}%
                  </button>
                ))}
              </div>
            </div>

            {discountPercent > 0 && (
              <input
                type="text"
                value={discountReason}
                onChange={(e) => setDiscountReason(e.target.value)}
                placeholder="Reason for discount (min 5 chars)..."
                className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs bg-white focus:outline-none"
              />
            )}
          </div>

          {/* Tender Mode Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
              Tender Settlement Mode
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => setTenderMode("cash")}
                className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition ${
                  tenderMode === "cash"
                    ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                    : "bg-white border-stone-300 text-stone-700 hover:bg-stone-100"
                }`}
              >
                <Banknote className="w-3.5 h-3.5" />
                <span>Cash</span>
              </button>
              <button
                onClick={() => setTenderMode("card_swipe")}
                className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition ${
                  tenderMode === "card_swipe"
                    ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                    : "bg-white border-stone-300 text-stone-700 hover:bg-stone-100"
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Card Swipe</span>
              </button>
              <button
                onClick={() => setTenderMode("counter_upi_qr")}
                className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition ${
                  tenderMode === "counter_upi_qr"
                    ? "bg-amber-600 border-amber-600 text-white shadow-sm"
                    : "bg-white border-stone-300 text-stone-700 hover:bg-stone-100"
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>UPI QR</span>
              </button>
            </div>
            {tenderMode === "counter_upi_qr" && (
              <input
                type="text"
                value={upiUtr}
                onChange={(e) => setUpiUtr(e.target.value)}
                placeholder="UPI UTR / Ref (Optional)"
                className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs bg-white"
              />
            )}
          </div>

          {/* Strict Separation Notice */}
          <div className="flex items-center gap-1.5 text-[10px] text-stone-500 font-medium bg-stone-100 p-2 rounded-lg">
            <Lock className="w-3 h-3 text-stone-400 shrink-0" />
            <span>Studio Yoga Pack Credits cannot be cross-billed for café orders.</span>
          </div>

          {/* Bill Calculation */}
          <div className="space-y-1 text-xs border-t border-stone-200 pt-2">
            <div className="flex justify-between text-stone-500">
              <span>Subtotal:</span>
              <span className="font-mono text-stone-800">{formatInr(taxableSubtotalPaise)}</span>
            </div>
            <div className="flex justify-between text-stone-500">
              <span>CGST (2.5%):</span>
              <span className="font-mono text-stone-800">{formatInr(cgstPaise)}</span>
            </div>
            <div className="flex justify-between text-stone-500">
              <span>SGST (2.5%):</span>
              <span className="font-mono text-stone-800">{formatInr(sgstPaise)}</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-stone-900 pt-1 border-t border-stone-200">
              <span>Total Gross:</span>
              <span className="font-mono text-amber-700">{formatInr(totalGrossPaise)}</span>
            </div>
          </div>

          {/* Complete Order Button */}
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || isSubmitting}
            className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 transition"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Printer className="w-4 h-4" />
                <span>Complete Bill & Print (2-Inch 58mm)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      {receiptAscii && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-base font-bold text-stone-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Bill Completed & Printed</span>
              </h2>
              <span className="font-mono text-xs text-stone-500">
                {completedOrder?.invoiceNumber}
              </span>
            </div>

            {/* 2-inch thermal monospace preview */}
            <div className="bg-stone-50 border border-stone-300 rounded-xl p-3 font-mono text-[11px] whitespace-pre-wrap leading-tight text-stone-800 max-h-72 overflow-y-auto">
              {receiptAscii}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setReceiptAscii(null)}
                className="flex-1 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs transition"
              >
                Close
              </button>
              <button
                onClick={handleBrowserPrint}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Printer className="w-4 h-4" />
                <span>Reprint (58mm)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
