import Link from "next/link";
import { BUILTIN_STORY_TEMPLATES } from "@/lib/templates/builtins";

const toneLabel: Record<string, string> = {
  formal: "Formal",
  casual: "Casual",
  opinionated: "Opinionated",
};

const lengthLabel: Record<string, string> = {
  short: "Short",
  medium: "Medium",
  long: "Long",
};

export default function TemplatesPage() {
  return (
    <section className="rounded-2xl border border-white/[0.06] bg-[#141210] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] md:p-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">Templates</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
          Built-in newsroom structures. Each sets a suggested{" "}
          <span className="font-medium text-zinc-200">title</span>,{" "}
          <span className="font-medium text-zinc-200">outline</span>, and default{" "}
          <span className="font-medium text-zinc-200">tone / length</span>. Open in{" "}
          <Link
            href="/drafts"
            className="font-medium text-[#c9a06c] underline-offset-2 hover:underline"
          >
            Overview
          </Link>{" "}
          to write, then add URLs or use the assistant.
        </p>
      </header>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {BUILTIN_STORY_TEMPLATES.map((t) => (
          <li
            key={t.id}
            className="flex flex-col rounded-2xl border border-white/[0.06] bg-[#1a1614] p-5 transition hover:border-[#c9a06c]/20"
          >
            <h2 className="text-base font-semibold text-zinc-100">{t.name}</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-400">{t.description}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[11px] font-medium text-zinc-300 ring-1 ring-white/[0.08]">
                {toneLabel[t.tone] ?? t.tone}
              </span>
              <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[11px] font-medium text-zinc-300 ring-1 ring-white/[0.08]">
                {lengthLabel[t.length] ?? t.length}
              </span>
            </div>
            <div className="mt-4">
              <Link
                href={`/drafts?template=${encodeURIComponent(t.id)}`}
                className="inline-flex items-center justify-center rounded-full bg-[#c9a06c] px-4 py-2 text-sm font-semibold text-[#1a120e] transition hover:bg-[#ddb77e]"
              >
                Use in Overview
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
