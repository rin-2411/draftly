import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { getSessionUser, isAdminUser } from "@/lib/admin/auth";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/auth/login");
  }
  if (!isAdminUser(user)) {
    redirect("/");
  }

  return <AdminShell>{children}</AdminShell>;
}
