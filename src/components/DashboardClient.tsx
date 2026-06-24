"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { OUTPUT_LANGUAGE_OPTIONS } from "@/lib/output-languages";
import type { OutputLanguage } from "@/lib/output-languages";
import { DraftRecord, OutputLength, Tone } from "@/lib/types";
import { BookOpenText, Bot, Save, SendHorizontal, Sparkles, Undo2 } from "lucide-react";

type CrawlResultLite = {
  url: string;
  success: boolean;
  error: string | null;
};

type DraftResponse = {
  id: string;
  title: string | null;
  content: string;
};

type GenerateResponse = {
  draft: DraftResponse;
  crawlResults: CrawlResultLite[];
};

type InitialTemplatePrefill = {
  name: string;
  title: string;
  content: string;
  tone: Tone;
  length: OutputLength;
};

type EditorUndoSnapshot = {
  title: string;
  content: string;
  draftId: string | null;
  crawlResults: CrawlResultLite[];
};

export function DashboardClient({
  initialDraft,
  initialPrefillUrls,
  initialPrefillTemplate,
  workspaceDefaults,
}: {
  initialDraft?: DraftRecord | null;
  initialPrefillUrls?: string[];
  initialPrefillTemplate?: InitialTemplatePrefill;
  workspaceDefaults?: { tone: Tone; length: OutputLength; language: OutputLanguage };
}) {
  const router = useRouter();
  const skipHydrateFromSaveRef = useRef(false);

  const [workspaceMode, setWorkspaceMode] = useState<"writing" | "research">("writing");

  const [urls, setUrls] = useState<string[]>(() => {
    if (initialDraft?.source_urls?.length) return initialDraft.source_urls;
    if (initialPrefillUrls?.length) return [...initialPrefillUrls.slice(0, 5), ""];
    return [""];
  });
  const [tone, setTone] = useState<Tone>(
    initialDraft?.tone ??
      initialPrefillTemplate?.tone ??
      workspaceDefaults?.tone ??
      "formal"
  );
  const [length, setLength] = useState<OutputLength>(
    initialDraft?.length ??
      initialPrefillTemplate?.length ??
      workspaceDefaults?.length ??
      "medium"
  );
  const [language, setLanguage] = useState<OutputLanguage>(workspaceDefaults?.language ?? "auto");

  const [draftId, setDraftId] = useState<string | null>(initialDraft?.id ?? null);
  const [title, setTitle] = useState(
    initialDraft?.title ?? initialPrefillTemplate?.title ?? "Untitled Draft"
  );
  const [content, setContent] = useState(
    initialDraft?.content ?? initialPrefillTemplate?.content ?? ""
  );

  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [crawlResults, setCrawlResults] = useState<CrawlResultLite[]>([]);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [manualSaveLoading, setManualSaveLoading] = useState(false);
  const [researchInput, setResearchInput] = useState(() => {
    if (initialDraft?.source_urls?.length) return initialDraft.source_urls.join("\n");
    if (initialPrefillUrls?.length) return initialPrefillUrls.slice(0, 5).join("\n");
    return "";
  });

  const [undoStack, setUndoStack] = useState<EditorUndoSnapshot[]>([]);
  const MAX_UNDO = 25;

  const wordCount = useMemo(() => {
    const normalized = content.trim();
    if (!normalized) return 0;
    return normalized.split(/\s+/).length;
  }, [content]);

  useEffect(() => {
    if (!initialDraft) {
      skipHydrateFromSaveRef.current = false;
      return;
    }
    if (skipHydrateFromSaveRef.current) {
      skipHydrateFromSaveRef.current = false;
      return;
    }
    setDraftId(initialDraft.id);
    setTitle(initialDraft.title ?? "Untitled Draft");
    setContent(initialDraft.content);
    setUrls(initialDraft.source_urls);
    setTone(initialDraft.tone ?? "formal");
    setLength(initialDraft.length ?? "medium");
    setResearchInput(initialDraft.source_urls.join("\n"));
    setUndoStack([]);
    setSuccessMessage("Loaded draft.");
  }, [initialDraft]);

  useEffect(() => {
    if (initialDraft || (!initialPrefillUrls?.length && !initialPrefillTemplate)) return;

    if (initialPrefillUrls?.length) {
      setWorkspaceMode("research");
    } else if (initialPrefillTemplate) {
      setWorkspaceMode("writing");
    }

    const parts: string[] = [];
    if (initialPrefillTemplate) {
      parts.push(
        `Started from template “${initialPrefillTemplate.name}”. Replace [bracket] placeholders.`
      );
    }
    if (initialPrefillUrls?.length) {
      parts.push("Research Sources include your picked URLs.");
    }
    if (parts.length) setSuccessMessage(parts.join(" "));
  }, [initialDraft, initialPrefillUrls, initialPrefillTemplate]);

  useEffect(() => {
    if (!draftId || !content.trim()) return;
    const timer = setTimeout(async () => {
      setSaveState("saving");
      try {
        const response = await fetch(`/api/drafts/${draftId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim() || "Untitled Draft",
            content,
          }),
        });
        if (!response.ok) throw new Error("Save failed");
        setSaveState("saved");
        setLastSyncedAt(new Date().toLocaleTimeString());
      } catch {
        setSaveState("error");
      }
    }, 1300);
    return () => clearTimeout(timer);
  }, [draftId, title, content]);

  const validUrls = useMemo(
    () => urls.map((item) => item.trim()).filter((item) => item.length > 0),
    [urls]
  );

  const generate = async (overrideUrls?: string[]) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    const targetUrls = overrideUrls?.length ? overrideUrls : validUrls;
    if (targetUrls.length === 0) {
      setErrorMessage("Add at least one source URL.");
      return;
    }

    setStatus("loading");
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          urls: targetUrls,
          tone,
          length,
          language,
        }),
      });

      const payload = (await response.json()) as GenerateResponse & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Generation failed.");

      setUndoStack((prev) =>
        [
          ...prev,
          {
            title,
            content,
            draftId,
            crawlResults: crawlResults.map((c) => ({ ...c })),
          },
        ].slice(-MAX_UNDO)
      );

      setDraftId(payload.draft.id);
      setTitle(payload.draft.title ?? "Untitled Draft");
      setContent(payload.draft.content);
      setCrawlResults(payload.crawlResults);
      setStatus("success");
      setSuccessMessage("Draft generated and saved.");
      setLastSyncedAt(new Date().toLocaleTimeString());
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Generation failed.");
    }
  };

  const sourceUrlsForSave = useMemo(() => {
    const fromResearch = researchInput
      .split("\n")
      .map((u) => u.trim())
      .filter(Boolean);
    if (fromResearch.length) return fromResearch.slice(0, 5);
    return validUrls.slice(0, 5);
  }, [researchInput, validUrls]);

  const showSavedDraftInUrl = useCallback(
    (id: string) => {
      if (typeof window === "undefined") return;
      const current = new URLSearchParams(window.location.search).get("draftId");
      if (current === id) return;
      skipHydrateFromSaveRef.current = true;
      router.replace(`/drafts?draftId=${encodeURIComponent(id)}`);
    },
    [router]
  );

  const saveDraft = useCallback(async () => {
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      setErrorMessage("Add content to your draft before saving.");
      return;
    }

    setManualSaveLoading(true);
    setErrorMessage(null);
    setSaveState("saving");
    try {
      if (draftId) {
        const response = await fetch(`/api/drafts/${draftId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim() || "Untitled Draft",
            content: trimmedContent,
          }),
        });
        const payload = (await response.json()) as { error?: string };
        if (!response.ok) throw new Error(payload.error ?? "Save failed.");
        setSaveState("saved");
        setLastSyncedAt(new Date().toLocaleTimeString());
        setSuccessMessage("Draft saved. You can reopen it anytime from this page’s link.");
        showSavedDraftInUrl(draftId);
      } else {
        const response = await fetch("/api/drafts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim() || "Untitled Draft",
            content: trimmedContent,
            source_urls: sourceUrlsForSave,
            tone,
            length,
          }),
        });
        const payload = (await response.json()) as {
          draft?: { id: string };
          error?: string;
        };
        if (!response.ok) throw new Error(payload.error ?? "Save failed.");
        const newId = payload.draft?.id;
        if (newId) {
          setDraftId(newId);
          showSavedDraftInUrl(newId);
        }
        setSaveState("saved");
        setLastSyncedAt(new Date().toLocaleTimeString());
        setSuccessMessage(
          newId
            ? "Draft saved. The editor is now tied to this draft — use the link below to return later."
            : "Draft saved to your library."
        );
      }
    } catch (err) {
      setSaveState("error");
      setErrorMessage(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setManualSaveLoading(false);
    }
  }, [content, title, draftId, tone, length, sourceUrlsForSave, showSavedDraftInUrl]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        void saveDraft();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [saveDraft]);

  const undoLastAiChange = useCallback(() => {
    setUndoStack((stack) => {
      if (stack.length === 0) return stack;
      const snap = stack[stack.length - 1]!;
      setTitle(snap.title);
      setContent(snap.content);
      setDraftId(snap.draftId);
      setCrawlResults(snap.crawlResults.map((c) => ({ ...c })));
      skipHydrateFromSaveRef.current = true;
      if (snap.draftId) {
        router.replace(`/drafts?draftId=${encodeURIComponent(snap.draftId)}`);
      } else {
        router.replace("/drafts");
      }
      setErrorMessage(null);
      setSuccessMessage("Restored your draft to before the last AI run.");
      setStatus("idle");
      return stack.slice(0, -1);
    });
  }, [router]);

  const triggerAssistantAction = async (action: "outline" | "research" | "factcheck") => {
    const parsedUrls = researchInput
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
    setUrls(parsedUrls.length ? parsedUrls : [""]);

    if (action === "outline") {
      setTone("formal");
      setLength("short");
    } else if (action === "research") {
      setTone("formal");
      setLength("long");
    } else {
      setTone("formal");
      setLength("medium");
    }
    setWorkspaceMode("research");
    await generate(parsedUrls);
    setWorkspaceMode("writing");
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">Overview</h1>
          <p className="mt-1 text-sm text-zinc-500">Write, research sources, and AI-assisted drafting.</p>
        </div>
      </div>

      <div className="relative min-h-[calc(100vh-12rem)] overflow-hidden rounded-2xl border border-white/[0.06] bg-[#141210] shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
        <div className="grid min-h-[calc(100vh-14rem)] grid-cols-1 lg:grid-cols-[1fr_320px]">
          <main className="relative flex flex-col bg-[#12100e]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3 md:px-5">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setWorkspaceMode("writing")}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                    workspaceMode === "writing"
                      ? "bg-[#c9a06c] text-[#1a120e]"
                      : "border border-white/[0.08] bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08]"
                  }`}
                >
                  Writing
                </button>
                <button
                  type="button"
                  onClick={() => setWorkspaceMode("research")}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                    workspaceMode === "research"
                      ? "bg-[#c9a06c] text-[#1a120e]"
                      : "border border-white/[0.08] bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08]"
                  }`}
                >
                  Research
                </button>
                <button
                  type="button"
                  onClick={() => void saveDraft()}
                  disabled={manualSaveLoading || status === "loading"}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.06] px-3 py-1.5 text-sm font-medium text-zinc-200 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-50"
                  title="Save draft (Ctrl+S or Cmd+S)"
                >
                  <Save size={16} aria-hidden />
                  {manualSaveLoading ? "Saving…" : "Save draft"}
                </button>
                <button
                  type="button"
                  onClick={() => undoLastAiChange()}
                  disabled={undoStack.length === 0 || status === "loading" || manualSaveLoading}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.06] px-3 py-1.5 text-sm font-medium text-zinc-200 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-50"
                  title="Undo the last AI-generated draft (title, body, and saved draft link)"
                >
                  <Undo2 size={16} aria-hidden />
                  Undo
                </button>
              </div>
              <div className="text-xs text-zinc-500">
                {saveState === "saving" && "Live save: syncing…"}
                {saveState === "saved" && "Live save: synced"}
                {saveState === "error" && "Live save: failed"}
                {saveState === "idle" && "Live save: ready"}
              </div>
            </div>

            <div className="h-full flex-1 overflow-auto px-4 pb-28 pt-5 md:px-6 md:pb-24 md:pt-6">
              <div className="mx-auto w-full max-w-4xl rounded-2xl border border-white/[0.06] bg-[#1a1614] px-6 py-7 shadow-inner md:px-8 md:py-8">
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Untitled Draft"
                  className="mb-5 w-full border-none bg-transparent text-2xl font-semibold tracking-tight text-white placeholder:text-zinc-600 outline-none md:text-3xl"
                />
                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="Start writing your story…"
                  className="min-h-[min(560px,calc(100vh-22rem))] w-full resize-y border-none bg-transparent font-sans text-[1.05rem] leading-8 text-zinc-200 placeholder:text-zinc-600 outline-none"
                />
              </div>
            </div>
          </main>

          <aside className="border-t border-white/[0.06] bg-[#141210] p-4 lg:border-l lg:border-t-0">
            <div className="mb-3 flex items-center gap-2">
              <Bot size={18} className="text-[#c9a06c]" />
              <h2 className="text-sm font-semibold tracking-wide text-zinc-100">Assistant</h2>
            </div>

            <div className="space-y-3 rounded-2xl border border-white/[0.06] bg-[#1a1614] p-3">
              <label className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                Research sources
              </label>
              <textarea
                value={researchInput}
                onChange={(event) => setResearchInput(event.target.value)}
                placeholder={"https://site.com/article-1\nhttps://site.com/article-2"}
                className="min-h-[120px] w-full rounded-xl border border-white/[0.08] bg-[#12100e] px-3 py-2 text-xs leading-5 text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-[#c9a06c]/40"
              />
              <div className="grid gap-2">
                <button
                  type="button"
                  disabled={status === "loading"}
                  onClick={() => triggerAssistantAction("research")}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#c9a06c] px-3 py-2 text-xs font-semibold text-[#1a120e] transition hover:bg-[#ddb77e] disabled:opacity-50"
                >
                  <Sparkles size={14} />
                  Research full draft
                </button>
                <button
                  type="button"
                  disabled={status === "loading"}
                  onClick={() => triggerAssistantAction("outline")}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-xs font-medium text-zinc-200 transition hover:bg-white/[0.08] disabled:opacity-50"
                >
                  <BookOpenText size={14} />
                  Generate outline
                </button>
                <button
                  type="button"
                  disabled={status === "loading"}
                  onClick={() => triggerAssistantAction("factcheck")}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-xs font-medium text-zinc-200 transition hover:bg-white/[0.08] disabled:opacity-50"
                >
                  <SendHorizontal size={14} />
                  Check facts
                </button>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                  Output language
                </label>
                <select
                  value={language}
                  onChange={(event) => setLanguage(event.target.value as OutputLanguage)}
                  className="w-full rounded-xl border border-white/[0.08] bg-[#12100e] px-2 py-2 text-xs text-zinc-200 outline-none focus:border-[#c9a06c]/40"
                >
                  {OUTPUT_LANGUAGE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <select
                  value={tone}
                  onChange={(event) => setTone(event.target.value as Tone)}
                  className="rounded-xl border border-white/[0.08] bg-[#12100e] px-2 py-2 text-xs text-zinc-200 outline-none focus:border-[#c9a06c]/40"
                >
                  <option value="formal">Formal</option>
                  <option value="casual">Casual</option>
                  <option value="opinionated">Opinionated</option>
                </select>
                <select
                  value={length}
                  onChange={(event) => setLength(event.target.value as OutputLength)}
                  className="rounded-xl border border-white/[0.08] bg-[#12100e] px-2 py-2 text-xs text-zinc-200 outline-none focus:border-[#c9a06c]/40"
                >
                  <option value="short">Short</option>
                  <option value="medium">Medium</option>
                  <option value="long">Long</option>
                </select>
                </div>
              </div>
            </div>

            {(errorMessage || successMessage) && (
              <div className="mt-3 space-y-2">
                {errorMessage && (
                  <p className="rounded-xl border border-red-500/25 bg-red-950/40 px-3 py-2 text-xs text-red-200">
                    {errorMessage}
                  </p>
                )}
                {successMessage && (
                  <p className="rounded-xl border border-[#c9a06c]/25 bg-[#c9a06c]/10 px-3 py-2 text-xs text-[#edd9c8]">
                    {successMessage}
                  </p>
                )}
              </div>
            )}

            {draftId && (
              <div className="mt-3 rounded-2xl border border-white/[0.06] bg-[#1a1614] p-3">
                <p className="text-xs font-semibold text-zinc-200">Saved draft</p>
                <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
                  Open the same draft later or in another tab.
                </p>
                <Link
                  href={`/drafts?draftId=${encodeURIComponent(draftId)}`}
                  className="mt-2 inline-block text-xs font-medium text-[#c9a06c] underline decoration-[#c9a06c]/40 underline-offset-2 hover:text-[#ddb77e]"
                >
                  View saved draft
                </Link>
              </div>
            )}

            {crawlResults.length > 0 && (
              <div className="mt-3 rounded-2xl border border-white/[0.06] bg-[#1a1614] p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500">
                  Latest crawl
                </p>
                <div className="space-y-1">
                  {crawlResults.map((item) => (
                    <p key={item.url} className="text-[11px] text-zinc-400">
                      {item.success ? "OK" : "Failed"} — {item.url}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>

        <footer className="absolute bottom-0 left-0 right-0 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] bg-[#141210]/95 px-4 py-2.5 text-[11px] text-zinc-500 backdrop-blur-sm md:text-xs">
          <span>Words: {wordCount}</span>
          <span className="hidden sm:inline">Last synced: {lastSyncedAt ?? "—"}</span>
          <span>GPT-4o</span>
        </footer>
      </div>
    </div>
  );
}
