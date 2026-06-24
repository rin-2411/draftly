"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { DraftRecord } from "@/lib/types";
import { FileText, Loader2 } from "lucide-react";

function formatDraftTime(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

/** Plain-text snippet for the preview pane (strip simple HTML-ish tags). */
function previewSnippet(content: string, maxLen = 220): string {
  const stripped = content
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!stripped) return "No content yet — open to start writing.";
  return stripped.length > maxLen ? `${stripped.slice(0, maxLen).trim()}…` : stripped;
}

function hoursSince(iso: string): number {
  try {
    return (Date.now() - new Date(iso).getTime()) / 36e5;
  } catch {
    return Infinity;
  }
}

function draftBadge(draft: DraftRecord): { label: string; className: string } | null {
  const h = hoursSince(draft.updated_at);
  if (h <= 36) {
    return {
      label: "New",
      className: "bg-amber-500/90 text-[#1a1008] ring-1 ring-amber-400/50",
    };
  }
  if (h <= 168) {
    return {
      label: "Updated",
      className: "bg-[#c9a06c]/25 text-[#edd9c8] ring-1 ring-[#c9a06c]/30",
    };
  }
  return null;
}

export function SavedDraftsClient() {
  const [drafts, setDrafts] = useState<DraftRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/drafts");
      const payload = (await response.json()) as { drafts?: DraftRecord[]; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Could not load drafts.");
      setDrafts(payload.drafts ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load drafts.");
      setDrafts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-[1400px] space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">Saved drafts</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400">
            Choose a card to open in the editor, or go to{" "}
            <Link
              href="/drafts"
              className="font-medium text-[#c9a06c] underline-offset-2 hover:underline"
            >
              Overview
            </Link>{" "}
            to start a new draft.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="rounded-full border border-white/[0.1] bg-white/[0.05] px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/[0.1] disabled:opacity-50"
        >
          Refresh
        </button>
      </header>

      {error && (
        <div className="rounded-xl border border-red-500/25 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-white/[0.06] bg-[#1a1614]">
          <p className="flex items-center gap-2 text-sm text-zinc-500">
            <Loader2 size={20} className="animate-spin" aria-hidden />
            Loading drafts…
          </p>
        </div>
      ) : drafts.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/[0.06] bg-[#1a1614] py-16 text-center">
          <FileText className="text-zinc-600" size={44} strokeWidth={1.25} aria-hidden />
          <p className="max-w-sm text-sm text-zinc-400">
            No drafts yet. Generate from research or write and save from Overview.
          </p>
          <Link
            href="/drafts"
            className="rounded-full bg-[#c9a06c] px-5 py-2.5 text-sm font-semibold text-[#1a120e] hover:bg-[#ddb77e]"
          >
            Go to Overview
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {drafts.map((draft) => {
            const badge = draftBadge(draft);
            const title = draft.title?.trim() || "Untitled draft";
            const snippet = previewSnippet(draft.content ?? "");

            return (
              <li key={draft.id} className="min-w-0">
                <Link
                  href={`/drafts?draftId=${encodeURIComponent(draft.id)}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#1a1614] shadow-[0_8px_30px_rgba(0,0,0,0.35)] ring-1 ring-white/[0.04] transition duration-200 hover:-translate-y-0.5 hover:border-[#c9a06c]/35 hover:shadow-[0_12px_40px_rgba(0,0,0,0.45),0_0_0_1px_rgba(201,160,108,0.22)]"
                >
                  <div className="relative aspect-[3/4] min-h-[160px] shrink-0 border-b border-zinc-200/80 bg-gradient-to-b from-zinc-50 to-zinc-100 p-3 shadow-inner">
                    <div className="pointer-events-none flex h-full flex-col rounded-md border border-zinc-200/90 bg-white/90 px-2.5 py-2 shadow-sm">
                      <div className="mb-2 h-1.5 w-2/3 rounded-full bg-zinc-200" aria-hidden />
                      <div className="mb-1.5 h-1 w-full rounded-full bg-zinc-100" aria-hidden />
                      <p className="line-clamp-10 text-[9px] leading-[1.45] text-zinc-700 font-serif">
                        {snippet}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col gap-1.5 p-3 pt-3">
                    <div className="flex min-h-[1.25rem] flex-wrap items-center gap-1.5">
                      {badge && (
                        <span
                          className={`inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      )}
                    </div>
                    <h2 className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-100 group-hover:text-[#ddb77e]">
                      {title}
                    </h2>
                    <p className="mt-auto text-[11px] leading-tight text-zinc-500">
                      {formatDraftTime(draft.updated_at)}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
