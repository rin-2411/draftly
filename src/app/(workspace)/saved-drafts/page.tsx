import { SavedDraftsClient } from "@/components/SavedDraftsClient";

export default function SavedDraftsPage() {
  return (
    <section className="rounded-2xl border border-white/[0.06] bg-[#141210] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] md:p-8">
      <SavedDraftsClient />
    </section>
  );
}
