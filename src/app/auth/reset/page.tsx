"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/config/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const applySession = (hasUser: boolean) => {
      if (cancelled) return;
      if (hasUser) setSessionReady(true);
      setChecking(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) applySession(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setSessionReady(true);
        setChecking(false);
      }
    });

    const retry = window.setTimeout(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setSessionReady(true);
        }
        applySession(!!session?.user);
      });
    }, 800);

    const failSafe = window.setTimeout(() => {
      if (cancelled) return;
      setChecking(false);
    }, 5000);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      window.clearTimeout(retry);
      window.clearTimeout(failSafe);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setError("Could not update password. Try again or request a new link.");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-100 px-4">
        <p className="text-sm text-stone-600">Verifying your reset link...</p>
      </div>
    );
  }

  if (!sessionReady) {
    return (
      <div className="min-h-screen bg-stone-100 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-sm text-center">
          <h1 className="text-lg font-semibold text-stone-900">
            Link invalid or expired
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            Request a new password reset from the sign-in page.
          </p>
          <Link
            href="/auth/forgot-password"
            className="mt-6 inline-block text-sm font-semibold text-amber-900 hover:underline"
          >
            Request new link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <div className="space-y-1 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
            Draftly
          </p>
          <h1 className="text-2xl font-semibold text-stone-900">
            Choose a new password
          </h1>
          <p className="text-sm text-stone-600">
            Use a strong password you haven&apos;t used elsewhere.
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-stone-700"
            >
              New password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              className="block w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-700/50 focus:outline-none"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1 block text-sm font-medium text-stone-700"
            >
              Confirm new password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              className="block w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-700/50 focus:outline-none"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#c9a06c] px-4 py-2.5 text-sm font-semibold text-[#1a120e] transition hover:bg-[#ddb77e] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Updating..." : "Update password"}
          </button>
        </form>

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
