"use client";

import { useState, useEffect } from "react";
import { signIn } from "@/lib/auth";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("disabled") === "1") {
      setError("Your account has been disabled. Contact an administrator.");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error);
      setLoading(false);
    } else {
      // Redirect to dashboard - middleware will handle the redirect
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto grid w-full max-w-7xl gap-8 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm lg:grid-cols-[1.2fr_0.8fr] lg:p-10">
        <section className="flex flex-col justify-between rounded-2xl bg-gradient-to-br from-[#1e1814] via-[#2a1f18] to-[#3d2920] p-8 text-white lg:p-10">
          <div className="space-y-6">
            <p className="inline-flex rounded-full border border-white/25 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/90">
              Draftly Platform
            </p>
            <div className="space-y-4">
              <h1 className="text-3xl font-semibold leading-tight lg:text-5xl">
                AI-powered co-pilot for modern journalism.
              </h1>
              <p className="max-w-2xl text-sm text-stone-200 lg:text-base">
                Draftly helps journalists and bloggers transform scattered sources into
                publication-ready drafts in minutes, so you spend less time on manual
                research and more time on reporting and storytelling.
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <article className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur">
              <p className="text-sm font-semibold">AI Content Generation</p>
              <p className="mt-1 text-xs text-stone-200">
                Create factual first drafts from multiple verified sources.
              </p>
            </article>
            <article className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur">
              <p className="text-sm font-semibold">Automated Research Assistance</p>
              <p className="mt-1 text-xs text-stone-200">
                Aggregate and synthesize key points without tab-switching fatigue.
              </p>
            </article>
            <article className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur">
              <p className="text-sm font-semibold">Seamless Publishing</p>
              <p className="mt-1 text-xs text-stone-200">
                Edit, refine, and export polished drafts from one workspace.
              </p>
            </article>
          </div>
        </section>

        <section className="flex items-center">
          <div className="w-full rounded-2xl border border-stone-200 bg-white p-6 shadow-sm lg:p-8">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
                Welcome back
              </p>
              <h2 className="text-2xl font-semibold text-stone-900">Sign in to Draftly</h2>
              <p className="text-sm text-stone-600">
                Access your newsroom workspace and continue writing.
              </p>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="space-y-4">
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
                <div>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-stone-700"
                    >
                      Password
                    </label>
                    <Link
                      href="/auth/forgot-password"
                      className="text-xs font-medium text-amber-900/80 underline-offset-4 hover:text-amber-950 hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="block w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-700/50 focus:outline-none"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#c9a06c] px-4 py-2.5 text-sm font-semibold text-[#1a120e] transition hover:bg-[#ddb77e] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>

              <p className="text-center text-sm text-stone-600">
                New to Draftly?{" "}
                <Link href="/auth/signup" className="font-semibold text-amber-900 hover:underline">
                  Create an account
                </Link>
              </p>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
