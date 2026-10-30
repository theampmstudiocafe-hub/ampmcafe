"use client";

import React, { useState, useEffect } from "react";
import {
  Percent,
  Sliders,
  Printer,
  Coins,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  RefreshCw,
  Zap,
  Terminal,
  UtensilsCrossed,
  Coffee,
  Cake,
  Receipt,
} from "lucide-react";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [settings, setSettings] = useState({
    foodGstPercent: 5.0,
    serviceChargePercent: 0.0,
    serviceChargeEnabled: false,
  });

  const [testingTarget, setTestingTarget] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ message: string; preview?: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings/pricing")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          setSettings(data.settings);
        }
      })
      .catch((err) => console.error("Failed to load pricing settings:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setErrorMessage("");

    try {
      const res = await fetch("/api/admin/settings/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setErrorMessage(data.error || "Failed to save settings");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error");
    } finally {
      setSaving(false);
    }
  };

  const runTestPrint = async (target: string, action: string = "test_print") => {
    setTestingTarget(target);
    setTestResult(null);
    try {
      const res = await fetch("/api/hardware/test-print", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, action }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult({ message: data.message, preview: data.preview });
      } else {
        setTestResult({ message: "Failed: " + (data.error || "Unknown error") });
      }
    } catch (err: any) {
      setTestResult({ message: "Network error: " + err.message });
    } finally {
      setTestingTarget(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-stone-500 font-sans text-sm">
          <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
          Loading Café Settings & Hardware Diagnostics...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="pb-6 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-900 text-[11px] font-semibold uppercase tracking-wider border border-amber-200 mb-2">
            <Sliders className="w-3.5 h-3.5 text-amber-600" />
            Statutory & Hardware Configuration
          </div>
          <h1 className="text-3xl font-serif text-stone-900">Café Settings & Hardware Controls</h1>
          <p className="text-xs text-stone-500 font-light mt-1">
            Dynamically adjust statutory taxes, toggle optional service charges, and test thermal printers.
          </p>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          Settings updated successfully. All guest QR orders and POS bills now reflect the new rates.
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2 text-xs font-medium">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          {errorMessage}
        </div>
      )}

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Pricing, Taxes & Service Charge */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-4">
            <Percent className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-semibold text-stone-900">Taxes & Service Charge</h2>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-6">
            {/* Food GST */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-stone-700 uppercase tracking-wider block">
                Food & Beverage GST Rate (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="28"
                  value={settings.foodGstPercent}
                  onChange={(e) =>
                    setSettings({ ...settings, foodGstPercent: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-mono text-stone-900 pr-10"
                />
                <span className="absolute right-3.5 top-2.5 text-sm text-stone-400 font-mono">%</span>
              </div>
              <p className="text-[11px] text-stone-500">
                Split equally into <strong>CGST ({(settings.foodGstPercent / 2).toFixed(2)}%)</strong> and{" "}
                <strong>SGST ({(settings.foodGstPercent / 2).toFixed(2)}%)</strong>. Standard restaurant rate is 5.0% without ITC.
              </p>
              <div className="p-2.5 bg-amber-50/80 rounded-lg border border-amber-200/60 text-[11px] text-amber-800 flex items-start gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span>Notice: All statutory tax rates and invoices are marked <strong>Pending CA Confirmation</strong>.</span>
              </div>
            </div>

            {/* Service Charge Toggle & Percentage */}
            <div className="pt-4 border-t border-stone-100 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-stone-800 uppercase tracking-wider">
                    Discretionary Service Charge
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Optional hospitality charge. Default is OFF per Consumer Protection guidelines.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSettings({
                      ...settings,
                      serviceChargeEnabled: !settings.serviceChargeEnabled,
                    })
                  }
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 ease-in-out cursor-pointer ${
                    settings.serviceChargeEnabled ? "bg-amber-600 justify-end" : "bg-stone-300 justify-start"
                  }`}
                >
                  <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition" />
                </button>
              </div>

              {settings.serviceChargeEnabled && (
                <div className="space-y-2 pt-2 animate-in fade-in duration-200">
                  <label className="text-xs font-semibold text-stone-700 block">
                    Service Charge Percentage (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="20"
                      value={settings.serviceChargePercent}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          serviceChargePercent: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-mono text-stone-900 pr-10"
                    />
                    <span className="absolute right-3.5 top-2.5 text-sm text-stone-400 font-mono">%</span>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    When enabled, this charge is computed before GST and clearly itemized on receipts.
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Pricing & Tax Rules
            </button>
          </form>
        </div>

        {/* Right Column: Hardware Diagnostics & 1-Click Printer Testing */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-4">
            <Printer className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-semibold text-stone-900">Hardware Diagnostics & Testing</h2>
          </div>

          <p className="text-xs text-stone-500 font-light">
            Trigger live test prints to kitchen stations and pulse the counter cash drawer to verify physical connections before café opening.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              disabled={testingTarget !== null}
              onClick={() => runTestPrint("printer_food")}
              className="p-3.5 rounded-xl border border-stone-200 hover:border-amber-400 bg-stone-50 hover:bg-amber-50/50 transition text-left flex items-start gap-3 disabled:opacity-50"
            >
              <UtensilsCrossed className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-stone-900">Food Station (80mm)</p>
                <p className="text-[11px] text-stone-500">192.168.1.101:9100</p>
              </div>
            </button>

            <button
              type="button"
              disabled={testingTarget !== null}
              onClick={() => runTestPrint("printer_bev")}
              className="p-3.5 rounded-xl border border-stone-200 hover:border-amber-400 bg-stone-50 hover:bg-amber-50/50 transition text-left flex items-start gap-3 disabled:opacity-50"
            >
              <Coffee className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-stone-900">Barista / Bev (80mm)</p>
                <p className="text-[11px] text-stone-500">192.168.1.102:9100</p>
              </div>
            </button>

            <button
              type="button"
              disabled={testingTarget !== null}
              onClick={() => runTestPrint("printer_dessert")}
              className="p-3.5 rounded-xl border border-stone-200 hover:border-amber-400 bg-stone-50 hover:bg-amber-50/50 transition text-left flex items-start gap-3 disabled:opacity-50"
            >
              <Cake className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-stone-900">Bakery Station (80mm)</p>
                <p className="text-[11px] text-stone-500">192.168.1.103:9100</p>
              </div>
            </button>

            <button
              type="button"
              disabled={testingTarget !== null}
              onClick={() => runTestPrint("printer_pos")}
              className="p-3.5 rounded-xl border border-stone-200 hover:border-amber-400 bg-stone-50 hover:bg-amber-50/50 transition text-left flex items-start gap-3 disabled:opacity-50"
            >
              <Receipt className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-stone-900">Counter 2-Inch (58mm)</p>
                <p className="text-[11px] text-stone-500">USB001 / Bluetooth</p>
              </div>
            </button>
          </div>

          {/* Cash Drawer Kick Button */}
          <div className="pt-2">
            <button
              type="button"
              disabled={testingTarget !== null}
              onClick={() => runTestPrint("printer_pos", "kick_drawer")}
              className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              <Coins className="w-4 h-4" />
              Test Cash Drawer Kick (Pulse Pin 2)
            </button>
          </div>

          {testResult && (
            <div className="p-3.5 bg-stone-900 text-stone-100 rounded-xl space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between text-amber-400">
                <span className="font-semibold">{testResult.message}</span>
                <Zap className="w-3.5 h-3.5" />
              </div>
              {testResult.preview && (
                <pre className="text-[10px] leading-tight text-stone-300 max-h-36 overflow-y-auto bg-stone-950 p-2 rounded">
                  {testResult.preview}
                </pre>
              )}
            </div>
          )}

          {/* Print Agent Info Box */}
          <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-600 space-y-1.5 text-[11px]">
            <p className="font-semibold text-stone-800 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-stone-500" /> Local Print Agent Daemon
            </p>
            <p>
              Run on front desk POS PC: <code className="bg-stone-200 px-1 py-0.5 rounded text-stone-900">node scripts/print-agent.mjs</code>
            </p>
            <p className="text-stone-400">
              Scoped Device Token: <code className="bg-stone-200/60 px-1 rounded">ampm_agent_pos1_pune</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
