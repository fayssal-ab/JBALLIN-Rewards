import { Icon } from "@/components/Icon";
import { getBonusHunt } from "@/lib/bonusHunt";
import {
  getGuessBalanceRound,
  getBalanceGuesses,
  getFinalBalanceIfHuntComplete,
  getGuessBalanceHistory,
} from "@/lib/prediction";

// Live guesses come in through the Kick webhook, not a page navigation —
// this must re-query on every request or the round would look frozen.
export const dynamic = "force-dynamic";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

function dateLabel(dateStr: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateStr));
}

export default async function PredictionPage() {
  const [{ startingBalance, entries }, round, guesses, final, history] = await Promise.all([
    getBonusHunt(),
    getGuessBalanceRound(),
    getBalanceGuesses(),
    getFinalBalanceIfHuntComplete(),
    getGuessBalanceHistory(),
  ]);

  const opened = entries.filter((e) => e.payout !== null);

  return (
    <div className="mx-auto max-w-3xl px-6 py-32">
      <div className="text-center">
        <p className="text-xs tracking-[0.3em] text-white/40 uppercase">
          Prediction Game
        </p>
        <h1 className="font-display mt-2 text-4xl uppercase text-white sm:text-5xl">
          Guess The Balance
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-white/60">
          When guessing is open, type{" "}
          <span className="font-semibold text-emerald-300">
            !gb &lt;amount&gt;
          </span>{" "}
          in Kick chat to guess the bonus hunt&apos;s final balance. Closest
          guess once every bonus is opened wins.
        </p>
      </div>

      {final ? (
        <div className="mt-12 overflow-hidden rounded-3xl border border-emerald-400/30 bg-gradient-to-b from-emerald-400/10 to-transparent p-8 text-center">
          <p className="text-xs tracking-[0.3em] text-emerald-400/60 uppercase">
            Hunt Complete
          </p>
          <p className="font-display mt-2 text-5xl text-white">
            {currency.format(final.finalBalance)}
          </p>
          <p className="mt-1 text-sm text-white/50">Final balance</p>

          {final.ranked.length > 0 ? (
            <div className="mx-auto mt-8 max-w-md space-y-2">
              {final.ranked.slice(0, 5).map((g) => (
                <div
                  key={g.username}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                    g.rank === 1
                      ? "border-emerald-400/50 bg-emerald-400/5"
                      : "border-white/10 bg-zinc-900/40"
                  }`}
                >
                  <span className="flex items-center gap-2 font-medium text-white">
                    {g.rank === 1 ? (
                      <Icon name="crown" className="h-4 w-4 text-emerald-300" />
                    ) : (
                      <span className="text-white/40">#{g.rank}</span>
                    )}
                    {g.username}
                  </span>
                  <span className="text-sm text-white/60">
                    guessed {currency.format(Number(g.guess))}{" "}
                    <span className="text-white/30">
                      (off by {currency.format(g.offBy)})
                    </span>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-white/40">
              Nobody guessed this hunt.
            </p>
          )}
        </div>
      ) : round.active ? (
        <div className="animate-glow-pulse mt-12 overflow-hidden rounded-3xl border border-emerald-400/30 bg-gradient-to-b from-emerald-400/10 to-transparent p-8 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-[10px] font-bold tracking-wide text-red-400 uppercase">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
            </span>
            Live
          </span>

          <div className="mx-auto mt-6 grid max-w-sm grid-cols-2 gap-4 text-center">
            <div>
              <p className="font-display text-2xl text-emerald-300">
                {currency.format(Number(startingBalance))}
              </p>
              <p className="mt-1 text-[10px] tracking-wide text-white/40 uppercase">
                Starting Balance
              </p>
            </div>
            <div>
              <p className="font-display text-2xl text-white">
                {opened.length}/{entries.length}
              </p>
              <p className="mt-1 text-[10px] tracking-wide text-white/40 uppercase">
                Bonuses Opened
              </p>
            </div>
          </div>

          <p className="mt-6 flex items-center justify-center gap-1.5 text-xs tracking-wide text-white/40 uppercase">
            <Icon name="users" className="h-3.5 w-3.5" />
            {guesses.length} {guesses.length === 1 ? "guess" : "guesses"} so far
          </p>

          {guesses.length > 0 ? (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {guesses.map((g) => (
                <span
                  key={g.username}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm font-medium text-white"
                >
                  {g.username}{" "}
                  <span className="text-emerald-300">
                    {currency.format(Number(g.guess))}
                  </span>
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-12 rounded-3xl border border-white/10 bg-zinc-900/40 p-12 text-center text-white/50">
          No guessing round is open right now — check back when a bonus hunt
          goes live on stream.
        </div>
      )}

      {history.length > 0 ? (
        <div className="mt-16">
          <p className="text-center text-xs tracking-[0.3em] text-white/40 uppercase">
            Previous Hunts
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {history.map((h) => (
              <div
                key={h.id}
                className="rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900/50 to-zinc-950/50 p-5 transition-colors hover:border-emerald-400/30"
              >
                <p className="text-[10px] tracking-wide text-white/30 uppercase">
                  {dateLabel(h.resolved_at)}
                </p>
                <p className="font-display mt-1 text-2xl text-white">
                  {currency.format(Number(h.final_balance))}
                </p>
                <p className="text-[10px] tracking-wide text-white/40 uppercase">
                  Final Balance
                </p>

                <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                {h.winner_username ? (
                  <p className="mt-4 text-sm">
                    <span className="flex items-center gap-1.5 font-semibold text-emerald-300">
                      <Icon name="crown" className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{h.winner_username}</span>
                    </span>
                    <span className="mt-0.5 block text-white/40">
                      guessed {currency.format(Number(h.winner_guess))}
                    </span>
                  </p>
                ) : (
                  <p className="mt-4 text-sm text-white/30">No guesses that round</p>
                )}
                <p className="mt-1 text-xs text-white/30">
                  {h.guess_count} {h.guess_count === 1 ? "guess" : "guesses"} total
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
