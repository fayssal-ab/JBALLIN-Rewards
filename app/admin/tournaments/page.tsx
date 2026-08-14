import { getTournamentSlots, getTournamentPrize } from "@/lib/tournament";
import { isAdminSession } from "@/lib/admin";
import { TournamentBoard } from "@/components/TournamentBoard";

export const dynamic = "force-dynamic";

export default async function AdminTournamentsPage() {
  // AdminLayout already blocks non-admins visually, but Next still
  // executes this segment's data fetch regardless of what the layout
  // renders — its props end up in the RSC payload either way. This is
  // the check that actually stops the query from running.
  if (!(await isAdminSession())) return null;

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
