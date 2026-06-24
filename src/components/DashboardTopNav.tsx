"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, PenLine } from "lucide-react";

const links = [
  { label: "Home", href: "/" },
  { label: "Overview", href: "/drafts" },
  { label: "Saved drafts", href: "/saved-drafts" },
  { label: "Research", href: "/research" },
  { label: "Templates", href: "/templates" },
  { label: "Settings", href: "/settings" },
];

function linkActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/" || pathname === "";
  }
  if (href === "/drafts") {
    return pathname === "/drafts";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardTopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [timeLabel, setTimeLabel] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    void fetch("/api/admin/me")
      .then((r) => r.json())
      .then((d: { isAdmin?: boolean }) => setIsAdmin(Boolean(d.isAdmin)))
      .catch(() => setIsAdmin(false));
  }, []);

  useEffect(() => {
    const tick = () => {
      setTimeLabel(
        new Date().toLocaleTimeString(undefined, {
          hour: "numeric",
          minute: "2-digit",
        })
      );
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  const signOut = async () => {
    await fetch("/api/auth/signout", { method: "POST" });
    router.replace("/auth/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#141210]/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-6 md:gap-10">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2.5 text-white transition hover:opacity-90"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#c9a06c]/20 text-[#ddb77e] ring-1 ring-[#c9a06c]/30">
              <PenLine size={16} strokeWidth={2} aria-hidden />
            </span>
            <span className="hidden font-semibold tracking-tight sm:inline">Draftly</span>
          </Link>

          <nav className="flex min-w-0 items-center gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:gap-2">
            {links.map((item) => {
              const active = linkActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition md:px-4 ${
                    active
                      ? "bg-[#c9a06c] text-[#1a120e]"
                      : "text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-3 md:gap-4">
          {isAdmin && (
            <Link
              href="/admin"
              className="hidden rounded-full border border-[#c9a06c]/30 bg-[#c9a06c]/10 px-3 py-1.5 text-xs font-medium text-[#ddb77e] transition hover:bg-[#c9a06c]/20 sm:inline"
            >
              Admin
            </Link>
          )}
          <span className="hidden text-xs tabular-nums text-zinc-500 sm:inline">{timeLabel}</span>
          <button
            type="button"
            onClick={() => void signOut()}
            className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.08] hover:text-white md:text-sm"
          >
            <LogOut size={14} className="opacity-70" aria-hidden />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
