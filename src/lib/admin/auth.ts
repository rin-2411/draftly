import { createClient } from "@/config/supabase/server";
import type { User } from "@supabase/supabase-js";

export type AppRole = "user" | "admin";

function adminEmailsFromEnv(): Set<string> {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function isAdminUser(user: User | null | undefined): boolean {
  if (!user) return false;
  const meta = user.user_metadata ?? {};
  if (meta.role === "admin") return true;
  const email = user.email?.toLowerCase();
  if (email && adminEmailsFromEnv().has(email)) return true;
  return false;
}

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireAdminUser() {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");
  if (!isAdminUser(user)) throw new Error("Forbidden");
  return user;
}

export async function isUserDisabled(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("is_disabled")
    .eq("id", userId)
    .maybeSingle();
  return data?.is_disabled === true;
}
