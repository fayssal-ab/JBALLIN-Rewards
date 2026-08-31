import Image from "next/image";
import Link from "next/link";
import {
  KICK_CHANNEL,
  KICK_URL,
  RAINBET_URL,
  TWITTER_URL,
  DISCORD_URL,
  YOUTUBE_URL,
} from "@/lib/constants";
import { SocialIcon } from "@/components/SocialIcon";
import { getLatestVideo } from "@/lib/youtube";

function Divider({ className = "" }: { className?: string }) {
  return (
    <div
      className={`h-px w-24 bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent ${className}`}
    />
  );
}

const SOCIALS = [
  {
    name: "Kick",
    platform: "kick" as const,
    body: "Watch live streams and exclusive content.",
    href: KICK_URL,
  },
  {
    name: "Discord",
    platform: "discord" as const,
    body: "Join the community.",
    href: DISCORD_URL,
  },
  {
    name: "Twitter",
    platform: "twitter" as const,
    body: "Follow for updates and highlights.",
    href: TWITTER_URL,
  },
  {
    name: "YouTube",
    platform: "youtube" as const,
    body: "Watch highlights and full videos.",
    href: YOUTUBE_URL,
  },
];

export default async function Home() {
  const latestVideo = await getLatestVideo();
  return (
    <div>
      {/* Hero */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
        <p className="relative z-10 text-sm font-semibold tracking-[0.3em] text-white/50 uppercase">
          Welcome to
        </p>
        <h1 className="font-display animate-shimmer-text relative z-10 mt-4 bg-gradient-to-b from-white via-zinc-100 to-zinc-400 bg-clip-text text-6xl leading-[0.95] tracking-wide uppercase text-transparent drop-shadow-[0_0_45px_rgba(52,211,153,0.2)] sm:text-8xl sm:tracking-widest lg:text-9xl">
          JBALLIN
          <br />
          Rewards
        </h1>
        <Divider className="relative z-10 my-6" />
        <p className="relative z-10 max-w-xl text-balance font-medium text-white/60">
          Sign up under code{" "}
          <span className="font-semibold text-emerald-300">JBALLIN</span> on
          Rainbet, wager, and climb the leaderboard for a share of the prize
          pool.
        </p>

        <div className="relative z-10 mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/leaderboard"
            className="rounded-lg border border-white/20 px-6 py-3 text-sm font-bold tracking-wide text-white uppercase transition-colors hover:border-emerald-400/40 hover:bg-white/10"
          >
            Leaderboard
          </Link>
          <a
            href={RAINBET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-bold tracking-wide text-black uppercase shadow-[0_0_25px_rgba(52,211,153,0.35)] transition-transform hover:scale-105"
          >
            Sign Up
            <span aria-hidden>→</span>
          </a>
        </div>
      </section>

      {/* Livestream */}
      <section className="relative mx-auto max-w-6xl px-6 py-24">
        <div className="text-center">
          <p className="text-xs tracking-[0.3em] text-white/40 uppercase">
            Livestream
          </p>
          <h2 className="font-display mt-2 flex items-center justify-center gap-3 text-3xl uppercase text-white">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
            </span>
            Watch JBALLIN Live
          </h2>
        </div>

        <div className="relative mx-auto mt-10 aspect-video max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/80 shadow-2xl">
          <iframe
            src={`https://player.kick.com/${KICK_CHANNEL}`}
            title="JBALLIN on Kick"
            allowFullScreen
            className="h-full w-full"
          />
        </div>

        <p className="mt-6 text-center text-sm text-white/50">
          Offline right now? That&apos;s normal — check back during stream
          hours, or follow on{" "}
          <a
            href={KICK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-emerald-300 underline decoration-emerald-400/40 underline-offset-4"
          >
            Kick
          </a>{" "}
          to get notified when JBALLIN goes live.
        </p>
      </section>

      {/* Latest Video */}
      <section className="relative mx-auto max-w-6xl px-6 py-24">
        <div className="text-center">
          <p className="text-xs tracking-[0.3em] text-white/40 uppercase">
            YouTube
          </p>
          <h2 className="font-display mt-2 text-3xl uppercase text-white">
            Latest Video
          </h2>
        </div>

        <a
          href={latestVideo?.watchUrl ?? YOUTUBE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative mx-auto mt-10 block aspect-video max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/80 shadow-2xl"
        >
          {latestVideo ? (
            <Image
              src={latestVideo.thumbnailUrl}
              alt={latestVideo.title}
              fill
              sizes="(min-width: 1024px) 896px, 100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform duration-300 group-hover:scale-110">
              <div className="ml-1 h-0 w-0 border-y-[10px] border-l-[16px] border-y-transparent border-l-black" />
            </div>
          </div>
          {latestVideo ? (
            <p className="absolute bottom-4 left-4 right-4 font-semibold text-white drop-shadow">
              {latestVideo.title}
            </p>
          ) : null}
        </a>

        <p className="mt-6 text-center text-sm text-white/50">
          Subscribe on{" "}
          <a
            href={YOUTUBE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-emerald-300 underline decoration-emerald-400/40 underline-offset-4"
          >
            YouTube
          </a>{" "}
          for full videos and highlights.
        </p>
      </section>

      {/* Benefits */}
      <section className="relative mx-auto max-w-6xl px-6 py-24">
        <div className="text-center">
          <p className="text-xs tracking-[0.3em] text-white/40 uppercase">
            Platform
          </p>
          <h2 className="font-display mt-2 text-3xl uppercase text-white">
            Exclusive Benefits
          </h2>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {[
            {
              title: "Trusted Platform",
              body: "Play on Rainbet, a licensed crypto casino, using JBALLIN's referral code.",
            },
            {
              title: "Leaderboard Prizes",
              body: "Wager during the active period and climb the ranks for a share of the prize pool.",
            },
            {
              title: "Community",
              body: "Join the Kick community for updates, milestones, and live highlights.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="group rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900/40 to-zinc-950/40 p-6 transition-colors hover:border-emerald-400/30"
            >
              <h3 className="font-semibold text-white group-hover:text-emerald-300">
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-white/60">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Leaderboard / Prediction teaser */}
      <section className="relative mx-auto max-w-6xl px-6 py-24">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-zinc-900/40 p-8 text-center transition-colors hover:border-emerald-400/30">
            <h3 className="font-display text-2xl uppercase text-white">
              Monthly Leaderboard
            </h3>
            <p className="mt-3 text-sm text-white/60">
              See who&apos;s wagering the most this period and where you
              rank.
            </p>
            <Link
              href="/leaderboard"
              className="mt-6 inline-block rounded-lg border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:border-emerald-400/40 hover:bg-white/10"
            >
              View Leaderboard
            </Link>
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-900/40 p-8 text-center transition-colors hover:border-emerald-400/30">
            <h3 className="font-display text-2xl uppercase text-white">
              Guess The Bonus
            </h3>
            <p className="mt-3 text-sm text-white/60">
              Type !gb in Kick chat to guess a live bonus&apos;s payout —
              closest guess wins.
            </p>
            <Link
              href="/prediction"
              className="mt-6 inline-block rounded-lg border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:border-emerald-400/40 hover:bg-white/10"
            >
              Play Prediction
            </Link>
          </div>
        </div>
      </section>

      {/* Socials */}
      <section className="relative mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {SOCIALS.map((social) => (
            <a
              key={social.name}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-2xl border border-white/10 bg-zinc-900/40 p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400/40 hover:shadow-[0_0_30px_rgba(52,211,153,0.15)]"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/15 text-white/70 transition-all duration-300 group-hover:scale-110 group-hover:border-emerald-400/50 group-hover:text-emerald-300 group-hover:shadow-[0_0_20px_rgba(52,211,153,0.3)]">
                <SocialIcon platform={social.platform} className="h-5 w-5" />
              </div>
              <h3 className="font-display mt-4 text-lg uppercase text-white">
                {social.name}
              </h3>
              <p className="mt-1 text-xs text-white/50">{social.body}</p>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
