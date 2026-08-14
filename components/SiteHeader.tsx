import { existsSync } from "node:fs";
import { join } from "node:path";
import Image from "next/image";
import Link from "next/link";
import { RAINBET_URL } from "@/lib/constants";
import { MobileNav } from "./MobileNav";

const LOGO_SRC = "/logo.png";
const hasLogo = existsSync(join(process.cwd(), "public", LOGO_SRC));

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "Milestones", href: "/milestones" },
  { label: "Referral Program", href: "/referral" },
  { label: "Instructions", href: "/instructions" },
];

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4">
      <div className="mx-auto flex max-w-6xl items-center justify-between rounded-2xl border border-white/10 bg-black/60 px-5 py-3 shadow-lg shadow-black/40 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-3">
          {hasLogo ? (
            <Image
              src={LOGO_SRC}
              alt="JBALLIN"
              width={38}
              height={38}
              priority
              className="rounded-full object-cover ring-1 ring-emerald-400/30"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-white/20 text-[10px] text-white/30">
              logo
            </div>
          )}
          <span className="font-display text-lg tracking-wide text-white">
            JBALLIN
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group relative rounded-lg px-2.5 py-2 text-[13px] font-medium text-white/70 transition-all duration-200 hover:bg-emerald-400/10 hover:text-emerald-300"
            >
              {link.label}
              <span className="absolute bottom-1 left-3 right-3 h-px scale-x-0 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] transition-transform duration-300 group-hover:scale-x-100" />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={RAINBET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-white px-3 py-2 text-xs font-bold tracking-wide text-black uppercase transition-transform hover:scale-105 sm:px-4"
          >
            Sign Up
          </a>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
