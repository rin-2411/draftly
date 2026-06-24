import { createAdminClient } from "@/config/supabase/admin";
import type { DraftRecord } from "@/lib/types";

export type AdminDraftRow = DraftRecord & { user_email: string | null };

export async function listAdminDrafts(search?: string, limit = 100): Promise<AdminDraftRow[]> {
  const admin = createAdminClient();
  let query = admin.from("drafts").select("*").order("updated_at", { ascending: false }).limit(limit);

  if (search?.trim()) {
    query = query.ilike("title", `%${search.trim()}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const drafts = (data ?? []) as DraftRecord[];
  const emailById = new Map<string, string>();

  for (const d of drafts) {
    if (emailById.has(d.user_id)) continue;
    const { data: userData } = await admin.auth.admin.getUserById(d.user_id);
    if (userData?.user?.email) emailById.set(d.user_id, userData.user.email);
  }

  return drafts.map((d) => ({
    ...d,
    user_email: emailById.get(d.user_id) ?? null,
  }));
}

export async function deleteAdminDraft(draftId: string) {
  const admin = createAdminClient();
  const { error } = await admin.from("drafts").delete().eq("id", draftId);
  if (error) throw new Error(error.message);
}
