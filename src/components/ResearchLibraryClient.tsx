"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ResearchSourceRecord } from "@/lib/types";
import {
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

function hostnameFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.slice(0, 48);
  }
}

function parseTagsInput(raw: string): string[] {
  const parts = raw.split(",").map((t) => t.trim()).filter(Boolean);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of parts) {
    if (out.length >= 24) break;
    const key = p.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}

function formatWhen(iso: string) {
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

function draftsPrefillHref(urls: string[]): string {
  const unique = [...new Set(urls.map((u) => u.trim()).filter(Boolean))].slice(0, 5);
  const q = encodeURIComponent(unique.join("\n"));
  return `/drafts?prefillUrls=${q}`;
}

export function ResearchLibraryClient() {
  const [sources, setSources] = useState<ResearchSourceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [panelSource, setPanelSource] = useState<ResearchSourceRecord | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/research-library");
      const payload = (await response.json()) as {
        sources?: ResearchSourceRecord[];
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error ?? "Could not load sources.");
      setSources(payload.sources ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load sources.");
      setSources([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedUrls = useMemo(() => {
    const map = new Map(sources.map((s) => [s.id, s.url]));
    return [...selected].map((id) => map.get(id)).filter(Boolean) as string[];
  }, [sources, selected]);

  const openPanel = (s: ResearchSourceRecord) => {
    setPanelSource(s);
    setEditUrl(s.url);
    setEditTitle(s.title ?? "");
    setEditTags((s.tags ?? []).join(", "));
    setEditNotes(s.notes ?? "");
  };

  const closePanel = () => {
    setPanelSource(null);
    setSavingEdit(false);
    setDeleting(false);
  };

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const tags = parseTagsInput(tagsInput);
      const response = await fetch("/api/research-library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          title: title.trim() || null,
          notes: notes.trim() || null,
          tags,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Could not save.");
      setUrl("");
      setTitle("");
      setTagsInput("");
      setNotes("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!panelSource) return;
    setSavingEdit(true);
    setError(null);
    try {
      const tags = parseTagsInput(editTags);
      const response = await fetch(`/api/research-library/${panelSource.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: editUrl.trim(),
          title: editTitle.trim() || null,
          notes: editNotes.trim() || null,
          tags,
        }),
      });
      const payload = (await response.json()) as { source?: ResearchSourceRecord; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Could not update.");
      if (payload.source) {
        setPanelSource(payload.source);
        setSources((prev) =>
          prev.map((x) => (x.id === payload.source!.id ? payload.source! : x))
        );
      } else {
        await load();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!panelSource) return;
    setDeleting(true);
    setError(null);
    try {
      const response = await fetch(`/api/research-library/${panelSource.id}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Could not delete.");
      closePanel();
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(panelSource.id);
        return next;
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
          Research Library
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
          Save URLs, tag them, and open them in{" "}
          <Link
            href="/drafts"
            className="font-medium text-[#c9a06c] underline-offset-2 hover:underline"
          >
            Overview
          </Link>{" "}
          with the research panel prefilled (up to five links per run).
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-red-500/25 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-white/[0.06] bg-[#1a1614] p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-zinc-500">
          <Plus size={16} className="text-[#c9a06c]" aria-hidden />
          Add a source
        </h2>
        <form onSubmit={handleAdd} className="mt-4 grid gap-4">
          <div className="grid gap-1">
            <label htmlFor="src-url" className="text-xs font-medium text-zinc-400">
              URL <span className="text-red-400">*</span>
            </label>
            <input
              id="src-url"
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/article"
              className="rounded-xl border border-white/[0.08] bg-[#12100e] px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-[#c9a06c]/40"
            />
          </div>
          <div className="grid gap-1">
            <label htmlFor="src-title" className="text-xs font-medium text-zinc-400">
              Label <span className="font-normal text-zinc-600">(optional)</span>
            </label>
            <input
              id="src-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Short name you will recognize"
              className="rounded-xl border border-white/[0.08] bg-[#12100e] px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-[#c9a06c]/40"
            />
          </div>
          <div className="grid gap-1">
            <label htmlFor="src-tags" className="text-xs font-medium text-zinc-400">
              Tags <span className="font-normal text-zinc-600">(comma-separated)</span>
            </label>
            <input
              id="src-tags"
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="politics, climate, interview"
              className="rounded-xl border border-white/[0.08] bg-[#12100e] px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-[#c9a06c]/40"
            />
          </div>
          <div className="grid gap-1">
            <label htmlFor="src-notes" className="text-xs font-medium text-zinc-400">
              Notes
            </label>
            <textarea
              id="src-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Why this source matters, quotes to chase, etc."
              className="rounded-xl border border-white/[0.08] bg-[#12100e] px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-[#c9a06c]/40"
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-full bg-[#c9a06c] px-4 py-2 text-sm font-semibold text-[#1a120e] transition hover:bg-[#ddb77e] disabled:opacity-50"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
              Save to library
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-white/[0.06] bg-[#1a1614] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-500">
            Your sources
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={draftsPrefillHref(selectedUrls)}
              className={`inline-flex items-center rounded-full border px-3 py-2 text-sm font-medium transition ${
                selectedUrls.length === 0
                  ? "pointer-events-none border-white/[0.06] text-zinc-600"
                  : "border-[#c9a06c]/40 bg-[#c9a06c] text-[#1a120e] hover:bg-[#ddb77e]"
              }`}
              aria-disabled={selectedUrls.length === 0}
              onClick={(e) => {
                if (selectedUrls.length === 0) e.preventDefault();
              }}
            >
              Open selected in Overview
            </Link>
          </div>
        </div>

        {loading ? (
          <p className="mt-6 flex items-center gap-2 text-sm text-zinc-500">
            <Loader2 size={16} className="animate-spin" />
            Loading…
          </p>
        ) : sources.length === 0 ? (
          <p className="mt-6 text-sm text-zinc-500">
            No saved sources yet. Add a URL above to start your library.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-white/[0.06]">
            {sources.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-start gap-3 py-4 first:pt-0 last:pb-0"
              >
                <input
                  type="checkbox"
                  checked={selected.has(s.id)}
                  onChange={() => toggleSelect(s.id)}
                  className="mt-1.5 h-4 w-4 rounded border-white/20 bg-[#12100e] text-[#c9a06c]"
                  aria-label={`Select ${s.title || hostnameFromUrl(s.url)}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-zinc-100">
                    {s.title?.trim() || hostnameFromUrl(s.url)}
                  </p>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 inline-flex items-center gap-1 text-xs text-[#c9a06c] hover:underline"
                  >
                    {s.url.length > 72 ? `${s.url.slice(0, 72)}…` : s.url}
                    <ExternalLink size={12} aria-hidden />
                  </a>
                  {s.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {s.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] text-zinc-300 ring-1 ring-white/[0.08]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="mt-1 text-[11px] text-zinc-500">Updated {formatWhen(s.updated_at)}</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openPanel(s)}
                    className="inline-flex items-center gap-1 rounded-full border border-white/[0.1] bg-white/[0.05] px-2 py-1.5 text-xs font-medium text-zinc-200 hover:bg-white/[0.1]"
                  >
                    <Pencil size={14} aria-hidden />
                    Edit
                  </button>
                  <Link
                    href={draftsPrefillHref([s.url])}
                    className="inline-flex items-center gap-1 rounded-full border border-white/[0.1] bg-white/[0.05] px-2 py-1.5 text-xs font-medium text-zinc-200 hover:bg-white/[0.1]"
                  >
                    Use in drafts
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {panelSource && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/60 p-4 backdrop-blur-sm md:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="panel-title"
          onClick={closePanel}
        >
          <div
            className="flex h-full w-full max-w-lg flex-col rounded-2xl border border-white/[0.08] bg-[#161311] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
              <h3 id="panel-title" className="text-sm font-semibold text-zinc-100">
                Edit source
              </h3>
              <button
                type="button"
                onClick={closePanel}
                className="rounded-lg p-1 text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-200"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="grid gap-3">
                <div className="grid gap-1">
                  <label className="text-xs font-medium text-zinc-400">URL</label>
                  <input
                    type="url"
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                    className="rounded-xl border border-white/[0.08] bg-[#12100e] px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[#c9a06c]/40"
                  />
                </div>
                <div className="grid gap-1">
                  <label className="text-xs font-medium text-zinc-400">Label</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="rounded-xl border border-white/[0.08] bg-[#12100e] px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[#c9a06c]/40"
                  />
                </div>
                <div className="grid gap-1">
                  <label className="text-xs font-medium text-zinc-400">Tags</label>
                  <input
                    type="text"
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    className="rounded-xl border border-white/[0.08] bg-[#12100e] px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[#c9a06c]/40"
                  />
                </div>
                <div className="grid gap-1">
                  <label className="text-xs font-medium text-zinc-400">Notes</label>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    rows={5}
                    className="rounded-xl border border-white/[0.08] bg-[#12100e] px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[#c9a06c]/40"
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] px-4 py-3">
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-950/40 px-3 py-2 text-sm font-medium text-red-200 hover:bg-red-950/60 disabled:opacity-50"
              >
                {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Delete
              </button>
              <div className="flex gap-2">
                <Link
                  href={draftsPrefillHref([panelSource.url])}
                  className="rounded-full border border-white/[0.1] bg-white/[0.05] px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-white/[0.1]"
                >
                  Open in Overview
                </Link>
                <button
                  type="button"
                  onClick={() => void handleSaveEdit()}
                  disabled={savingEdit}
                  className="inline-flex items-center gap-2 rounded-full bg-[#c9a06c] px-3 py-2 text-sm font-semibold text-[#1a120e] hover:bg-[#ddb77e] disabled:opacity-50"
                >
                  {savingEdit ? <Loader2 size={16} className="animate-spin" /> : null}
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
