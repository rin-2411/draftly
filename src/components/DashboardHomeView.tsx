import Link from "next/link";
import {
  ArrowRight,
  FileText,
  FolderOpen,
  LayoutList,
  Library,
  PenLine,
  Sparkles,
} from "lucide-react";
import { getDashboardDraftHome } from "@/lib/drafts";

function formatUpdated(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export async function DashboardHomeView({
  greetingName,
  announcement = "",
}: {
  greetingName: string | null;
  announcement?: string;
}) {
  let total = 0;
  let updatedThisWeek = 0;
  let recent: Awaited<ReturnType<typeof getDashboardDraftHome>>["recent"] = [];

  try {
    const data = await getDashboardDraftHome();
    total = data.total;
    updatedThisWeek = data.updatedThisWeek;
    recent = data.recent;
  } catch {
    // RLS or network — show empty state
  }

  const headline = greetingName ? `Welcome back, ${greetingName}` : "Welcome to your newsroom";

  return (
    <div className="space-y-8">
      {announcement.trim() ? (
        <p className="rounded-xl border border-[#c9a06c]/25 bg-[#c9a06c]/10 px-4 py-3 text-sm leading-relaxed text-[#edd9c8]">
          {announcement.trim()}
        </p>
      ) : null}
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Dashboard</p>
        <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">{headline}</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-zinc-400">
          Pick up where you left off, jump into the editor, or manage research and templates from
          one place.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/[0.06] bg-[#1a1614] p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Saved drafts</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-white">{total}</p>
          <p className="mt-1 text-xs text-zinc-500">All drafts in your workspace</p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-[#1a1614] p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Active this week</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-[#ddb77e]">{updatedThisWeek}</p>
          <p className="mt-1 text-xs text-zinc-500">Touched in the last 7 days</p>
        </div>
        <div className="rounded-2xl border border-[#c9a06c]/20 bg-[#c9a06c]/10 p-5 sm:col-span-2 lg:col-span-1">
          <p className="text-xs font-medium uppercase tracking-wide text-[#e8c49a]/90">Model</p>
          <p className="mt-2 text-lg font-semibold text-[#f0dcc8]">GPT-4o</p>
          <p className="mt-1 text-xs text-[#c9a06c]/80">Generation & assistant actions</p>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-500">Quick actions</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <li>
            <Link
              href="/drafts"
              className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-[#1a1614] p-4 transition hover:border-[#c9a06c]/35 hover:bg-[#1f1b18]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c9a06c]/15 text-[#ddb77e]">
                <PenLine size={20} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-zinc-100">New / Overview</p>
                <p className="text-xs text-zinc-500">Write & generate</p>
              </div>
              <ArrowRight className="shrink-0 text-zinc-600" size={18} aria-hidden />
            </Link>
          </li>
          <li>
            <Link
              href="/saved-drafts"
              className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-[#1a1614] p-4 transition hover:border-[#c9a06c]/35 hover:bg-[#1f1b18]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] text-zinc-300">
                <LayoutList size={20} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-zinc-100">Saved drafts</p>
                <p className="text-xs text-zinc-500">Grid of all drafts</p>
              </div>
              <ArrowRight className="shrink-0 text-zinc-600" size={18} aria-hidden />
            </Link>
          </li>
          <li>
            <Link
              href="/research"
              className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-[#1a1614] p-4 transition hover:border-[#c9a06c]/35 hover:bg-[#1f1b18]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] text-zinc-300">
                <Library size={20} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-zinc-100">Research library</p>
                <p className="text-xs text-zinc-500">URLs & tags</p>
              </div>
              <ArrowRight className="shrink-0 text-zinc-600" size={18} aria-hidden />
            </Link>
          </li>
          <li>
            <Link
              href="/templates"
              className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-[#1a1614] p-4 transition hover:border-[#c9a06c]/35 hover:bg-[#1f1b18]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] text-zinc-300">
                <FolderOpen size={20} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-zinc-100">Templates</p>
                <p className="text-xs text-zinc-500">Story structures</p>
              </div>
              <ArrowRight className="shrink-0 text-zinc-600" size={18} aria-hidden />
            </Link>
          </li>
        </ul>
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-[#1a1614] p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-zinc-500">
            <FileText size={16} className="text-[#c9a06c]" aria-hidden />
            Recent drafts
          </h2>
          <Link
            href="/saved-drafts"
            className="text-xs font-medium text-[#e8c49a] hover:underline"
          >
            View all
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-dashed border-white/[0.1] py-10 text-center">
            <Sparkles className="text-zinc-600" size={28} aria-hidden />
            <p className="max-w-sm text-sm text-zinc-500">
              No drafts yet. Open Overview to write something or run research to generate your first
              story.
            </p>
            <Link
              href="/drafts"
              className="rounded-full bg-[#c9a06c] px-4 py-2 text-sm font-semibold text-[#1a120e] hover:bg-[#ddb77e]"
            >
              Go to Overview
            </Link>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-white/[0.06]">
            {recent.map((d) => (
              <li key={d.id}>
                <Link
                  href={`/drafts?draftId=${encodeURIComponent(d.id)}`}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 transition hover:text-[#e8c49a]"
                >
                  <span className="min-w-0 truncate font-medium text-zinc-100">
                    {d.title?.trim() || "Untitled draft"}
                  </span>
                  <span className="shrink-0 text-[11px] tabular-nums text-zinc-500">
                    {formatUpdated(d.updated_at)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
