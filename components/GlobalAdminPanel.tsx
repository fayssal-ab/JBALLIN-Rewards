"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icon, type IconName } from "@/components/Icon";

const LINKS: { label: string; href: string; icon: IconName }[] = [
  { label: "Tournament", href: "/admin/tournaments", icon: "trophy" },
  { label: "Bonus Hunt", href: "/admin/bonus-hunt", icon: "box" },
  { label: "Giveaway", href: "/admin/winner-picker", icon: "dice" },
  { label: "Store", href: "/admin/merch", icon: "shirt" },
];

// A persistent admin dashboard, fixed to the side of every public page —
// not just inside /admin. Only ever rendered when the server has already
// confirmed the admin cookie (see app/layout.tsx), so non-admins never get
// this markup at all. Hidden on /admin/* routes themselves since those
// pages already have AdminSidebar as their in-flow nav.
export function GlobalAdminPanel() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname?.startsWith("/admin")) return null;

  async function logout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.refresh();
  }

  return (
    <aside className="fixed top-1/2 left-4 z-40 hidden w-56 -translate-y-1/2 lg:block">
      <div className="rounded-2xl border border-emerald-400/20 bg-zinc-900/80 p-3 shadow-[0_0_30px_rgba(0,0,0,0.5)] backdrop-blur-md">
        <div className="flex items-center gap-2 px-2 pt-1 pb-3">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <p className="text-[10px] font-bold tracking-[0.3em] text-emerald-300 uppercase">
            Admin Dashboard
          </p>
        </div>
        <nav className="flex flex-col gap-1.5">
          <Link
            href="/admin"
            className="flex items-center gap-2.5 rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium text-white/60 transition-colors hover:border-white/10 hover:bg-white/[0.03] hover:text-white"
          >
            <Icon name="target" className="h-4 w-4 shrink-0" />
            Overview
          </Link>
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2.5 rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium text-white/60 transition-colors hover:border-white/10 hover:bg-white/[0.03] hover:text-white"
            >
              <Icon name={link.icon} className="h-4 w-4 shrink-0" />
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="my-2 h-px bg-white/5" />
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-2.5 rounded-xl border border-transparent px-3 py-2.5 text-left text-sm text-white/40 transition-colors hover:border-red-400/20 hover:bg-red-400/5 hover:text-red-300"
        >
          <Icon name="close" className="h-4 w-4 shrink-0" />
          Log out
        </button>
      </div>
    </aside>
  );
}
