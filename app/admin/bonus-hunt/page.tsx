import { getBonusHunt } from "@/lib/bonusHunt";
import { BonusHuntBoard } from "@/components/BonusHuntBoard";

export const dynamic = "force-dynamic";

export default async function AdminBonusHuntPage() {
  const { entries, startingBalance } = await getBonusHunt();

  return (
    <div>
      <p className="text-xs tracking-[0.3em] text-white/40 uppercase">
        Live bonus hunt
      </p>
      <h1 className="font-display text-3xl uppercase text-white sm:text-4xl">
        Bonus Hunt
      </h1>

      <BonusHuntBoard entries={entries} startingBalance={startingBalance} />
    </div>
  );
}
