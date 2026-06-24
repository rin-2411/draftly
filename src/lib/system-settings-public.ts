import { createClient } from "@/config/supabase/server";

/** Announcement text for the home hub (readable by any logged-in user via RLS). */
export async function getPublicAnnouncement(): Promise<string> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "announcement")
      .maybeSingle();
    const raw = data?.value;
    if (raw === null || raw === undefined) return "";
    if (typeof raw === "string") {
      try {
        return JSON.parse(raw) as string;
      } catch {
        return raw;
      }
    }
    return String(raw);
  } catch {
    return "";
  }
}
