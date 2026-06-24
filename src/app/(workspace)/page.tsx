import { createClient } from "@/config/supabase/server";
import { DashboardHomeView } from "@/components/DashboardHomeView";
import { getDisplayNameFromMetadata } from "@/lib/user-preferences";
import { getPublicAnnouncement } from "@/lib/system-settings-public";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const fromMeta = getDisplayNameFromMetadata(meta);
  const greetingName = fromMeta ?? user?.email?.split("@")[0] ?? null;
  const announcement = await getPublicAnnouncement();

  return (
    <section className="rounded-2xl border border-white/[0.06] bg-[#141210] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] md:p-8">
      <DashboardHomeView greetingName={greetingName} announcement={announcement} />
    </section>
  );
}
