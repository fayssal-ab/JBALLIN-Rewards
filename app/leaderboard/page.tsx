import Link from "next/link";
import Image from "next/image";
import { maskUsername } from "@/lib/mask";
import {
  getActivePeriod,
  getLiveEntries,
  getLatestSuccessfulSync,
  getRewardForRank,
  getClosedPeriods,
  getClosedPeriod,
  getFinalResults,
} from "@/lib/periods";
import { Countdown } from "@/components/Countdown";
import { LeaderboardTable, type LeaderboardRow } from "@/components/LeaderboardTable";
import { PreviousMonths } from "@/components/PreviousMonths";
import { PERIOD_RESET_TIME_UTC, RAINBET_URL } from "@/lib/constants";

// This must re-query the DB on every request, not get frozen into the build
// — the whole point of an SSR leaderboard is that it reflects the last sync.
export const dynamic = "force-dynamic";

const currencyWhole = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function monthLabel(dateStr: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${dateStr}T00:00:00Z`));
}

function RainbetLogo() {
  return (
    <a
      href={RAINBET_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="relative mx-auto block h-20 w-full max-w-sm transition-opacity hover:opacity-80 sm:h-24"
    >
      <Image
        src="/rainbet/rainbet-logo.png"
        alt="Rainbet"
        fill
        sizes="380px"
        priority
        className="object-contain"
      />
    </a>
  );
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: periodParam } = await searchParams;
  const requestedPeriodId = periodParam ? Number(periodParam) : null;

  const closedPeriods = await getClosedPeriods();

  if (requestedPeriodId && closedPeriods.some((p) => p.id === requestedPeriodId)) {
    const [period, results] = await Promise.all([
      getClosedPeriod(requestedPeriodId),
      getFinalResults(requestedPeriodId, 10),
    ]);

    if (!period) {
      return null;
    }

    const rows: LeaderboardRow[] = results.map((entry) => ({
      rainbet_id: entry.rainbet_id,
      maskedUsername: maskUsername(entry.username),
      wagered_amount: entry.wagered_amount,
      rank: entry.rank,
      reward: Number(entry.prize),
    }));

    return (
      <div className="mx-auto max-w-6xl px-6 py-32">
        <div className="text-center">
          <RainbetLogo />
          <p className="font-display mt-4 text-6xl text-emerald-300 sm:text-7xl">
            {currencyWhole.format(Number(period.prize_pool))}
          </p>
          <p className="mt-6 text-xs tracking-[0.3em] text-white/40 uppercase">
            {monthLabel(period.start_at)} — final results
          </p>
          <h1 className="font-display mt-2 text-4xl uppercase text-white sm:text-5xl">
            Monthly Leaderboard
          </h1>
          <Link
            href="/leaderboard"
            className="mt-4 inline-block text-sm text-emerald-300 hover:text-emerald-200"
          >
            ← Back to the live leaderboard
          </Link>
        </div>

        <LeaderboardTable
          entries={rows}
          emptyMessage="No wagers were logged for this period."
        />

        <PreviousMonths periods={closedPeriods} viewingPeriodId={period.id} />
      </div>
    );
  }

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
        <PreviousMonths periods={closedPeriods} viewingPeriodId={null} />
      </div>
    );
  }

  const [entries, lastSync] = await Promise.all([
    getLiveEntries(period.id, 10),
    getLatestSuccessfulSync(period.id),
  ]);

  const rows: LeaderboardRow[] = entries.map((entry) => ({
    rainbet_id: entry.rainbet_id,
    maskedUsername: maskUsername(entry.username),
    wagered_amount: entry.wagered_amount,
    rank: entry.rank,
    reward: getRewardForRank(entry.rank, period.prize_pool, period.prize_distribution),
  }));

  return (
    <div className="mx-auto max-w-6xl px-6 py-32">
      <div className="text-center">
        <RainbetLogo />
        <p className="font-display mt-4 text-6xl text-emerald-300 sm:text-7xl">
          {currencyWhole.format(Number(period.prize_pool))}
        </p>
        <p className="mt-6 text-xs tracking-[0.3em] text-white/40 uppercase">
          {monthLabel(period.start_at)} — live — top 10
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

      <LeaderboardTable
        entries={rows}
        emptyMessage="No wagers logged yet this period — be the first to show up here."
      />

      <div className="mt-16 text-center">
        <p className="text-xs tracking-[0.3em] text-white/40 uppercase">
          Time Left
        </p>
        <div className="mt-4">
          <Countdown targetIso={`${period.end_at}T${PERIOD_RESET_TIME_UTC}Z`} />
        </div>
      </div>

      <PreviousMonths periods={closedPeriods} viewingPeriodId={null} />
    </div>
  );
}
