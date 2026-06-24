import { createAdminClient } from "@/config/supabase/admin";
import type { OutputLanguage } from "@/lib/output-languages";
import type { OutputLength, Tone } from "@/lib/types";

export type GenerationLogRow = {
  id: string;
  user_id: string;
  user_email?: string | null;
  source_urls: string[];
  tone: string | null;
  length: string | null;
  language: string | null;
  crawl_ok_count: number;
  crawl_fail_count: number;
  success: boolean;
  error_message: string | null;
  created_at: string;
};

export async function logGeneration(input: {
  userId: string;
  sourceUrls: string[];
  tone: Tone;
  length: OutputLength;
  language: OutputLanguage;
  crawlOk: number;
  crawlFail: number;
  success: boolean;
  errorMessage?: string | null;
}) {
  const admin = createAdminClient();
  await admin.from("generation_logs").insert({
    user_id: input.userId,
    source_urls: input.sourceUrls,
    tone: input.tone,
    length: input.length,
    language: input.language,
    crawl_ok_count: input.crawlOk,
    crawl_fail_count: input.crawlFail,
    success: input.success,
    error_message: input.errorMessage ?? null,
  });
}

export async function listGenerationLogs(limit = 50): Promise<GenerationLogRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("generation_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);

  const logs = (data ?? []) as Omit<GenerationLogRow, "user_email">[];
  const userIds = [...new Set(logs.map((l) => l.user_id))];
  const emailById = new Map<string, string>();

  for (const id of userIds) {
    const { data: userData } = await admin.auth.admin.getUserById(id);
    if (userData?.user?.email) emailById.set(id, userData.user.email);
  }

  return logs.map((l) => ({
    ...l,
    user_email: emailById.get(l.user_id) ?? null,
  }));
}
