import { createClient } from "@/config/supabase/server";
import { SettingsClient } from "@/components/SettingsClient";
import { getDisplayNameFromMetadata, getWorkspaceDefaultsFromMetadata } from "@/lib/user-preferences";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const { tone, length, language } = getWorkspaceDefaultsFromMetadata(meta);
  const displayName = getDisplayNameFromMetadata(meta);

  return (
    <section className="rounded-2xl border border-white/[0.06] bg-[#141210] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] md:p-8">
      <SettingsClient
        email={user?.email ?? null}
        initialDisplayName={displayName}
        initialTone={tone}
        initialLength={length}
        initialLanguage={language}
      />
    </section>
  );
}
