import { getTournamentSlots, getTournamentPrize } from "@/lib/tournament";
import { isAdminSession } from "@/lib/admin";
import { AdminToggle } from "@/components/AdminToggle";
import { TournamentBoard } from "@/components/TournamentBoard";

export const dynamic = "force-dynamic";

export default async function TournamentsPage() {
  const [slots, prize, isAdmin] = await Promise.all([
    getTournamentSlots(),
    getTournamentPrize(),
    isAdminSession(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-32">
      <div className="text-center">
        <p className="text-xs tracking-[0.3em] text-white/40 uppercase">
          Live bracket
        </p>
        <h1 className="font-display text-4xl uppercase text-white sm:text-5xl">
          Slot <span className="text-emerald-300">Tournament</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-white/60">
          Ultimate slot showdown — 8 slots go head-to-head, highest
          multiplier advances, until one slot is crowned champion.
        </p>
        <AdminToggle isAdmin={isAdmin} />
      </div>

      <TournamentBoard slots={slots} prize={prize} isAdmin={isAdmin} />
    </div>
  );
}
