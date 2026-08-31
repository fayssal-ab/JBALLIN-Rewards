"use client";

import { useState } from "react";
import Link from "next/link";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "Prediction", href: "/prediction" },
  { label: "Store", href: "/store" },
  { label: "Referral Program", href: "/referral" },
  { label: "Instructions", href: "/instructions" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-white/80"
      >
        <div className="relative h-3.5 w-4">
          <span
            className={`absolute left-0 top-0 h-0.5 w-4 bg-current transition-transform duration-200 ${open ? "translate-y-[6px] rotate-45" : ""}`}
          />
          <span
            className={`absolute left-0 top-1/2 h-0.5 w-4 -translate-y-1/2 bg-current transition-opacity duration-200 ${open ? "opacity-0" : "opacity-100"}`}
          />
          <span
            className={`absolute left-0 bottom-0 h-0.5 w-4 bg-current transition-transform duration-200 ${open ? "-translate-y-[6px] -rotate-45" : ""}`}
          />
        </div>
      </button>

      {open ? (
        // `fixed` (not `absolute`) so this positions off the viewport, not
        // whatever ancestor happens to be the nearest positioning context —
        // the header itself is `fixed`, so this just needs to sit right
        // below it regardless of scroll position.
        <div className="fixed inset-x-4 top-20 rounded-2xl border border-white/10 bg-black/90 p-2 shadow-lg shadow-black/40 backdrop-blur-xl">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-4 py-3 text-sm font-bold text-white/80 transition-colors hover:bg-emerald-400/10 hover:text-emerald-300"
            >
              {link.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
