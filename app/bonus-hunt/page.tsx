import { getBonusHunt } from "@/lib/bonusHunt";
import { isAdminSession } from "@/lib/admin";
import { AdminToggle } from "@/components/AdminToggle";
import { BonusHuntBoard } from "@/components/BonusHuntBoard";

export const dynamic = "force-dynamic";

export default async function BonusHuntPage() {
  const [{ entries, startingBalance }, isAdmin] = await Promise.all([
    getBonusHunt(),
    isAdminSession(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-32">
      <div className="text-center">
        <p className="text-xs tracking-[0.3em] text-white/40 uppercase">
          Live bonus hunt
        </p>
        <h1 className="font-display mt-2 text-4xl uppercase text-white sm:text-5xl">
          Bonus Hunt
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-white/60">
          Slots are played just long enough to trigger their bonus round,
          then collected without opening it. Once enough bonuses are
          collected, they get opened back-to-back on stream.
        </p>
        <AdminToggle isAdmin={isAdmin} />
      </div>

      <BonusHuntBoard
        entries={entries}
        startingBalance={startingBalance}
        isAdmin={isAdmin}
      />
    </div>
  );
}
