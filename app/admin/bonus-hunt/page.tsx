import { getBonusHunt } from "@/lib/bonusHunt";
import { isAdminSession } from "@/lib/admin";
import { BonusHuntBoard } from "@/components/BonusHuntBoard";

export const dynamic = "force-dynamic";

export default async function AdminBonusHuntPage() {
  // See the comment in app/admin/tournaments/page.tsx: the layout hiding
  // {children} doesn't stop this segment's fetch from running, so this
  // check has to happen here too, before any query.
  if (!(await isAdminSession())) return null;

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
