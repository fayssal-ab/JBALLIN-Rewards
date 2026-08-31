import { existsSync } from "node:fs";
import { join } from "node:path";
import Image from "next/image";
import Link from "next/link";
import { RAINBET_URL } from "@/lib/constants";
import { Icon } from "@/components/Icon";
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

// Stencil-cut corners instead of a rounded pill — reads as a spray-painted
// street sign rather than the soft glass cards used everywhere else on the
// site, so the navbar doesn't just look like "another rounded panel."
const SIGN_CLIP =
  "polygon(14px 0, calc(100% - 14px) 0, 100% 14px, 100% calc(100% - 14px), calc(100% - 14px) 100%, 14px 100%, 0 calc(100% - 14px), 0 14px)";

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4">
      <div className="relative mx-auto max-w-6xl">
        {/* Background layer only — clip-path lives here, not on the row
            below, because clipping a fixed-position descendant (the
            MobileNav dropdown) to this shape would crop it out entirely. */}
        <div
          className="absolute inset-0 border-2 border-emerald-400/40 bg-black/85 shadow-lg shadow-black/50"
          style={{ clipPath: SIGN_CLIP }}
        >
          {/* spray-can texture: a scatter of tiny dots along the top edge */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-full opacity-[0.06]"
            style={{
              backgroundImage: "radial-gradient(circle, #34d399 1px, transparent 1px)",
              backgroundSize: "10px 10px",
            }}
          />
        </div>

        <div className="relative flex items-center justify-between px-5 py-3">
          <Link href="/" className="relative flex items-center gap-3">
            <div className="relative">
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
              {/* sticker badge */}
              <span className="absolute -bottom-1.5 -right-1.5 flex h-4 w-4 -rotate-12 items-center justify-center rounded-full border-2 border-black bg-emerald-400 text-black">
                <Icon name="bolt" className="h-2.5 w-2.5" />
              </span>
            </div>
            <span className="font-brand text-lg tracking-wide text-white">
              JBALLIN
            </span>
          </Link>

          <nav className="relative hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((link, i) => (
              <Link
                key={link.href}
                href={link.href}
                className="group relative px-2.5 py-2 text-[13px] font-bold text-white/70 uppercase transition-colors duration-150 hover:text-emerald-300"
              >
                <span
                  className="absolute inset-0 -z-10 origin-left scale-x-0 bg-emerald-400/15 transition-transform duration-200 ease-out group-hover:scale-x-100"
                  style={{ transform: `skewX(${i % 2 === 0 ? "-8deg" : "8deg"})` }}
                />
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="relative flex items-center gap-2">
            <a
              href={RAINBET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white px-3 py-2 text-xs font-bold tracking-wide text-black uppercase transition-transform hover:scale-105 sm:px-4"
              style={{
                clipPath:
                  "polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)",
              }}
            >
              Sign Up
            </a>
            <MobileNav />
          </div>
        </div>
      </div>
    </header>
  );
}
