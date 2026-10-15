"use client";

import React, { useState, useEffect } from "react";
import {
  Truck,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  PackageCheck,
  Building2,
  Phone,
  Mail,
  FileText,
  Calendar,
  IndianRupee,
  Layers,
  ChevronRight,
  Calculator,
  ArrowRight,
  ShieldCheck,
  X,
} from "lucide-react";

interface POItem {
  id: string;
  ingredient_id: string;
  ingredient_name: string;
  ordered_quantity: number;
  purchase_unit: string;
  base_unit: string;
  conversion_factor: number;
  agreed_unit_cost_inr: number;
  total_cost_inr: number;
  received_quantity: number;
}

interface PurchaseOrder {
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

interface Supplier {
  id: string;
  name: string;
  contact_name: string;
  email: string;
  phone: string;
  gstin: string;
  payment_terms: string;
  lead_time_days: number;
  category: string;
  address: string;
  is_active: boolean;
  total_pos: number;
  active_pos: number;
  total_spend_inr: number;
}

export default function AdminSuppliersPage() {
  const [activeTab, setActiveTab] = useState<"pos" | "suppliers">("pos");
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Modals
  const [showCreatePOModal, setShowCreatePOModal] = useState(false);
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [showNewSupplierModal, setShowNewSupplierModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  // Delivery Intake Form State
  const [intakeDeliveryNote, setIntakeDeliveryNote] = useState("");
  const [intakeInvoiceAmount, setIntakeInvoiceAmount] = useState("");
  const [intakeQuantities, setIntakeQuantities] = useState<Record<string, number>>({});
  const [intakeSuccessMsg, setIntakeSuccessMsg] = useState<string | null>(null);

  // New PO Form State
  const [newPOSupplierId, setNewPOSupplierId] = useState("");
  const [newPOItemName, setNewPOItemName] = useState("");
  const [newPOQuantity, setNewPOQuantity] = useState("10");
  const [newPOPurchaseUnit, setNewPOPurchaseUnit] = useState("1 kg bag");
  const [newPOBaseUnit, setNewPOBaseUnit] = useState("g");
  const [newPOConvFactor, setNewPOConvFactor] = useState("1000");
  const [newPOUnitPrice, setNewPOUnitPrice] = useState("450");
  const [newPONotes, setNewPONotes] = useState("");

  // New Supplier Form State
  const [newSupName, setNewSupName] = useState("");
  const [newSupContact, setNewSupContact] = useState("");
  const [newSupEmail, setNewSupEmail] = useState("");
  const [newSupPhone, setNewSupPhone] = useState("");
  const [newSupGstin, setNewSupGstin] = useState("");
  const [newSupTerms, setNewSupTerms] = useState("Net 15");
  const [newSupLeadDays, setNewSupLeadDays] = useState("2");
  const [newSupCategory, setNewSupCategory] = useState("Organic Produce & Specialty");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [posRes, supRes] = await Promise.all([
        fetch(`/api/admin/suppliers/purchase-orders?status=${statusFilter}`).then((r) => r.json()),
        fetch("/api/admin/suppliers").then((r) => r.json()),
      ]);

      if (posRes.success) setPurchaseOrders(posRes.purchase_orders);
      if (supRes.success) setSuppliers(supRes.suppliers);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const handleOpenIntake = (po: PurchaseOrder) => {
    setSelectedPO(po);
    const initialQty: Record<string, number> = {};
    po.items.forEach((it) => {
      initialQty[it.id] = it.ordered_quantity - it.received_quantity;
    });
    setIntakeQuantities(initialQty);
    setIntakeDeliveryNote(`DN-${Date.now().toString().slice(-6)}`);
    setIntakeInvoiceAmount(String(po.total_estimated_cost_inr));
    setIntakeSuccessMsg(null);
    setShowIntakeModal(true);
  };

  const handleProcessIntake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPO) return;

    const intakeItems = selectedPO.items.map((it) => ({
      ingredient_id: it.ingredient_id,
      ingredient_name: it.ingredient_name,
      received_quantity_purchase_unit: intakeQuantities[it.id] || 0,
      purchase_unit: it.purchase_unit,
      base_unit: it.base_unit,
      conversion_factor: it.conversion_factor,
      actual_unit_cost_inr: it.agreed_unit_cost_inr,
      batch_number: `LOT-${Date.now().toString().slice(-4)}`,
    }));

    try {
      const res = await fetch("/api/admin/suppliers/deliveries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purchase_order_id: selectedPO.id,
          delivery_note_number: intakeDeliveryNote,
          invoice_amount_inr: Number(intakeInvoiceAmount),
          items: intakeItems,
        }),
      });

      const data = await res.json();
      if (data.success) {
        // Also update PO status
        await fetch("/api/admin/suppliers/purchase-orders", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: selectedPO.id, status: "received" }),
        });

        setIntakeSuccessMsg(`Intake verified! ${data.delivery.total_base_units_ingested.toLocaleString()} base units posted to inventory.`);
        setTimeout(() => {
          setShowIntakeModal(false);
          fetchData();
        }, 1500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetSupplier = suppliers.find((s) => s.id === newPOSupplierId) || suppliers[0];

    const payload = {
      supplier_id: targetSupplier.id,
      supplier_name: targetSupplier.name,
      items: [
        {
          ingredient_id: `ing-${Date.now()}`,
          ingredient_name: newPOItemName || "Organic Artisanal Ingredient",
          ordered_quantity: Number(newPOQuantity),
          purchase_unit: newPOPurchaseUnit,
          base_unit: newPOBaseUnit,
          conversion_factor: Number(newPOConvFactor),
          agreed_unit_cost_inr: Number(newPOUnitPrice),
        },
      ],
      notes: newPONotes,
    };

    try {
      const res = await fetch("/api/admin/suppliers/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreatePOModal(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: newSupName,
      contact_name: newSupContact,
      email: newSupEmail,
      phone: newSupPhone,
      gstin: newSupGstin,
      payment_terms: newSupTerms,
      lead_time_days: Number(newSupLeadDays),
      category: newSupCategory,
    };

    try {
      const res = await fetch("/api/admin/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setShowNewSupplierModal(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredPOs = purchaseOrders.filter((po) => {
    return (
      po.po_number.toLowerCase().includes(search.toLowerCase()) ||
      po.supplier_name.toLowerCase().includes(search.toLowerCase())
    );
  });

  const filteredSuppliers = suppliers.filter((sup) => {
    return (
      sup.name.toLowerCase().includes(search.toLowerCase()) ||
      sup.category.toLowerCase().includes(search.toLowerCase()) ||
      sup.contact_name.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-900 text-[11px] font-semibold uppercase tracking-wider border border-amber-200 mb-2">
            <Truck className="w-3.5 h-3.5 text-amber-600" />
            Café Procurement & Supply Chain
          </div>
          <h1 className="text-3xl font-serif text-stone-900">
            Suppliers & Purchase Orders
          </h1>
          <p className="text-xs text-stone-500 font-light mt-1">
            Procurement lifecycle, supplier agreements, PO generation, and delivery intake with automatic purchase-to-base unit conversion.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === "pos" ? (
            <button
              onClick={() => setShowCreatePOModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 text-stone-50 text-xs font-medium hover:bg-stone-800 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Create Purchase Order
            </button>
          ) : (
            <button
              onClick={() => setShowNewSupplierModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 text-stone-50 text-xs font-medium hover:bg-stone-800 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Onboard Supplier
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200 gap-6">
        <button
          onClick={() => setActiveTab("pos")}
          className={`pb-3 text-xs font-medium transition-all relative ${
            activeTab === "pos"
              ? "text-stone-900 font-semibold border-b-2 border-stone-900"
              : "text-stone-400 hover:text-stone-600"
          }`}
        >
          Purchase Orders ({purchaseOrders.length})
        </button>
        <button
          onClick={() => setActiveTab("suppliers")}
          className={`pb-3 text-xs font-medium transition-all relative ${
            activeTab === "suppliers"
              ? "text-stone-900 font-semibold border-b-2 border-stone-900"
              : "text-stone-400 hover:text-stone-600"
          }`}
        >
          Suppliers Directory ({suppliers.length})
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={activeTab === "pos" ? "Search by PO number or supplier..." : "Search suppliers or categories..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
          />
        </div>

        {activeTab === "pos" && (
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
            {["all", "draft", "ordered", "received"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs capitalize font-medium whitespace-nowrap transition-colors ${
                  statusFilter === st
                    ? "bg-stone-900 text-stone-100"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* TAB 1: PURCHASE ORDERS */}
      {activeTab === "pos" && (
        <div className="space-y-4">
          {loading ? (
            <div className="py-20 text-center text-xs text-stone-400 animate-pulse">
              Loading purchase orders...
            </div>
          ) : filteredPOs.length === 0 ? (
            <div className="py-16 text-center rounded-2xl border border-dashed border-stone-200 bg-stone-50/50">
              <FileText className="w-8 h-8 text-stone-300 mx-auto mb-2" />
              <p className="text-sm font-serif text-stone-700">No purchase orders found</p>
              <p className="text-xs text-stone-400 mt-1">Create a new purchase order to begin supply chain replenishment</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-200/80 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-mono uppercase text-[10px]">
                    <tr>
                      <th className="px-5 py-3.5">PO Number</th>
                      <th className="px-5 py-3.5">Supplier</th>
                      <th className="px-5 py-3.5">Items Summary</th>
                      <th className="px-5 py-3.5">Expected Delivery</th>
                      <th className="px-5 py-3.5">Total Value</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredPOs.map((po) => (
                      <tr key={po.id} className="hover:bg-stone-50/70 transition-colors">
                        <td className="px-5 py-4 font-mono font-medium text-stone-900">
                          {po.po_number}
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-medium text-stone-800">{po.supplier_name}</div>
                          {po.notes && <div className="text-[11px] text-stone-400 truncate max-w-xs">{po.notes}</div>}
                        </td>
                        <td className="px-5 py-4 text-stone-600">
                          <div className="flex flex-col gap-0.5">
                            {po.items.map((it) => (
                              <span key={it.id} className="text-[11px]">
                                • {it.ordered_quantity} {it.purchase_unit} of <span className="font-medium">{it.ingredient_name}</span>
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-stone-500 font-mono text-[11px]">
                          {po.expected_delivery_at}
                        </td>
                        <td className="px-5 py-4 font-semibold text-stone-900">
                          ₹{po.total_estimated_cost_inr.toLocaleString("en-IN")}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium uppercase tracking-wide border ${
                              po.status === "received"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : po.status === "ordered"
                                ? "bg-blue-50 text-blue-800 border-blue-200"
                                : po.status === "partially_received"
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : "bg-stone-100 text-stone-600 border-stone-200"
                            }`}
                          >
                            {po.status === "received" && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                            {po.status === "ordered" && <Clock className="w-3 h-3 text-blue-600" />}
                            {po.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          {po.status === "ordered" && (
                            <button
                              onClick={() => handleOpenIntake(po)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium transition-colors shadow-sm"
                            >
                              <PackageCheck className="w-3.5 h-3.5" />
                              Intake Delivery
                            </button>
                          )}
                          {po.status === "received" && (
                            <span className="text-[11px] text-stone-400 font-medium">
                              Ingested to Stock
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SUPPLIERS DIRECTORY */}
      {activeTab === "suppliers" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSuppliers.map((sup) => (
            <div
              key={sup.id}
              className="p-5 rounded-2xl bg-white border border-stone-200/80 shadow-sm space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="text-base font-serif font-medium text-stone-900">
                      {sup.name}
                    </h3>
                    <p className="text-xs text-amber-800 font-medium mt-0.5">
                      {sup.category}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-stone-100 text-stone-600 border border-stone-200">
                    Lead: {sup.lead_time_days}d
                  </span>
                </div>

                <div className="space-y-1.5 py-3 border-t border-b border-stone-100 text-xs text-stone-600">
                  <div className="flex items-center gap-2">
                    <span className="text-stone-400 text-[11px]">Contact:</span>
                    <span className="font-medium text-stone-800">{sup.contact_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                    <span className="truncate">{sup.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                    <span>{sup.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-stone-400 text-[11px]">GSTIN:</span>
                    <span className="font-mono text-[11px] text-stone-800">{sup.gstin}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs">
                <div>
                  <span className="text-stone-400 block text-[10px]">Payment Terms</span>
                  <span className="font-medium text-stone-800">{sup.payment_terms}</span>
                </div>
                <div className="text-right">
                  <span className="text-stone-400 block text-[10px]">Total Fulfilled Spend</span>
                  <span className="font-semibold text-stone-900">
                    ₹{sup.total_spend_inr.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DELIVERY INTAKE MODAL (Automatic Purchase-Unit -> Base-Unit Conversion) */}
      {showIntakeModal && selectedPO && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between pb-4 border-b border-stone-200">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
                  Delivery Intake & Stock Conversion
                </span>
                <h3 className="text-lg font-serif font-medium text-stone-900">
                  Intake Delivery for {selectedPO.po_number}
                </h3>
                <p className="text-xs text-stone-500">{selectedPO.supplier_name}</p>
              </div>
              <button
                onClick={() => setShowIntakeModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                ✕
              </button>
            </div>

            {intakeSuccessMsg ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>{intakeSuccessMsg}</span>
              </div>
            ) : (
              <form onSubmit={handleProcessIntake} className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-stone-600 mb-1 font-medium">
                      Delivery Note / Challan #
                    </label>
                    <input
                      type="text"
                      required
                      value={intakeDeliveryNote}
                      onChange={(e) => setIntakeDeliveryNote(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 mb-1 font-medium">
                      Actual Invoice Amount (₹)
                    </label>
                    <input
                      type="number"
                      required
                      value={intakeInvoiceAmount}
                      onChange={(e) => setIntakeInvoiceAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
                    Received Items & Base Unit Depletion Factor
                  </div>
                  {selectedPO.items.map((it) => {
                    const receivedQty = intakeQuantities[it.id] ?? it.ordered_quantity;
                    const baseUnitsTotal = receivedQty * it.conversion_factor;

                    return (
                      <div
                        key={it.id}
                        className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2 text-xs"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-stone-900">{it.ingredient_name}</span>
                          <span className="text-[11px] text-stone-500">
                            Ordered: {it.ordered_quantity} {it.purchase_unit}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 items-center">
                          <div>
                            <label className="block text-[11px] text-stone-500 mb-1">
                              Quantity Received ({it.purchase_unit}):
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              value={receivedQty}
                              onChange={(e) =>
                                setIntakeQuantities({
                                  ...intakeQuantities,
                                  [it.id]: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs"
                            />
                          </div>

                          {/* Base Unit Calculation Highlight */}
                          <div className="p-2 rounded-lg bg-amber-50/80 border border-amber-200/60 text-[11px] text-amber-900">
                            <div className="font-mono text-xs font-semibold">
                              = {baseUnitsTotal.toLocaleString()} {it.base_unit}
                            </div>
                            <div className="text-[10px] text-amber-700">
                              (Factor: 1 {it.purchase_unit} = {it.conversion_factor} {it.base_unit})
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-stone-200">
                  <button
                    type="button"
                    onClick={() => setShowIntakeModal(false)}
                    className="px-4 py-2 rounded-xl text-xs text-stone-600 hover:bg-stone-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-stone-900 text-stone-50 text-xs font-medium hover:bg-stone-800 transition-colors shadow-sm"
                  >
                    Post Delivery & Ingest to Stock
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* CREATE PURCHASE ORDER MODAL */}
      {showCreatePOModal && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between pb-3 border-b border-stone-200">
              <div>
                <h3 className="text-lg font-serif font-medium text-stone-900">
                  Create Purchase Order
                </h3>
                <p className="text-xs text-stone-500">Draft PO with supplier unit conversion specifications</p>
              </div>
              <button
                onClick={() => setShowCreatePOModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePO} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-stone-600 mb-1 font-medium">Select Supplier</label>
                <select
                  value={newPOSupplierId}
                  onChange={(e) => setNewPOSupplierId(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-600 mb-1 font-medium">Ingredient Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Organic Raw Cacao Nibs"
                  value={newPOItemName}
                  onChange={(e) => setNewPOItemName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-stone-600 mb-1">Order Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newPOQuantity}
                    onChange={(e) => setNewPOQuantity(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 mb-1">Purchase Unit</label>
                  <input
                    type="text"
                    required
                    value={newPOPurchaseUnit}
                    onChange={(e) => setNewPOPurchaseUnit(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 mb-1">Unit Cost (₹)</label>
                  <input
                    type="number"
                    required
                    value={newPOUnitPrice}
                    onChange={(e) => setNewPOUnitPrice(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-amber-50/60 border border-amber-200/50">
                <div>
                  <label className="block text-[11px] text-amber-900 mb-1 font-medium">Base Unit (Inventory)</label>
                  <input
                    type="text"
                    required
                    value={newPOBaseUnit}
                    onChange={(e) => setNewPOBaseUnit(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-amber-200 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-amber-900 mb-1 font-medium">Conversion Factor</label>
                  <input
                    type="number"
                    required
                    value={newPOConvFactor}
                    onChange={(e) => setNewPOConvFactor(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-amber-200 rounded text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-600 mb-1">Operational Notes</label>
                <textarea
                  rows={2}
                  placeholder="Delivery timing, temperature handling, etc."
                  value={newPONotes}
                  onChange={(e) => setNewPONotes(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowCreatePOModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-stone-900 text-stone-50 text-xs font-medium hover:bg-stone-800 transition-colors shadow-sm"
                >
                  Issue Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ONBOARD SUPPLIER MODAL */}
      {showNewSupplierModal && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between pb-3 border-b border-stone-200">
              <div>
                <h3 className="text-lg font-serif font-medium text-stone-900">
                  Onboard Supplier
                </h3>
                <p className="text-xs text-stone-500">Record commercial credentials, GSTIN, and payment terms</p>
              </div>
              <button
                onClick={() => setShowNewSupplierModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 mb-1 font-medium">Supplier Business Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sahyadri Organics"
                    value={newSupName}
                    onChange={(e) => setNewSupName(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 mb-1 font-medium">Category</label>
                  <input
                    type="text"
                    required
                    value={newSupCategory}
                    onChange={(e) => setNewSupCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={newSupContact}
                    onChange={(e) => setNewSupContact(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={newSupPhone}
                    onChange={(e) => setNewSupPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={newSupEmail}
                    onChange={(e) => setNewSupEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 mb-1">GSTIN</label>
                  <input
                    type="text"
                    placeholder="27XXXXXXXXXXXXX"
                    value={newSupGstin}
                    onChange={(e) => setNewSupGstin(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 mb-1">Payment Terms</label>
                  <select
                    value={newSupTerms}
                    onChange={(e) => setNewSupTerms(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                  >
                    <option value="Immediate / COD">Immediate / COD</option>
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Prepaid">Prepaid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-stone-600 mb-1">Lead Time (Days)</label>
                  <input
                    type="number"
                    min="1"
                    value={newSupLeadDays}
                    onChange={(e) => setNewSupLeadDays(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowNewSupplierModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-stone-900 text-stone-50 text-xs font-medium hover:bg-stone-800 transition-colors shadow-sm"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
