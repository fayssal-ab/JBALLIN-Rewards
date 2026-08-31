import Link from "next/link";
import {
  KICK_URL,
  TWITTER_URL,
  DISCORD_URL,
  YOUTUBE_URL,
  RAINBET_URL,
} from "@/lib/constants";
import { SocialIcon } from "@/components/SocialIcon";

const PLATFORM_LINKS = [
  { label: "Home", href: "/" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "Prediction", href: "/prediction" },
  { label: "Store", href: "/store" },
];

const SOCIAL_LINKS = [
  { platform: "kick" as const, href: KICK_URL },
  { platform: "discord" as const, href: DISCORD_URL },
  { platform: "twitter" as const, href: TWITTER_URL },
  { platform: "youtube" as const, href: YOUTUBE_URL },
];

export function SiteFooter() {
  return (
    <footer className="relative border-t border-white/10 bg-black/40 px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <span className="font-display text-xl text-white">JBALLIN</span>
            <div className="mt-4 flex gap-2">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.platform}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-white/60 transition-all duration-300 hover:scale-110 hover:border-emerald-400/40 hover:text-emerald-300 hover:shadow-[0_0_16px_rgba(52,211,153,0.3)]"
                >
                  <SocialIcon platform={social.platform} className="h-4 w-4" />
                </a>
              ))}
            </div>

            <a
              href={RAINBET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative mt-5 inline-flex items-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-400/5 px-4 py-2 transition-colors hover:border-emerald-400/60 hover:bg-emerald-400/10"
            >
              <span className="text-sm text-white/50">Use code:</span>
              <span className="font-display text-sm tracking-wide text-emerald-300">
                JBALLIN
              </span>
              <span className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-black/90 px-3 py-1.5 text-xs text-white/80 opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
                Play at Rainbet with code JBALLIN
              </span>
            </a>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white">Platform</h4>
            <ul className="mt-4 space-y-2">
              {PLATFORM_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/50 transition-colors hover:text-emerald-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white">Support</h4>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href="/instructions"
                  className="text-sm text-white/50 transition-colors hover:text-emerald-300"
                >
                  Instructions
                </Link>
              </li>
              <li>
                <a
                  href={DISCORD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-white/50 transition-colors hover:text-emerald-300"
                >
                  Discord
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 rounded-xl border border-white/10 bg-white/[0.02] p-5 text-center text-xs text-white/40">
          <p>18+ only. Please gamble responsibly. Set limits and take breaks.</p>
          <p className="mt-1">
            If you need support, visit{" "}
            <a
              href="https://www.gambleaware.org"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-emerald-400/40 underline-offset-4 hover:text-emerald-300"
            >
              GambleAware.org
            </a>
            .
          </p>
          <p className="mt-1">
            JBALLIN Rewards is an independent fan-run rewards program and is
            not operated by Rainbet. Sign-ups made under our referral code
            may earn us a commission.
          </p>
        </div>

        <div className="mt-8 flex flex-col items-center gap-2 border-t border-white/5 pt-6 text-xs text-white/30 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} JBALLIN Rewards. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <p>
              Slot data by{" "}
              <a
                href="https://slot.report"
                target="_blank"
                rel="noopener"
                className="hover:text-white/60"
              >
                slot.report
              </a>
            </p>
            <Link href="/admin" className="hover:text-white/60">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
