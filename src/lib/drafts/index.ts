import { createClient } from "@/config/supabase/server";
import { DraftRecord, OutputLength, Tone } from "@/lib/types";

type CreateDraftInput = {
  title?: string;
  content: string;
  sourceUrls: string[];
  tone: Tone;
  length: OutputLength;
};

type UpdateDraftInput = {
  title?: string;
  content: string;
};

async function getUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return user.id;
}

export async function createDraft(input: CreateDraftInput): Promise<DraftRecord> {
  const supabase = await createClient();
  const userId = await getUserId();

  const { data, error } = await supabase
    .from("drafts")
    .insert({
      user_id: userId,
      title: input.title ?? "Untitled Draft",
      content: input.content,
      source_urls: input.sourceUrls,
      tone: input.tone,
      length: input.length,
    })
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to create draft.");
  return data as DraftRecord;
}

export async function getDrafts(): Promise<DraftRecord[]> {
  const supabase = await createClient();
  const userId = await getUserId();

  const { data, error } = await supabase
    .from("drafts")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as DraftRecord[];
}

export type DraftSummary = Pick<DraftRecord, "id" | "title" | "updated_at">;

/** Stats + recent rows for the dashboard home hub (lightweight selects). */
export async function getDashboardDraftHome(): Promise<{
  total: number;
  updatedThisWeek: number;
  recent: DraftSummary[];
}> {
  const supabase = await createClient();
  const userId = await getUserId();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [totalRes, weekRes, recentRes] = await Promise.all([
    supabase.from("drafts").select("*", { count: "exact", head: true }).eq("user_id", userId),
    supabase
      .from("drafts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("updated_at", weekAgo),
    supabase
      .from("drafts")
      .select("id, title, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(8),
  ]);

  if (totalRes.error) throw new Error(totalRes.error.message);
  if (weekRes.error) throw new Error(weekRes.error.message);
  if (recentRes.error) throw new Error(recentRes.error.message);

  return {
    total: totalRes.count ?? 0,
    updatedThisWeek: weekRes.count ?? 0,
    recent: (recentRes.data ?? []) as DraftSummary[],
  };
}

export async function getDraftById(draftId: string): Promise<DraftRecord> {
  const supabase = await createClient();
  const userId = await getUserId();

  const { data, error } = await supabase
    .from("drafts")
    .select("*")
    .eq("id", draftId)
    .eq("user_id", userId)
    .single();

  if (error || !data) throw new Error("Draft not found.");
  return data as DraftRecord;
}

export async function updateDraftById(
  draftId: string,
  input: UpdateDraftInput
): Promise<DraftRecord> {
  const supabase = await createClient();
  const userId = await getUserId();

  const { data, error } = await supabase
    .from("drafts")
    .update({ title: input.title, content: input.content })
    .eq("id", draftId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to update draft.");
  return data as DraftRecord;
}

export async function deleteDraftById(draftId: string): Promise<void> {
  const supabase = await createClient();
  const userId = await getUserId();

  const { error } = await supabase.from("drafts").delete().eq("id", draftId).eq("user_id", userId);
  if (error) throw new Error(error.message);
}
