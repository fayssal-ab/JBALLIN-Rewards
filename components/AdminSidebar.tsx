"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { label: "Tournament", href: "/admin/tournaments" },
  { label: "Bonus Hunt", href: "/admin/bonus-hunt" },
  { label: "Giveaway", href: "/admin/winner-picker" },
  { label: "Merch", href: "/admin/merch" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.push("/");
    router.refresh();
  }

  return (
    <aside className="flex shrink-0 flex-row gap-2 overflow-x-auto lg:w-48 lg:flex-col lg:overflow-visible">
      <p className="hidden text-[10px] tracking-[0.3em] text-white/30 uppercase lg:block">
        Admin
      </p>
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`shrink-0 rounded-lg border px-3 py-2 text-sm transition-colors ${
              active
                ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                : "border-white/10 text-white/60 hover:border-emerald-400/20 hover:text-white"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={logout}
        className="shrink-0 rounded-lg border border-white/10 px-3 py-2 text-left text-sm text-white/40 hover:border-red-400/30 hover:text-red-300"
      >
        Log out
      </button>
    </aside>
  );
}
