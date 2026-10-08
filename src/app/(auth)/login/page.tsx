"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to log in");
      }

      // Route based on role
      if (["owner", "admin", "manager"].includes(data.user?.role)) {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Invalid credentials. Please try again.");
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
              Koregaon Park • Pune
            </span>
            <h1 className="text-2xl font-serif font-bold text-[#1E2421] mt-3">
              THE AM:PM STUDIO
            </h1>
          </Link>
          <p className="text-sm text-stone-600 mt-1">
            Sign in to book classes, view credits, and connect.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
              Email Address
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

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-700">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-[#C86D51] hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#EAE3D6] text-center text-sm text-stone-600">
          New to our shala?{" "}
          <Link
            href="/signup"
            className="font-semibold text-[#C86D51] hover:underline"
          >
            Create account with Email OTP
          </Link>
        </div>
      </div>
    </div>
  );
}
