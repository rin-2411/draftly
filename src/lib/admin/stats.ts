import { createAdminClient } from "@/config/supabase/admin";

export type AdminDashboardStats = {
  total_users: number;
  disabled_users: number;
  total_drafts: number;
  total_research_sources: number;
  generations_today: number;
  generations_today_failed: number;
  crawl_failures_today: number;
};

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const admin = createAdminClient();
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const since = start.toISOString();

  const { data: authData } = await admin.auth.admin.listUsers({ perPage: 200 });
  const total_users = authData.users?.length ?? 0;

  const { count: disabled_users } = await admin
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("is_disabled", true);

  const { count: total_drafts } = await admin
    .from("drafts")
    .select("*", { count: "exact", head: true });

  const { count: total_research_sources } = await admin
    .from("research_sources")
    .select("*", { count: "exact", head: true });

  const { count: generations_today } = await admin
    .from("generation_logs")
    .select("*", { count: "exact", head: true })
    .gte("created_at", since);

  const { count: generations_today_failed } = await admin
    .from("generation_logs")
    .select("*", { count: "exact", head: true })
    .gte("created_at", since)
    .eq("success", false);

  const { data: failLogs } = await admin
    .from("generation_logs")
    .select("crawl_fail_count")
    .gte("created_at", since);

  const crawl_failures_today = (failLogs ?? []).reduce(
    (sum, row) => sum + (row.crawl_fail_count ?? 0),
    0
  );

  return {
    total_users,
    disabled_users: disabled_users ?? 0,
    total_drafts: total_drafts ?? 0,
    total_research_sources: total_research_sources ?? 0,
    generations_today: generations_today ?? 0,
    generations_today_failed: generations_today_failed ?? 0,
    crawl_failures_today,
  };
}
