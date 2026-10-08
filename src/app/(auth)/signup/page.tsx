"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  User,
  Lock,
  Phone,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  RotateCcw,
} from "lucide-react";

export default function SignupPage() {
  const router = useRouter();

  // Step 1: Info entry, Step 2: 6-digit OTP entry
  const [step, setStep] = useState<1 | 2>(1);

  // Form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsappOptIn, setWhatsappOptIn] = useState(false);
  const [otp, setOtp] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Step 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "signup" }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send verification code");
      }

      setStep(2);
      setCooldown(data.cooldownSeconds || 60);
      setSuccessMsg(`We sent a 6-digit code to ${email}`);
    } catch (err: any) {
      setError(err?.message || "Failed to send verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and create profile
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp,
          purpose: "signup",
          fullName,
          password,
          phone: phone || undefined,
          whatsappOptIn,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Verification failed");
      }

      // Redirect to member dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Invalid or expired code.");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (cooldown > 0) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "signup" }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to resend code");
      }

      setCooldown(data.cooldownSeconds || 60);
      setSuccessMsg(`A new code was dispatched to ${email}`);
    } catch (err: any) {
      setError(err?.message || "Failed to resend code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F9F6F0]">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-[#EAE3D6] p-8">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-xs uppercase tracking-widest font-semibold text-[#657E6B] bg-[#EFF4F0] px-3 py-1 rounded-full">
              Join THE AM:PM STUDIO
            </span>
            <h1 className="text-2xl font-serif font-bold text-[#1E2421] mt-3">
              Create Member Account
            </h1>
          </Link>
          <p className="text-sm text-stone-600 mt-1">
            {step === 1
              ? "Every new member receives one free trial class."
              : `Enter the code sent to ${email}`}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && !error && (
          <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-sm text-emerald-800">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-[#E2D9CC] rounded-lg text-sm text-[#1E2421] placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#C86D51] focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="priya@domain.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-[#E2D9CC] rounded-lg text-sm text-[#1E2421] placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#C86D51] focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-[#E2D9CC] rounded-lg text-sm text-[#1E2421] placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#C86D51] focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                Phone Number <span className="text-stone-400 font-normal lowercase">(optional)</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-[#E2D9CC] rounded-lg text-sm text-[#1E2421] placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#C86D51] focus:bg-white transition"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-start gap-2.5 text-xs text-stone-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={whatsappOptIn}
                  onChange={(e) => setWhatsappOptIn(e.target.checked)}
                  className="mt-0.5 rounded border-stone-300 text-[#C86D51] focus:ring-[#C86D51]"
                />
                <span>
                  Opt in to receive booking confirmations and class reminder alerts on WhatsApp.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3 bg-[#C86D51] hover:bg-[#B65A3E] text-white font-medium rounded-lg text-sm flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Send Verification Code</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5 text-center">
                6-Digit Security Code
              </label>
              <div className="relative max-w-[240px] mx-auto">
                <KeyRound className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="w-full pl-10 pr-4 py-3 text-center tracking-[0.3em] font-mono text-xl font-bold bg-[#FAF7F2] border-2 border-[#C86D51] rounded-lg text-[#1E2421] focus:outline-none focus:bg-white transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full py-3 bg-[#657E6B] hover:bg-[#536A58] text-white font-medium rounded-lg text-sm flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Verify Code & Complete Signup</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-between pt-3 text-xs text-stone-500">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-[#C86D51] hover:underline"
              >
                ← Edit Information
              </button>

              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0 || loading}
                className="flex items-center gap-1 font-medium text-stone-700 hover:text-[#C86D51] disabled:opacity-40"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{cooldown > 0 ? `Resend in ${cooldown}s` : "Resend Code"}</span>
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-[#EAE3D6] text-center text-sm text-stone-600">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[#C86D51] hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
