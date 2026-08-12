// Sample tiers for layout purposes only — replace thresholds/rewards with
// the real numbers once decided.
const MILESTONES = [
  { threshold: 1_000, reward: "Shoutout on stream" },
  { threshold: 5_000, reward: "Exclusive Discord role" },
  { threshold: 25_000, reward: "Merch pack" },
  { threshold: 100_000, reward: "Cash bonus" },
];

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default function MilestonesPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-32">
      <div className="text-center">
        <p className="text-xs tracking-[0.3em] text-white/40 uppercase">
          Sample milestones
        </p>
        <h1 className="font-display mt-2 text-4xl uppercase text-white sm:text-5xl">
          Wager Milestones
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-white/60">
          Hit these lifetime wager thresholds under code JBALLIN to unlock
          extra rewards. Thresholds and rewards below are placeholders.
        </p>
      </div>

      <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {MILESTONES.map((milestone) => (
          <div
            key={milestone.threshold}
            className="rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900/40 to-zinc-950/40 p-6 text-center transition-colors hover:border-emerald-400/30"
          >
            <p className="font-display text-2xl text-emerald-300">
              {currency.format(milestone.threshold)}
            </p>
            <Divider />
            <p className="mt-4 text-sm text-white/70">{milestone.reward}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Divider() {
  return (
    <div className="mx-auto mt-4 h-px w-12 bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
  );
}
