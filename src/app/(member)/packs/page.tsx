"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  CreditCard,
  Sparkles,
  ShieldCheck,
  Loader2,
  ArrowRight,
  Clock,
  Layers,
  AlertCircle,
} from "lucide-react";

interface PackType {
  id: string;
  name: string;
  description: string;
  price_inr: number;
  credits: number;
  validity_days: number;
}

export default function PacksPage() {
  const router = useRouter();
  const [packs, setPacks] = useState<PackType[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadPacks() {
      try {
        const res = await fetch("/api/packs");
        const data = await res.json();
        if (data.packs) {
          setPacks(data.packs);
        }
      } catch (err) {
        console.error("Failed to load packs", err);
      } finally {
        setLoading(false);
      }
    }
    loadPacks();
  }, []);

  const handlePurchase = async (pack: PackType) => {
    setPurchasingId(pack.id);
    setError(null);
    setSuccessMsg(null);

    try {
      // 1. Create server-side Razorpay order
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemType: "pack_purchase",
          itemId: pack.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login?redirect=/packs");
          return;
        }
        throw new Error(data.error || "Failed to create payment order");
      }

      // Check if Razorpay script is available or in simulation mode
      const isSimulated = data.order.orderId.startsWith("order_sim_");

      if (isSimulated) {
        // In local sandbox / mock mode, simulate immediate signed webhook confirmation
        console.log("[Simulation] Triggering simulated Razorpay capture webhook...");
        const simRes = await fetch("/api/webhooks/razorpay", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-razorpay-signature": "simulated_signature",
          },
          body: JSON.stringify({
            event: "order.paid",
            payload: {
              payment: {
                entity: {
                  id: `pay_sim_${Date.now()}`,
                  order_id: data.order.orderId,
                  amount: data.order.amount,
                  status: "captured",
                },
              },
            },
          }),
        });

        if (simRes.ok) {
          setSuccessMsg(`Successfully purchased ${pack.name}! ${pack.credits} credits added to your ledger.`);
          setTimeout(() => {
            router.push("/dashboard");
          }, 1800);
          return;
        }
      }

      // Live Razorpay Checkout
      if (typeof window !== "undefined" && (window as any).Razorpay) {
        const rzp = new (window as any).Razorpay({
          key: data.order.keyId,
          amount: data.order.amount,
          currency: data.order.currency,
          name: "THE AM:PM STUDIO",
          description: `Purchase ${pack.name}`,
          order_id: data.order.orderId,
          prefill: {
            email: data.user.email,
          },
          theme: {
            color: "#C86D51",
          },
          handler: function () {
            setSuccessMsg("Payment successful! Your credits are being credited.");
            setTimeout(() => {
              router.push("/dashboard");
            }, 1500);
          },
        });
        rzp.open();
      } else {
        // If razorpay script not yet injected
        setSuccessMsg(`Order ${data.order.orderId} generated. Waiting for payment webhook confirmation.`);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to initiate payment");
    } finally {
      setPurchasingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F6F0] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs uppercase tracking-widest font-semibold text-[#657E6B] bg-[#EFF4F0] px-3.5 py-1 rounded-full">
            Flexible Class Packs
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1E2421] mt-3 mb-2">
            Invest In Your Daily Practice
          </h1>
          <p className="text-sm text-stone-600">
            No rigid memberships. Purchase packs with an immutable credit ledger, generous validity, and full cancellation flexibility.
          </p>
        </div>

        {error && (
          <div className="mb-8 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-700 max-w-md mx-auto">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-8 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-sm text-emerald-800 max-w-md mx-auto">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-stone-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3 text-[#C86D51]" />
            <p className="text-sm">Loading studio packs...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {packs.map((pack, idx) => {
              const perClassCost = Math.round(pack.price_inr / pack.credits);
              const isPopular = pack.credits === 10;

              return (
                <div
                  key={pack.id}
                  className={`bg-white rounded-2xl border p-6 flex flex-col justify-between transition relative ${
                    isPopular
                      ? "border-[#C86D51] shadow-md ring-1 ring-[#C86D51]"
                      : "border-[#EAE3D6] shadow-sm hover:border-stone-400"
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#C86D51] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>Most Popular</span>
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-bold text-[#1E2421] mb-1">{pack.name}</h3>
                    <p className="text-xs text-stone-500 mb-4 min-h-[32px]">{pack.description}</p>

                    <div className="mb-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-[#1E2421]">₹{pack.price_inr.toLocaleString("en-IN")}</span>
                        <span className="text-xs text-stone-400">total</span>
                      </div>
                      <div className="text-xs font-semibold text-[#657E6B] mt-0.5">
                        ₹{perClassCost} / class
                      </div>
                    </div>

                    <div className="space-y-2 pt-4 border-t border-stone-100 text-xs text-stone-600 mb-6">
                      <div className="flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-[#C86D51]" />
                        <span><strong>{pack.credits} Credits</strong> for any regular class</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        <span>Valid for <strong>{pack.validity_days} days</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#657E6B]" />
                        <span>Full credit return on 12h cancel</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handlePurchase(pack)}
                    disabled={purchasingId !== null}
                    className={`w-full py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-60 ${
                      isPopular
                        ? "bg-[#C86D51] hover:bg-[#B65A3E] text-white"
                        : "bg-stone-900 hover:bg-stone-800 text-white"
                    }`}
                  >
                    {purchasingId === pack.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Buy Pack</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-16 bg-[#EFF4F0] border border-[#657E6B]/30 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-[#657E6B] shrink-0 shadow-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-[#1E2421]">New to our Koregaon Park shala?</h4>
              <p className="text-xs text-stone-600">
                You get 1 complimentary trial class when you create an account with zero payment required.
              </p>
            </div>
          </div>
          <Link
            href="/book"
            className="px-5 py-2.5 bg-[#657E6B] hover:bg-[#536A58] text-white text-xs font-semibold rounded-xl shadow-sm transition shrink-0"
          >
            Claim Free Trial
          </Link>
        </div>
      </div>
    </div>
  );
}
