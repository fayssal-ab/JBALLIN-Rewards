"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icon, type IconName } from "@/components/Icon";

const LINKS: { label: string; href: string; icon: IconName }[] = [
  { label: "Tournament", href: "/admin/tournaments", icon: "trophy" },
  { label: "Bonus Hunt", href: "/admin/bonus-hunt", icon: "box" },
  { label: "Giveaway", href: "/admin/winner-picker", icon: "dice" },
  { label: "Merch Admin", href: "/admin/merch", icon: "shirt" },
];

// Sticky on desktop so the nav stays reachable while the panel content
// scrolls past it, instead of trailing off into the footer. top-32 matches
// the layout's py-32 top padding so it settles right where it starts,
// clear of the fixed navbar.
export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.push("/");
    router.refresh();
  }

  return (
    <aside className="lg:sticky lg:top-32 lg:h-fit lg:w-52 lg:shrink-0">
      <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-2">
        <p className="hidden px-2 pt-1 pb-2 text-[10px] tracking-[0.3em] text-white/30 uppercase lg:block">
          Admin
        </p>
        <nav className="flex flex-row gap-1.5 overflow-x-auto lg:flex-col lg:overflow-visible">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex shrink-0 items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                    : "border-transparent text-white/60 hover:border-white/10 hover:bg-white/[0.03] hover:text-white"
                }`}
              >
                <Icon name={link.icon} className="h-4 w-4 shrink-0" />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="my-2 hidden h-px bg-white/5 lg:block" />
        <button
          type="button"
          onClick={logout}
          className="flex w-full shrink-0 items-center gap-2.5 rounded-xl border border-transparent px-3 py-2.5 text-left text-sm text-white/40 transition-colors hover:border-red-400/20 hover:bg-red-400/5 hover:text-red-300"
        >
          <Icon name="close" className="h-4 w-4 shrink-0" />
          Log out
        </button>
      </div>
    </aside>
  );
}
