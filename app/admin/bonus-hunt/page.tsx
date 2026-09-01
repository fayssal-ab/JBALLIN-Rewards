import { getBonusHunt } from "@/lib/bonusHunt";
import {
  getGuessBalanceRound,
  getBalanceGuesses,
  getFinalBalanceIfHuntComplete,
} from "@/lib/prediction";
import { isAdminSession } from "@/lib/admin";
import { BonusHuntBoard } from "@/components/BonusHuntBoard";
import { Icon } from "@/components/Icon";

export const dynamic = "force-dynamic";

export default async function AdminBonusHuntPage() {
  // See the comment in app/admin/tournaments/page.tsx: the layout hiding
  // {children} doesn't stop this segment's fetch from running, so this
  // check has to happen here too, before any query.
  if (!(await isAdminSession())) return null;

  const [{ entries, startingBalance }, round, guesses, final] = await Promise.all([
    getBonusHunt(),
    getGuessBalanceRound(),
    getBalanceGuesses(),
    getFinalBalanceIfHuntComplete(),
  ]);

  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/40 bg-gradient-to-br from-emerald-400/20 to-emerald-400/5 shadow-[0_0_30px_rgba(52,211,153,0.25)]">
          <div className="animate-glow-pulse absolute inset-0 rounded-2xl" />
          <Icon name="box" className="h-7 w-7 text-emerald-300" />
        </div>
        <div>
          <p className="flex items-center gap-1.5 text-xs font-bold tracking-[0.3em] text-emerald-400/70 uppercase">
            <Icon name="bolt" className="h-3 w-3" />
            Live Bonus Hunt
          </p>
          <h1 className="animate-shimmer-text font-display bg-gradient-to-r from-white via-emerald-200 to-white bg-clip-text text-4xl text-transparent uppercase sm:text-5xl">
            Bonus Hunt
          </h1>
        </div>
      </div>

      <BonusHuntBoard
        entries={entries}
        startingBalance={startingBalance}
        initialPrediction={{ round, guessCount: guesses.length, final }}
      />
    </div>
  );
}
