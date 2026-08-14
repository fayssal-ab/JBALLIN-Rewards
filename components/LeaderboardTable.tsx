import { existsSync } from "node:fs";
import { join } from "node:path";
import Image from "next/image";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
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

export interface LeaderboardRow {
  rainbet_id: string;
  maskedUsername: string;
  wagered_amount: string;
  rank: number;
  reward: number;
}

export function LeaderboardTable({
  entries,
  emptyMessage,
}: {
  entries: LeaderboardRow[];
  emptyMessage: string;
}) {
  if (entries.length === 0) {
    return (
      <div className="mt-16 rounded-3xl border border-white/10 bg-zinc-900/40 p-12 text-center">
        <p className="text-white/60">{emptyMessage}</p>
      </div>
    );
  }

  const podium = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <>
      <div className="mt-16 grid gap-6 sm:grid-cols-3">
        {podium.map((entry, i) => {
          const trophy = trophySrc(entry.rank);
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
                      priority
                      className="object-contain brightness-0 invert drop-shadow-[0_0_12px_rgba(52,211,153,0.6)]"
                    />
                  </div>
                </div>
              ) : null}

              <p className="mt-3 font-semibold text-white">
                {entry.maskedUsername}
              </p>

              <p className="font-display mt-3 text-3xl text-emerald-300">
                {currency.format(entry.reward)}
              </p>

              <div className="h-px w-16 bg-gradient-to-r from-transparent via-white/15 to-transparent" />

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
                {entry.maskedUsername}
              </span>
              <span className="hidden shrink-0 text-right text-sm text-white/50 sm:block">
                {currency.format(Number(entry.wagered_amount))}
              </span>
              <span className="w-16 shrink-0 text-right font-bold text-emerald-300 sm:w-20">
                {currency.format(entry.reward)}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}
