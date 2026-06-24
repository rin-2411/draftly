"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminDraftRow } from "@/lib/admin/drafts";

export function AdminDraftsClient() {
  const [drafts, setDrafts] = useState<AdminDraftRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async (q?: string) => {
    setLoading(true);
    setError(null);
    const params = q?.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
    const res = await fetch(`/api/admin/drafts${params}`);
    const data = (await res.json()) as { drafts?: AdminDraftRow[]; error?: string };
    if (!res.ok) {
      setError(data.error ?? "Failed to load drafts.");
      setLoading(false);
      return;
    }
    setDrafts(data.drafts ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const deleteDraft = async (id: string) => {
    if (!confirm("Delete this draft permanently?")) return;
    const res = await fetch(`/api/admin/drafts/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Delete failed.");
      return;
    }
    await load(search);
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Drafts</h1>
      <p className="mt-1 text-sm text-zinc-500">Search and moderate all user drafts.</p>
      <form
        className="mt-6 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void load(search);
        }}
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title…"
          className="flex-1 rounded-xl border border-white/[0.08] bg-[#12100e] px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[#c9a06c]/40"
        />
        <button
          type="submit"
          className="rounded-full bg-[#c9a06c] px-4 py-2 text-sm font-semibold text-[#1a120e]"
        >
          Search
        </button>
      </form>
      {error && (
        <p className="mt-4 rounded-xl border border-red-500/25 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}
      {loading ? (
        <p className="mt-6 text-sm text-zinc-500">Loading drafts…</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {drafts.map((d) => (
            <li
              key={d.id}
              className="rounded-2xl border border-white/[0.06] bg-[#141210] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-zinc-100">{d.title ?? "Untitled Draft"}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {d.user_email ?? d.user_id} · {new Date(d.updated_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}
                    className="rounded-full border border-white/[0.1] px-3 py-1 text-xs hover:bg-white/[0.06]"
                  >
                    {expandedId === d.id ? "Hide" : "View"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteDraft(d.id)}
                    className="rounded-full border border-red-500/30 px-3 py-1 text-xs text-red-300 hover:bg-red-950/30"
                  >
                    Delete
                  </button>
                </div>
              </div>
              {expandedId === d.id && (
                <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded-xl bg-[#12100e] p-3 text-xs leading-relaxed text-zinc-400">
                  {d.content.slice(0, 4000)}
                  {d.content.length > 4000 ? "\n\n…" : ""}
                </pre>
              )}
            </li>
          ))}
          {drafts.length === 0 && (
            <p className="text-center text-sm text-zinc-500">No drafts match.</p>
          )}
        </ul>
      )}
    </div>
  );
}
