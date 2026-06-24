import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/config/supabase/server";
import { DashboardTopNav } from "@/components/DashboardTopNav";

export default async function WorkspaceLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-[var(--journal-warm-bg)] text-zinc-100">
      <DashboardTopNav />
      <main className="mx-auto min-h-[calc(100vh-3.5rem)] max-w-[1600px] px-4 py-6 md:px-6 md:py-8">
        {children}
      </main>
    </div>
  );
}
