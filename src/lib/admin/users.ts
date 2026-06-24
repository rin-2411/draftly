import { createAdminClient } from "@/config/supabase/admin";
import type { AppRole } from "@/lib/admin/auth";

export type AdminUserRow = {
  id: string;
  email: string | null;
  role: AppRole;
  is_disabled: boolean;
  created_at: string;
  draft_count: number;
  research_count: number;
  generations_today: number;
};

async function ensureProfile(userId: string, email: string | null) {
  const admin = createAdminClient();
  await admin.from("profiles").upsert(
    { id: userId, email, updated_at: new Date().toISOString() },
    { onConflict: "id" }
  );
}

export async function listAdminUsers(): Promise<AdminUserRow[]> {
  const admin = createAdminClient();
  const { data: authData, error: authError } = await admin.auth.admin.listUsers({
    perPage: 200,
  });
  if (authError) throw new Error(authError.message);

  const users = authData.users ?? [];
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);

  const rows: AdminUserRow[] = [];

  for (const u of users) {
    await ensureProfile(u.id, u.email ?? null);

    const metaRole = u.user_metadata?.role;
    const envAdmins = (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const isEnvAdmin = u.email ? envAdmins.includes(u.email.toLowerCase()) : false;

    const { data: profile } = await admin
      .from("profiles")
      .select("role, is_disabled, created_at")
      .eq("id", u.id)
      .single();

    const role: AppRole =
      profile?.role === "admin" || metaRole === "admin" || isEnvAdmin ? "admin" : "user";

    const [draftsRes, researchRes, genRes] = await Promise.all([
      admin.from("drafts").select("*", { count: "exact", head: true }).eq("user_id", u.id),
      admin
        .from("research_sources")
        .select("*", { count: "exact", head: true })
        .eq("user_id", u.id),
      admin
        .from("generation_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", u.id)
        .gte("created_at", start.toISOString()),
    ]);

    rows.push({
      id: u.id,
      email: u.email ?? null,
      role,
      is_disabled: profile?.is_disabled ?? false,
      created_at: profile?.created_at ?? u.created_at,
      draft_count: draftsRes.count ?? 0,
      research_count: researchRes.count ?? 0,
      generations_today: genRes.count ?? 0,
    });
  }

  return rows.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function updateAdminUser(
  userId: string,
  patch: { role?: AppRole; is_disabled?: boolean }
) {
  const admin = createAdminClient();

  if (patch.role !== undefined || patch.is_disabled !== undefined) {
    const profilePatch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (patch.role !== undefined) profilePatch.role = patch.role;
    if (patch.is_disabled !== undefined) profilePatch.is_disabled = patch.is_disabled;

    const { error } = await admin.from("profiles").update(profilePatch).eq("id", userId);
    if (error) throw new Error(error.message);
  }

  if (patch.role !== undefined) {
    const { data: userData } = await admin.auth.admin.getUserById(userId);
    const merged = { ...(userData?.user?.user_metadata ?? {}), role: patch.role };
    const { error: metaError } = await admin.auth.admin.updateUserById(userId, {
      user_metadata: merged,
    });
    if (metaError) throw new Error(metaError.message);
  }
}
