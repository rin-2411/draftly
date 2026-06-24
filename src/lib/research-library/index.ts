import { createClient } from "@/config/supabase/server";
import type { ResearchSourceRecord } from "@/lib/types";

type CreateResearchSourceInput = {
  url: string;
  title?: string | null;
  notes?: string | null;
  tags?: string[];
};

type UpdateResearchSourceInput = Partial<CreateResearchSourceInput>;

async function getUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return user.id;
}

export async function listResearchSources(): Promise<ResearchSourceRecord[]> {
  const supabase = await createClient();
  const userId = await getUserId();

  const { data, error } = await supabase
    .from("research_sources")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as ResearchSourceRecord[];
}

export async function getResearchSourceById(id: string): Promise<ResearchSourceRecord> {
  const supabase = await createClient();
  const userId = await getUserId();

  const { data, error } = await supabase
    .from("research_sources")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error || !data) throw new Error("Source not found.");
  return data as ResearchSourceRecord;
}

export async function createResearchSource(
  input: CreateResearchSourceInput
): Promise<ResearchSourceRecord> {
  const supabase = await createClient();
  const userId = await getUserId();

  const { data, error } = await supabase
    .from("research_sources")
    .insert({
      user_id: userId,
      url: input.url.trim(),
      title: input.title?.trim() || null,
      notes: input.notes?.trim() || null,
      tags: input.tags?.length ? input.tags.map((t) => t.trim()).filter(Boolean) : [],
    })
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to save source.");
  return data as ResearchSourceRecord;
}

export async function updateResearchSource(
  id: string,
  input: UpdateResearchSourceInput
): Promise<ResearchSourceRecord> {
  const supabase = await createClient();
  const userId = await getUserId();

  const patch: Record<string, unknown> = {};
  if (input.url !== undefined) patch.url = input.url.trim();
  if (input.title !== undefined) patch.title = input.title?.trim() || null;
  if (input.notes !== undefined) patch.notes = input.notes?.trim() || null;
  if (input.tags !== undefined) {
    patch.tags = input.tags.length ? input.tags.map((t) => t.trim()).filter(Boolean) : [];
  }

  const { data, error } = await supabase
    .from("research_sources")
    .update(patch)
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to update source.");
  return data as ResearchSourceRecord;
}

export async function deleteResearchSource(id: string): Promise<void> {
  const supabase = await createClient();
  const userId = await getUserId();

  const { error } = await supabase
    .from("research_sources")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}
