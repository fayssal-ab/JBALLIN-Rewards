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
  { label: "Prediction", href: "/prediction" },
  { label: "Store", href: "/store" },
  { label: "Referral Program", href: "/referral" },
  { label: "Instructions", href: "/instructions" },
];

// Full-width flat bar instead of a floating rounded card — the pattern
// real bold brand sites (100 Thieves, G Fuel, the direct competitor this
// project benchmarks against) actually use: no border, no clipped shape,
// just a solid bar and confident bold type carrying the "cool" factor.
export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
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
          <span className="font-brand text-lg tracking-wide text-white">
            JBALLIN
          </span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group relative py-1 text-[13px] font-bold tracking-wide text-white/70 uppercase transition-colors duration-150 hover:text-emerald-300"
            >
              {link.label}
              <span className="absolute -bottom-0.5 left-0 h-[2px] w-full origin-left scale-x-0 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] transition-transform duration-200 ease-out group-hover:scale-x-100" />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href={RAINBET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-white px-4 py-2 text-xs font-bold tracking-wide text-black uppercase transition-transform hover:scale-105"
          >
            Sign Up
          </a>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
