import { Icon } from "@/components/Icon";
import {
  getActivePredictionEntry,
  getPredictionGuesses,
  getPredictionHistory,
} from "@/lib/prediction";

// Live guesses come in through the Kick webhook, not a page navigation —
// this must re-query on every request or the round would look frozen.
export const dynamic = "force-dynamic";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

export default async function PredictionPage() {
  const activeEntry = await getActivePredictionEntry();
  const [guesses, history] = await Promise.all([
    activeEntry ? getPredictionGuesses(activeEntry.id) : Promise.resolve([]),
    getPredictionHistory(),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-32">
      <div className="text-center">
        <p className="text-xs tracking-[0.3em] text-white/40 uppercase">
          Prediction Game
        </p>
        <h1 className="font-display mt-2 text-4xl uppercase text-white sm:text-5xl">
          Guess The Bonus
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-white/60">
          When a bonus goes live, type{" "}
          <span className="font-semibold text-emerald-300">
            !gb &lt;amount&gt;
          </span>{" "}
          in Kick chat to guess its payout. Whoever lands closest to the real
          number wins.
        </p>
      </div>

      {activeEntry ? (
        <div className="animate-glow-pulse mt-12 overflow-hidden rounded-3xl border border-emerald-400/30 bg-gradient-to-b from-emerald-400/10 to-transparent p-8 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-[10px] font-bold tracking-wide text-red-400 uppercase">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
            </span>
            Live
          </span>

          {activeEntry.image_url ? (
            <img
              src={activeEntry.image_url}
              alt=""
              className="mx-auto mt-5 h-20 w-20 rounded-2xl object-cover"
            />
          ) : (
            <div className="mx-auto mt-5 flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
              <Icon name="box" className="h-8 w-8 text-white/20" />
            </div>
          )}

          <h2 className="font-display mt-4 text-3xl uppercase text-white">
            {activeEntry.slot_name}
          </h2>
          <p className="mt-1 text-sm text-white/50">
            Bet: {currency.format(Number(activeEntry.bet))}
          </p>

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
          No bonus is being guessed right now — check back when a bonus hunt
          goes live on stream.
        </div>
      )}

      {history.length > 0 ? (
        <div className="mt-16">
          <p className="text-xs tracking-[0.3em] text-white/40 uppercase">
            Past Rounds
          </p>
          <div className="mt-4 space-y-2">
            {history.map((round) => (
              <div
                key={round.id}
                className="flex items-center gap-3 rounded-xl border border-white/5 bg-zinc-900/40 px-4 py-3"
              >
                {round.image_url ? (
                  <img
                    src={round.image_url}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03]">
                    <Icon name="box" className="h-4 w-4 text-white/20" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-white/90">
                    {round.slot_name}
                  </p>
                  <p className="text-xs text-white/40">
                    Paid {currency.format(Number(round.payout))} ·{" "}
                    {round.guessCount} {round.guessCount === 1 ? "guess" : "guesses"}
                  </p>
                </div>
                {round.winner ? (
                  <div className="shrink-0 text-right">
                    <p className="flex items-center justify-end gap-1 text-sm font-semibold text-emerald-300">
                      <Icon name="crown" className="h-3.5 w-3.5" />
                      {round.winner}
                    </p>
                    <p className="text-xs text-white/40">
                      guessed {currency.format(Number(round.winnerGuess))}
                    </p>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
