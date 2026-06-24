import { DashboardClient } from "@/components/DashboardClient";
import { createClient } from "@/config/supabase/server";
import { getDraftById } from "@/lib/drafts";
import { getBuiltinTemplateById } from "@/lib/templates/builtins";
import { getWorkspaceDefaultsFromMetadata } from "@/lib/user-preferences";

type DraftsPageProps = {
  searchParams: Promise<{
    draftId?: string;
    prefillUrls?: string;
    template?: string;
  }>;
};

function parsePrefillUrls(raw: string | undefined): string[] | undefined {
  if (!raw || typeof raw !== "string") return undefined;
  try {
    const decoded = decodeURIComponent(raw);
    const lines = decoded
      .split("\n")
      .map((u) => u.trim())
      .filter((u) => u.startsWith("http://") || u.startsWith("https://"));
    const unique = [...new Set(lines)].slice(0, 5);
    return unique.length ? unique : undefined;
  } catch {
    return undefined;
  }
}

export default async function DraftsPage({ searchParams }: DraftsPageProps) {
  const { draftId, prefillUrls, template } = await searchParams;
  let initialDraft = null;

  if (draftId) {
    try {
      initialDraft = await getDraftById(draftId);
    } catch {
      initialDraft = null;
    }
  }

  const initialPrefillUrls = !draftId ? parsePrefillUrls(prefillUrls) : undefined;

  const initialPrefillTemplate =
    !draftId && template && typeof template === "string"
      ? (() => {
          const t = getBuiltinTemplateById(template);
          if (!t) return undefined;
          return {
            name: t.name,
            title: t.title,
            content: t.content,
            tone: t.tone,
            length: t.length,
          };
        })()
      : undefined;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const workspaceDefaults = getWorkspaceDefaultsFromMetadata(
    (user?.user_metadata ?? {}) as Record<string, unknown>
  );

  return (
    <DashboardClient
      initialDraft={initialDraft}
      initialPrefillUrls={initialPrefillUrls}
      initialPrefillTemplate={initialPrefillTemplate}
      workspaceDefaults={workspaceDefaults}
    />
  );
}
