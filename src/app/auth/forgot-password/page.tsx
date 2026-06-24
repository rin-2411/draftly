"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/config/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${origin}/auth/reset`,
        }
      );

      if (resetError) {
        setError(resetError.message);
        return;
      }
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <div className="space-y-1 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
            Draftly
          </p>
          <h1 className="text-2xl font-semibold text-stone-900">
            Reset your password
          </h1>
          <p className="text-sm text-stone-600">
            Enter the email you use for Draftly. We&apos;ll send you a link to
            choose a new password.
          </p>
        </div>

        {sent ? (
          <div className="mt-8 rounded-lg border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
            If an account exists for{" "}
            <span className="font-medium">{email}</span>, you&apos;ll receive an
            email shortly. Check your inbox and spam folder.
          </div>
        ) : (
          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-stone-700"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="block w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-700/50 focus:outline-none"
                placeholder="you@newsroom.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#c9a06c] px-4 py-2.5 text-sm font-semibold text-[#1a120e] transition hover:bg-[#ddb77e] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-stone-600">
          <Link
            href="/auth/login"
            className="font-semibold text-amber-900 hover:underline"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
