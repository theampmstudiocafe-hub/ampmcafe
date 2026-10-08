"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, KeyRound, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "recovery" }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send reset code");
      }

      setStep(2);
      setCooldown(data.cooldownSeconds || 60);
      setSuccessMsg(`We sent a 6-digit recovery code to ${email}`);
    } catch (err: any) {
      setError(err?.message || "Failed to send code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      setSuccessMsg("Password reset successfully! Redirecting to sign in...");
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err: any) {
      setError(err?.message || "Invalid recovery code or password format.");
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
              Account Recovery
            </span>
            <h1 className="text-2xl font-serif font-bold text-[#1E2421] mt-3">
              Reset Your Password
            </h1>
          </Link>
          <p className="text-sm text-stone-600 mt-1">
            {step === 1
              ? "We'll send a single-use verification code to your email."
              : `Enter the code sent to ${email} and choose a new password.`}
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
                Registered Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-[#E2D9CC] rounded-lg text-sm text-[#1E2421] placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#C86D51] focus:bg-white transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-[#C86D51] hover:bg-[#B65A3E] text-white font-medium rounded-lg text-sm flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Send Recovery Code</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5 text-center">
                6-Digit Recovery Code
              </label>
              <div className="relative max-w-[220px] mx-auto">
                <KeyRound className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="w-full pl-10 pr-4 py-2.5 text-center tracking-[0.25em] font-mono text-lg font-bold bg-[#FAF7F2] border-2 border-[#C86D51] rounded-lg text-[#1E2421] focus:outline-none focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                New Password (minimum 8 characters)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-[#E2D9CC] rounded-lg text-sm text-[#1E2421] placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#C86D51] focus:bg-white transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6 || newPassword.length < 8}
              className="w-full py-3 bg-[#657E6B] hover:bg-[#536A58] text-white font-medium rounded-lg text-sm flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Update Password</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-[#EAE3D6] text-center text-sm text-stone-600">
          Remembered your password?{" "}
          <Link href="/login" className="font-semibold text-[#C86D51] hover:underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
