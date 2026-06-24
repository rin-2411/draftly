import { createAdminClient } from "@/config/supabase/admin";

export type SystemSettings = {
  maintenance_mode: boolean;
  maintenance_message: string;
  announcement: string;
  daily_generate_limit: number;
};

const DEFAULTS: SystemSettings = {
  maintenance_mode: false,
  maintenance_message: "The editor is temporarily unavailable for maintenance.",
  announcement: "",
  daily_generate_limit: 50,
};

function jsonValue(raw: unknown): unknown {
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  return raw;
}

function parseSettings(rows: { key: string; value: unknown }[]): SystemSettings {
  const map = new Map(rows.map((r) => [r.key, jsonValue(r.value)]));
  return {
    maintenance_mode: Boolean(map.get("maintenance_mode") ?? DEFAULTS.maintenance_mode),
    maintenance_message: String(
      map.get("maintenance_message") ?? DEFAULTS.maintenance_message
    ),
    announcement: String(map.get("announcement") ?? ""),
    daily_generate_limit: Number(map.get("daily_generate_limit") ?? DEFAULTS.daily_generate_limit),
  };
}

export async function getSystemSettings(): Promise<SystemSettings> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("system_settings").select("key, value");
  if (error || !data?.length) return DEFAULTS;
  return parseSettings(data as { key: string; value: unknown }[]);
}

export async function updateSystemSettings(patch: Partial<SystemSettings>): Promise<SystemSettings> {
  const admin = createAdminClient();
  const entries: { key: string; value: unknown }[] = [];
  if (patch.maintenance_mode !== undefined) {
    entries.push({ key: "maintenance_mode", value: patch.maintenance_mode });
  }
  if (patch.maintenance_message !== undefined) {
    entries.push({ key: "maintenance_message", value: patch.maintenance_message });
  }
  if (patch.announcement !== undefined) {
    entries.push({ key: "announcement", value: patch.announcement });
  }
  if (patch.daily_generate_limit !== undefined) {
    entries.push({ key: "daily_generate_limit", value: patch.daily_generate_limit });
  }

  for (const row of entries) {
    const { error } = await admin
      .from("system_settings")
      .upsert({ key: row.key, value: row.value, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
  }

  return getSystemSettings();
}

export async function getUserGenerationCountToday(userId: string): Promise<number> {
  const admin = createAdminClient();
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const { count, error } = await admin
    .from("generation_logs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", start.toISOString());
  if (error) throw new Error(error.message);
  return count ?? 0;
}
