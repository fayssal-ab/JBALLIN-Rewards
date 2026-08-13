// Sample bracket for layout purposes only — same "static for now" pattern
// as Bonus Hunt and the pre-wiring leaderboard. Round 1 is filled in with
// sample slots; later rounds stay TBD since their contents depend on who
// actually wins, which nothing here decides yet.
const ROUND_1 = [
  ["Gates of Olympus", "Sweet Bonanza"],
  ["Wanted Dead or a Wild", "Le Bandit"],
  ["Money Train 3", "Fruit Party 2"],
  ["Big Bass Bonanza", "Tombstone R.I.P."],
];

function SlotBox({
  name,
  highlight = false,
}: {
  name: string | null;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
        highlight
          ? "border-emerald-400/50 bg-emerald-400/5 shadow-[0_0_20px_rgba(52,211,153,0.15)]"
          : "border-white/10 bg-zinc-900/50"
      }`}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 text-xs text-white/40">
        ?
      </span>
      <div>
        <p className="text-sm font-semibold text-white">{name ?? "TBD"}</p>
        {!name ? <p className="text-[11px] text-white/30">—</p> : null}
      </div>
    </div>
  );
}

function Match({
  a,
  b,
  highlight = false,
}: {
  a: string | null;
  b: string | null;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <SlotBox name={a} highlight={highlight} />
      <p className="text-center text-[10px] tracking-widest text-white/30">
        VS
      </p>
      <SlotBox name={b} highlight={highlight} />
    </div>
  );
}

function Arrow() {
  return (
    <div className="hidden items-center px-2 text-emerald-400/40 lg:flex">
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export default function TournamentsPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-32">
      <div className="text-center">
        <p className="text-xs tracking-[0.3em] text-white/40 uppercase">
          Sample bracket — not live yet
        </p>
        <h1 className="font-display text-4xl uppercase text-white sm:text-5xl">
          Slot <span className="text-emerald-300">Tournament</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-white/60">
          Ultimate slot showdown — 8 slots go head-to-head, highest
          multiplier advances, until one slot is crowned champion.
        </p>
      </div>

      <div className="mt-16 flex flex-col items-center gap-10 overflow-x-auto pb-4 lg:flex-row lg:items-stretch lg:justify-center">
        {/* Round of 8 */}
        <div className="flex h-[520px] flex-col justify-around gap-4">
          {ROUND_1.map(([a, b]) => (
            <Match key={`${a}-${b}`} a={a} b={b} />
          ))}
        </div>

        <Arrow />

        {/* Semifinals */}
        <div className="flex h-[520px] flex-col justify-around gap-4">
          <Match a={null} b={null} />
          <Match a={null} b={null} />
        </div>

        <Arrow />

        {/* Final */}
        <div className="flex h-[520px] flex-col justify-center">
          <Match a={null} b={null} highlight />
        </div>
      </div>
    </div>
  );
}
