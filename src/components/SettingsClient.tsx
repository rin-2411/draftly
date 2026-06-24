"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { OUTPUT_LANGUAGE_OPTIONS } from "@/lib/output-languages";
import type { OutputLanguage } from "@/lib/output-languages";
import type { OutputLength, Tone } from "@/lib/types";
import { Download, Loader2, LogOut, Save, UserCircle } from "lucide-react";

type SettingsClientProps = {
  email: string | null;
  initialDisplayName: string | null;
  initialTone: Tone;
  initialLength: OutputLength;
  initialLanguage: OutputLanguage;
};

export function SettingsClient({
  email,
  initialDisplayName,
  initialTone,
  initialLength,
  initialLanguage,
}: SettingsClientProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName ?? "");
  const [tone, setTone] = useState<Tone>(initialTone);
  const [length, setLength] = useState<OutputLength>(initialLength);
  const [language, setLanguage] = useState<OutputLanguage>(initialLanguage);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const savePreferences = useCallback(async () => {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tone,
          length,
          language,
          display_name: displayName.trim() === "" ? "" : displayName.trim(),
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Could not save.");
      setMessage({ type: "ok", text: "Preferences saved. New drafts will use these defaults." });
      router.refresh();
    } catch (e) {
      setMessage({
        type: "err",
        text: e instanceof Error ? e.message : "Could not save.",
      });
    } finally {
      setSaving(false);
    }
  }, [displayName, language, length, router, tone]);

  const exportDrafts = useCallback(async () => {
    setExporting(true);
    setMessage(null);
    try {
      const response = await fetch("/api/drafts");
      const payload = (await response.json()) as { drafts?: unknown; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Export failed.");
      const blob = new Blob([JSON.stringify(payload.drafts ?? [], null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `draftly-drafts-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage({ type: "ok", text: "Download started." });
    } catch (e) {
      setMessage({
        type: "err",
        text: e instanceof Error ? e.message : "Export failed.",
      });
    } finally {
      setExporting(false);
    }
  }, []);

  const signOut = async () => {
    await fetch("/api/auth/signout", { method: "POST" });
    router.replace("/auth/login");
    router.refresh();
  };

  useEffect(() => {
    setDisplayName(initialDisplayName ?? "");
    setTone(initialTone);
    setLength(initialLength);
    setLanguage(initialLanguage);
  }, [initialDisplayName, initialTone, initialLength, initialLanguage]);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">Settings</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          Account and workspace defaults. Tone and length apply for new blank drafts in Overview
          (not when opening an existing draft or a template).
        </p>
      </header>

      {message && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            message.type === "ok"
              ? "border-[#c9a06c]/30 bg-[#c9a06c]/10 text-[#f0e6dc]"
              : "border-red-500/25 bg-red-950/40 text-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <section className="rounded-2xl border border-white/[0.06] bg-[#1a1614] p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-zinc-500">
          <UserCircle size={16} className="text-[#c9a06c]" aria-hidden />
          Account
        </h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="text-xs font-medium text-zinc-500">Email</dt>
            <dd className="mt-0.5 text-zinc-100">{email ?? "—"}</dd>
          </div>
          <div>
            <label htmlFor="display-name" className="text-xs font-medium text-zinc-500">
              Display name
            </label>
            <input
              id="display-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={120}
              placeholder="How you want to be addressed"
              className="mt-1 w-full rounded-xl border border-white/[0.08] bg-[#12100e] px-3 py-2 text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-[#c9a06c]/40"
            />
            <p className="mt-1 text-xs text-zinc-500">
              Optional. Clear and save to remove. Workspace only.
            </p>
          </div>
        </dl>
        <p className="mt-4 text-xs text-zinc-500">
          Password:{" "}
          <Link
            href="/auth/forgot-password"
            className="font-medium text-[#c9a06c] hover:underline"
          >
            Forgot password
          </Link>
        </p>
      </section>

      <section className="rounded-2xl border border-white/[0.06] bg-[#1a1614] p-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-500">
          Workspace defaults
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-zinc-500">
          Tone, length, and output language when you use Overview (including AI generation).
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1 sm:col-span-2">
            <label htmlFor="set-language" className="text-xs font-medium text-zinc-400">
              Default output language
            </label>
            <select
              id="set-language"
              value={language}
              onChange={(e) => setLanguage(e.target.value as OutputLanguage)}
              className="rounded-xl border border-white/[0.08] bg-[#12100e] px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[#c9a06c]/40"
            >
              {OUTPUT_LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1">
            <label htmlFor="set-tone" className="text-xs font-medium text-zinc-400">
              Default tone
            </label>
            <select
              id="set-tone"
              value={tone}
              onChange={(e) => setTone(e.target.value as Tone)}
              className="rounded-xl border border-white/[0.08] bg-[#12100e] px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[#c9a06c]/40"
            >
              <option value="formal">Formal</option>
              <option value="casual">Casual</option>
              <option value="opinionated">Opinionated</option>
            </select>
          </div>
          <div className="grid gap-1">
            <label htmlFor="set-length" className="text-xs font-medium text-zinc-400">
              Default length
            </label>
            <select
              id="set-length"
              value={length}
              onChange={(e) => setLength(e.target.value as OutputLength)}
              className="rounded-xl border border-white/[0.08] bg-[#12100e] px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[#c9a06c]/40"
            >
              <option value="short">Short</option>
              <option value="medium">Medium</option>
              <option value="long">Long</option>
            </select>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void savePreferences()}
          disabled={saving}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#c9a06c] px-4 py-2 text-sm font-semibold text-[#1a120e] transition hover:bg-[#ddb77e] disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save account & defaults
        </button>
      </section>

      <section className="rounded-2xl border border-white/[0.06] bg-[#1a1614] p-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-500">
          AI & generation
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          Generation uses <span className="font-medium text-zinc-100">GPT-4o</span> on the server.
          Model and API keys are set in environment variables.
        </p>
      </section>

      <section className="rounded-2xl border border-white/[0.06] bg-[#1a1614] p-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-500">Your data</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Download all drafts as JSON (titles, content, URLs, timestamps).
        </p>
        <button
          type="button"
          onClick={() => void exportDrafts()}
          disabled={exporting}
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.05] px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/[0.1] disabled:opacity-50"
        >
          {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          Export all drafts (JSON)
        </button>
      </section>

      <section className="rounded-2xl border border-red-500/20 bg-red-950/20 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-red-300/90">
          Session
        </h2>
        <p className="mt-2 text-sm text-zinc-400">Sign out on this device.</p>
        <button
          type="button"
          onClick={() => void signOut()}
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-950/30 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-950/50"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </section>
    </div>
  );
}
