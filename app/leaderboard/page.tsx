import { existsSync } from "node:fs";
import { join } from "node:path";
import Image from "next/image";
import { maskUsername } from "@/lib/mask";
import {
  getActivePeriod,
  getLiveEntries,
  getLatestSuccessfulSync,
  getRewardForRank,
} from "@/lib/periods";
import { Countdown } from "@/components/Countdown";
import { PERIOD_RESET_TIME_UTC } from "@/lib/constants";

// This must re-query the DB on every request, not get frozen into the build
// — the whole point of an SSR leaderboard is that it reflects the last sync.
export const dynamic = "force-dynamic";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const currencyWhole = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const PODIUM_STYLES = [
  "border-emerald-400/50 shadow-[0_0_35px_rgba(52,211,153,0.25)] sm:order-2",
  "border-white/20 sm:order-1",
  "border-white/10 sm:order-3",
];

// Drop 1.png / 2.png / 3.png into public/LB/ for the podium trophies. They
// render as black glyphs on a transparent PNG, so `invert` flips them to
// white against the dark card (otherwise they'd be invisible).
function trophySrc(rank: number): string | null {
  const src = `/LB/${rank}.png`;
  return existsSync(join(process.cwd(), "public", src)) ? src : null;
}

export default async function LeaderboardPage() {
  const period = await getActivePeriod();

  if (!period) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-32 text-center">
        <p className="text-xs tracking-[0.3em] text-white/40 uppercase">
          Leaderboard
        </p>
        <h1 className="font-display mt-2 text-4xl uppercase text-white sm:text-5xl">
          Monthly Leaderboard
        </h1>
        <p className="mt-4 text-white/60">
          No active leaderboard period right now — check back soon.
        </p>
      </div>
    );
  }

  const [entries, lastSync] = await Promise.all([
    getLiveEntries(period.id, 10),
    getLatestSuccessfulSync(period.id),
  ]);

  const podium = entries.slice(0, 3);
  const rest = entries.slice(3);

  const reward = (rank: number) =>
    getRewardForRank(rank, period.prize_pool, period.prize_distribution);

  const periodLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${period.start_at}T00:00:00Z`));

  return (
    <div className="mx-auto max-w-6xl px-6 py-32">
      <div className="text-center">
        <div className="relative mx-auto h-16 w-64 sm:h-20 sm:w-80">
          <Image
            src="/rainbet/rainbet-logo.png"
            alt="Rainbet"
            fill
            sizes="320px"
            className="object-contain"
          />
        </div>
        <p className="font-display mt-4 text-6xl text-emerald-300 sm:text-7xl">
          {currencyWhole.format(Number(period.prize_pool))}
        </p>
        <p className="mt-6 text-xs tracking-[0.3em] text-white/40 uppercase">
          {periodLabel} — live — top 10
        </p>
        <h1 className="font-display mt-2 text-4xl uppercase text-white sm:text-5xl">
          Monthly Leaderboard
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-white/60">
          Wager on Rainbet under code JBALLIN during the active period to
          climb these ranks.
        </p>
        {lastSync?.cache_updated_at ? (
          <p className="mt-2 text-xs text-white/30">
            Rainbet data cached as of {lastSync.cache_updated_at}
          </p>
        ) : null}
      </div>

      {entries.length === 0 ? (
        <div className="mt-16 rounded-3xl border border-white/10 bg-zinc-900/40 p-12 text-center">
          <p className="text-white/60">
            No wagers logged yet this period — be the first to show up here.
          </p>
        </div>
      ) : (
        <>
          {/* Podium */}
          <div className="mt-16 grid gap-6 sm:grid-cols-3">
            {podium.map((entry, i) => {
              const trophy = trophySrc(entry.rank);
              const masked = maskUsername(entry.username);
              return (
                <div
                  key={entry.rainbet_id}
                  className={`flex flex-col items-center rounded-3xl border bg-gradient-to-br from-zinc-900/50 to-zinc-950/50 p-6 text-center ${PODIUM_STYLES[i]}`}
                >
                  <p className="font-display text-sm text-white/50">
                    #{entry.rank}
                  </p>

                  {trophy ? (
                    <div className="relative -mt-1 mb-2 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-400/10">
                      <div className="relative h-14 w-14">
                        <Image
                          src={trophy}
                          alt={`Rank ${entry.rank} trophy`}
                          fill
                          sizes="56px"
                          className="object-contain brightness-0 invert drop-shadow-[0_0_12px_rgba(52,211,153,0.6)]"
                        />
                      </div>
                    </div>
                  ) : null}

                  <p className="mt-3 font-semibold text-white">{masked}</p>

                  <p className="font-display mt-3 text-3xl text-emerald-300">
                    {currency.format(reward(entry.rank))}
                  </p>

                  <Divider />

                  <p className="mt-3 text-[10px] tracking-wide text-white/40 uppercase">
                    Wagered
                  </p>
                  <p className="text-sm text-white/70">
                    {currency.format(Number(entry.wagered_amount))}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Countdown */}
          <div className="mt-16 text-center">
            <p className="text-xs tracking-[0.3em] text-white/40 uppercase">
              Time Left
            </p>
            <div className="mt-4">
              <Countdown targetIso={`${period.end_at}T${PERIOD_RESET_TIME_UTC}Z`} />
            </div>
          </div>

          {/* Rest of the board */}
          {rest.length > 0 ? (
            <div className="mt-16 space-y-2">
              {rest.map((entry) => (
                <div
                  key={entry.rainbet_id}
                  className="flex items-center gap-2 rounded-xl border border-white/5 bg-zinc-900/40 px-3 py-3 transition-colors hover:border-emerald-400/20 hover:bg-white/[0.03] sm:gap-4 sm:px-4"
                >
                  <span className="w-6 shrink-0 text-sm font-semibold text-white/40 sm:w-8">
                    #{entry.rank}
                  </span>
                  <span className="flex-1 truncate font-medium text-white/90">
                    {maskUsername(entry.username)}
                  </span>
                  <span className="hidden shrink-0 text-right text-sm text-white/50 sm:block">
                    {currency.format(Number(entry.wagered_amount))}
                  </span>
                  <span className="w-16 shrink-0 text-right font-bold text-emerald-300 sm:w-20">
                    {currency.format(reward(entry.rank))}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function Divider() {
  return (
    <div className="h-px w-16 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
  );
}
