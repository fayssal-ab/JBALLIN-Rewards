import { getTournamentSlots, getTournamentPrize } from "@/lib/tournament";
import { TournamentBoard } from "@/components/TournamentBoard";

export const dynamic = "force-dynamic";

export default async function AdminTournamentsPage() {
  const [slots, prize] = await Promise.all([
    getTournamentSlots(),
    getTournamentPrize(),
  ]);

  return (
    <div>
      <p className="text-xs tracking-[0.3em] text-white/40 uppercase">
        Live bracket
      </p>
      <h1 className="font-display text-3xl uppercase text-white sm:text-4xl">
        Slot <span className="text-emerald-300">Tournament</span>
      </h1>

      <TournamentBoard slots={slots} prize={prize} />
    </div>
  );
}
