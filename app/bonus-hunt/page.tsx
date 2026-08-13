// Sample hunt for layout purposes only — same pattern as the leaderboard
// before it was wired to real data. A real bonus hunt needs an admin flow
// to add bonuses live during a session; not built yet.
const STARTING_BALANCE = 5000;

const BONUSES = [
  { slot: "Wanted Dead or a Wild", provider: "Hacksaw Gaming", bet: 5.0, payout: 2100.0 },
  { slot: "Gates of Olympus", provider: "Pragmatic Play", bet: 2.5, payout: 340.0 },
  { slot: "Sweet Bonanza", provider: "Pragmatic Play", bet: 1.6, payout: 48.0 },
  { slot: "Fruit Party 2", provider: "Pragmatic Play", bet: 1.0, payout: 22.0 },
  { slot: "Tombstone R.I.P.", provider: "Print Studios", bet: 2.0, payout: 18.0 },
  { slot: "Le Bandit", provider: "Hacksaw Gaming", bet: 4.0, payout: null },
  { slot: "Money Train 3", provider: "Relax Gaming", bet: 3.0, payout: null },
  { slot: "Big Bass Bonanza", provider: "Pragmatic Play", bet: 2.0, payout: null },
];

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

export default function BonusHuntPage() {
  const totalCost = BONUSES.reduce((sum, b) => sum + b.bet, 0);
  const opened = BONUSES.filter((b) => b.payout !== null);
  const totalPayout = opened.reduce((sum, b) => sum + (b.payout ?? 0), 0);
  const openedCost = opened.reduce((sum, b) => sum + b.bet, 0);
  const averageX = openedCost > 0 ? totalPayout / openedCost : 0;
  const profit = totalPayout - totalCost;
  const pendingCost = totalCost - openedCost;
  const remainingToBreakEven = totalCost - totalPayout;
  const requiredAvgX =
    remainingToBreakEven > 0 && pendingCost > 0
      ? remainingToBreakEven / pendingCost
      : 0;

  const stats = [
    { label: "Starting Balance", value: currency.format(STARTING_BALANCE) },
    { label: "Total Cost", value: currency.format(totalCost) },
    { label: "Total Payout", value: currency.format(totalPayout) },
    {
      label: "Profit / Loss",
      value: `${profit >= 0 ? "+" : ""}${currency.format(profit)}`,
    },
    { label: "Average X", value: `${averageX.toFixed(2)}x` },
    {
      label: "Required Avg X",
      value: requiredAvgX > 0 ? `${requiredAvgX.toFixed(2)}x` : "Break even reached",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-32">
      <div className="text-center">
        <p className="text-xs tracking-[0.3em] text-white/40 uppercase">
          Sample hunt — not live yet
        </p>
        <h1 className="font-display mt-2 text-4xl uppercase text-white sm:text-5xl">
          Bonus Hunt
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-white/60">
          Slots are played just long enough to trigger their bonus round,
          then collected without opening it. Once enough bonuses are
          collected, they get opened back-to-back on stream.
        </p>
      </div>

      {/* Stats */}
      <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-white/10 bg-zinc-900/40 p-4 text-center"
          >
            <p className="font-display text-lg text-emerald-300 sm:text-xl">
              {stat.value}
            </p>
            <p className="mt-1 text-[10px] tracking-wide text-white/40 uppercase">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Bonus list */}
      <div className="mt-10 overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-white/50 uppercase tracking-wide">
            <tr>
              <th className="px-6 py-3 font-medium">#</th>
              <th className="px-6 py-3 font-medium">Slot</th>
              <th className="hidden px-6 py-3 font-medium sm:table-cell">
                Provider
              </th>
              <th className="px-6 py-3 text-right font-medium">Bet</th>
              <th className="px-6 py-3 text-right font-medium">Payout</th>
              <th className="px-6 py-3 text-right font-medium">Mult.</th>
            </tr>
          </thead>
          <tbody>
            {BONUSES.map((b, i) => {
              const mult = b.payout !== null ? b.payout / b.bet : null;
              return (
                <tr
                  key={b.slot}
                  className="border-t border-white/5 text-white/80 hover:bg-white/[0.03]"
                >
                  <td className="px-6 py-3 text-white/40">{i + 1}</td>
                  <td className="px-6 py-3 font-medium">{b.slot}</td>
                  <td className="hidden px-6 py-3 text-white/50 sm:table-cell">
                    {b.provider}
                  </td>
                  <td className="px-6 py-3 text-right">
                    {currency.format(b.bet)}
                  </td>
                  <td className="px-6 py-3 text-right">
                    {b.payout !== null ? currency.format(b.payout) : "—"}
                  </td>
                  <td className="px-6 py-3 text-right font-semibold text-emerald-300">
                    {mult !== null ? `${mult.toFixed(1)}x` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
