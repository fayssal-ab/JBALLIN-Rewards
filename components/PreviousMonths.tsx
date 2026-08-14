import Link from "next/link";
import type { ClosedPeriodSummary } from "@/lib/periods";

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

export function PreviousMonths({
  periods,
  viewingPeriodId,
}: {
  periods: ClosedPeriodSummary[];
  /** The closed period currently on screen, or null when viewing the live board. */
  viewingPeriodId: number | null;
}) {
  if (periods.length === 0) return null;

  return (
    <div className="mt-20">
      <p className="text-xs tracking-[0.3em] text-white/40 uppercase">
        Previous Months
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {periods.map((period) => {
          const viewing = period.id === viewingPeriodId;
          return (
            <Link
              key={period.id}
              href={`/leaderboard?period=${period.id}`}
              className={`rounded-2xl border p-5 transition-colors ${
                viewing
                  ? "border-emerald-400/50 bg-emerald-400/5"
                  : "border-white/10 bg-zinc-900/40 hover:border-emerald-400/20"
              }`}
            >
              <p className="font-display text-lg text-white">
                {monthLabel(period.start_at)}
              </p>
              <p className="mt-1 text-xs text-white/40">
                {period.winner_count} winners
              </p>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-[10px] tracking-wide text-white/40 uppercase">
                    Prize pool
                  </p>
                  <p className="font-display text-xl text-emerald-300">
                    {currencyWhole.format(Number(period.prize_pool))}
                  </p>
                </div>
                <span className="text-xs font-semibold text-emerald-300">
                  {viewing ? "Viewing" : "View →"}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
