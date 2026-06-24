"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
} from "lucide-react";

const links = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/drafts", label: "Drafts", icon: FileText },
  { href: "/admin/logs", label: "AI logs", icon: Activity },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const signOut = async () => {
    await fetch("/api/auth/signout", { method: "POST" });
    router.replace("/auth/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[var(--journal-warm-bg)] text-zinc-100">
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#141210]/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="text-sm font-semibold text-[#ddb77e]">
              Draftly Admin
            </Link>
            <nav className="hidden gap-1 sm:flex">
              {links.map((item) => {
                const active =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      active
                        ? "bg-[#c9a06c] text-[#1a120e]"
                        : "text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200"
                    }`}
                  >
                    <Icon size={14} aria-hidden />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-full border border-white/[0.08] px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/[0.06]"
            >
              Back to app
            </Link>
            <button
              type="button"
              onClick={() => void signOut()}
              className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/[0.06]"
            >
              <LogOut size={14} aria-hidden />
              Sign out
            </button>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-white/[0.04] px-4 py-2 sm:hidden">
          {links.map((item) => {
            const active =
              item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                  active ? "bg-[#c9a06c] text-[#1a120e]" : "text-zinc-400"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6">{children}</main>
    </div>
  );
}
