"use client";

import { useEffect, useState } from "react";
import type { AdminDashboardStats } from "@/lib/admin/stats";

export function AdminDashboardClient() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/admin/stats");
      const data = (await res.json()) as { stats?: AdminDashboardStats; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to load stats.");
        return;
      }
      setStats(data.stats ?? null);
    })();
  }, []);

  if (error) {
    return <p className="text-sm text-red-300">{error}</p>;
  }
  if (!stats) {
    return <p className="text-sm text-zinc-500">Loading dashboard…</p>;
  }

  const cards = [
    { label: "Users", value: stats.total_users },
    { label: "Disabled accounts", value: stats.disabled_users },
    { label: "Total drafts", value: stats.total_drafts },
    { label: "Research sources", value: stats.total_research_sources },
    { label: "AI runs today", value: stats.generations_today },
    { label: "Failed runs today", value: stats.generations_today_failed },
    { label: "Crawl failures today", value: stats.crawl_failures_today },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Admin overview</h1>
      <p className="mt-1 text-sm text-zinc-500">Platform usage and health at a glance.</p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <li
            key={c.label}
            className="rounded-2xl border border-white/[0.06] bg-[#141210] p-5"
          >
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              {c.label}
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-[#ddb77e]">{c.value}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
