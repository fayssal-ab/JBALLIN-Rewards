"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { TournamentSlots, Round } from "@/lib/tournament";
import { Icon } from "@/components/Icon";
import { ChampionBadge } from "@/components/ChampionBadge";
import { useConfirm } from "@/components/ConfirmDialog";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

async function callApi(body: object) {
  await fetch("/api/admin/tournament", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// Click straight into a slot and type — no separate edit-mode toggle to
// click through first. Saves on blur/Enter, same pattern as the payout
// inputs in BonusHuntBoard.
function SlotBox({
  name,
  highlight = false,
  onSave,
  onDeclareWinner,
}: {
  name: string | null;
  highlight?: boolean;
  onSave: (value: string | null) => void;
  /** Copies this slot's name into the next round and advances the bracket. */
  onDeclareWinner?: () => void;
}) {
  const [value, setValue] = useState(name ?? "");

  // Syncs when a name lands here from elsewhere (declareWinner writing into
  // the next round's slot, or another tab). Doesn't clobber an in-progress
  // edit, since `name` only changes after the parent re-fetches — not on
  // every keystroke.
  useEffect(() => setValue(name ?? ""), [name]);

  function commit() {
    const trimmed = value.trim();
    if (trimmed !== (name ?? "")) onSave(trimmed || null);
  }

  return (
    <div
      className={`group flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-all duration-300 hover:-translate-y-0.5 ${
        highlight
          ? "border-emerald-400/50 bg-emerald-400/5 shadow-[0_0_20px_rgba(52,211,153,0.15)] hover:shadow-[0_0_30px_rgba(52,211,153,0.25)]"
          : "border-white/10 bg-zinc-900/50 hover:border-emerald-400/30"
      }`}
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        placeholder="TBD"
        className="w-full min-w-0 bg-transparent text-sm font-semibold text-white placeholder:text-white/25 placeholder:font-normal focus:outline-none"
      />
      {name && onDeclareWinner ? (
        <button
          onClick={onDeclareWinner}
          title="Advance as winner"
          aria-label="Advance as winner"
          className="shrink-0 rounded-md border border-emerald-400/30 p-1 text-emerald-300 opacity-0 transition-opacity hover:bg-emerald-400/10 group-hover:opacity-100"
        >
          <Icon name="check" className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}

/** Distributes n items evenly (justify-around style) and returns each one's vertical center as a %. */
function centersOf(n: number): number[] {
  return Array.from({ length: n }, (_, i) => ((2 * i + 1) / (2 * n)) * 100);
}

// CSS-only bracket connector: two "L" shapes per pair of source matches,
// meeting at their shared midpoint — which lands exactly on the next
// round's slot because every column shares the same fixed height and
// justify-around spacing. No JS layout measurement needed.
function BracketConnector({ sourceCount }: { sourceCount: number }) {
  const centers = centersOf(sourceCount);
  const pairs = Array.from({ length: sourceCount / 2 }, (_, i) => ({
    top: centers[i * 2],
    bottom: centers[i * 2 + 1],
  }));

  return (
    <div className="relative hidden h-[800px] w-10 shrink-0 lg:block">
      {pairs.map((pair, i) => {
        const mid = (pair.top + pair.bottom) / 2;
        return (
          <div key={i}>
            <div
              className="absolute left-0 w-full rounded-br-lg border-r-2 border-b-2 border-emerald-400/25"
              style={{ top: `${pair.top}%`, height: `${mid - pair.top}%` }}
            />
            <div
              className="absolute left-0 w-full rounded-tr-lg border-r-2 border-t-2 border-emerald-400/25"
              style={{ top: `${mid}%`, height: `${pair.bottom - mid}%` }}
            />
          </div>
        );
      })}
    </div>
  );
}

function RoundLabel({ children }: { children: string }) {
  return (
    <p className="mb-2 text-center text-[10px] font-bold tracking-[0.3em] text-emerald-400/50 uppercase">
      {children}
    </p>
  );
}

/** Where a winner from (round, slotIndex) lands next, or null past the final. */
function nextSlot(round: Round, slotIndex: number): { round: Round; index: number } | null {
  if (round === 4) return null;
  const nextRound = (round + 1) as Round;
  const nextIndex = round === 3 ? 0 : Math.floor(slotIndex / 2);
  return { round: nextRound, index: nextIndex };
}

export function TournamentBoard({
  slots,
  prize,
}: {
  slots: TournamentSlots;
  prize: string;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [prizeInput, setPrizeInput] = useState(prize);
  const [busy, setBusy] = useState(false);

  async function save(round: Round, slotIndex: number, name: string | null) {
    await callApi({ action: "set", round, slotIndex, name });
    router.refresh();
  }

  // One click on a name copies it into its slot in the next round — no
  // retyping the winner by hand.
  async function declareWinner(round: Round, slotIndex: number) {
    const name = nameAt(round, slotIndex);
    const target = nextSlot(round, slotIndex);
    if (!name || !target) return;
    await save(target.round, target.index, name);
  }

  async function savePrize() {
    setBusy(true);
    await callApi({ action: "prize", amount: prizeInput || "0" });
    setBusy(false);
    router.refresh();
  }

  async function resetBracket() {
    if (!(await confirm("Reset the whole bracket?", { danger: true }))) return;
    await callApi({ action: "reset" });
    router.refresh();
  }

  function nameAt(round: Round, index: number): string | null {
    return slots[round]?.[index] ?? null;
  }

  const champion = nameAt(4, 0);

  return (
    <div>
      {/* Toolbar */}
      <div className="mx-auto mt-6 flex max-w-xl flex-wrap items-center justify-center gap-3 rounded-2xl border border-white/10 bg-zinc-900/40 px-5 py-4">
        <span className="text-xs tracking-wide text-white/40 uppercase">
          Winner prize
        </span>
        <input
          value={prizeInput}
          onChange={(e) => setPrizeInput(e.target.value)}
          className="w-24 rounded-md border border-white/10 bg-zinc-900 px-2 py-1.5 text-sm text-white"
        />
        <button
          onClick={savePrize}
          disabled={busy}
          className="rounded-md border border-emerald-400/30 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-400/10 disabled:opacity-50"
        >
          Save
        </button>
        <div className="mx-1 hidden h-5 w-px bg-white/10 sm:block" />
        <button
          onClick={resetBracket}
          disabled={busy}
          className="rounded-md border border-red-400/30 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-400/10 disabled:opacity-50"
        >
          Reset bracket
        </button>
      </div>

      <p className="mx-auto mt-4 max-w-sm text-center text-[11px] text-white/30">
        Type a name straight into a slot — it saves automatically. Hover a
        filled slot and click{" "}
        <Icon name="check" className="inline h-3 w-3 align-[-1px] text-emerald-300" /> to
        advance it as the winner.
      </p>

      <div className="mt-10 flex flex-col items-start gap-6 overflow-x-auto pb-4 lg:flex-row lg:justify-center lg:gap-0">
        {/* Round of 8 */}
        <div>
          <RoundLabel>Round of 8</RoundLabel>
          <div className="flex h-[800px] w-56 flex-col justify-around gap-4">
            {[0, 1, 2, 3].map((pair) => (
              <RealMatch
                key={pair}
                round={1}
                a={pair * 2}
                b={pair * 2 + 1}
                label={`Match ${pair + 1}`}
                nameAt={nameAt}
                save={save}
                declareWinner={declareWinner}
                delay={pair * 80}
              />
            ))}
          </div>
        </div>

        <BracketConnector sourceCount={4} />

        {/* Semifinals */}
        <div>
          <RoundLabel>Semifinals</RoundLabel>
          <div className="flex h-[800px] w-56 flex-col justify-around gap-4">
            {[0, 1].map((pair) => (
              <RealMatch
                key={pair}
                round={2}
                a={pair * 2}
                b={pair * 2 + 1}
                label={`Match ${pair + 1}`}
                nameAt={nameAt}
                save={save}
                declareWinner={declareWinner}
                delay={320 + pair * 80}
              />
            ))}
          </div>
        </div>

        <BracketConnector sourceCount={2} />

        {/* Final */}
        <div>
          <RoundLabel>Final</RoundLabel>
          <div className="flex h-[800px] w-56 flex-col justify-center">
            <RealMatch
              round={3}
              a={0}
              b={1}
              label="Final"
              nameAt={nameAt}
              save={save}
              declareWinner={declareWinner}
              highlight
              delay={480}
            />
          </div>
        </div>
      </div>

      {/* Champion spotlight */}
      <div className="mx-auto mt-16 max-w-md text-center">
        <p className="text-[10px] tracking-[0.3em] text-white/40 uppercase">
          Champion
        </p>
        <div className="animate-glow-pulse mt-3 rounded-2xl border border-emerald-400/30 bg-gradient-to-b from-emerald-400/10 to-transparent p-8">
          <span className="animate-crown-bounce inline-block drop-shadow-[0_0_14px_rgba(52,211,153,0.6)]">
            <ChampionBadge className="h-20 w-20" />
          </span>
          <div className="mt-3">
            <SlotBox name={champion} highlight onSave={(value) => save(4, 0, value)} />
          </div>
        </div>
      </div>
    </div>
  );
}

function RealMatch({
  round,
  a,
  b,
  label,
  nameAt,
  save,
  declareWinner,
  highlight = false,
  delay = 0,
}: {
  round: Round;
  a: number;
  b: number;
  label: string;
  nameAt: (round: Round, index: number) => string | null;
  save: (round: Round, slotIndex: number, name: string | null) => void;
  declareWinner: (round: Round, slotIndex: number) => void;
  highlight?: boolean;
  delay?: number;
}) {
  // Each match is its own bordered card — pairing used to rely purely on
  // the gap between boxes being a bit smaller than the gap between
  // matches, which wasn't obvious at a glance. A visible container around
  // the two names makes "these two play each other" unambiguous.
  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className={`animate-fade-in-up rounded-2xl border p-2.5 ${
        highlight ? "border-emerald-400/25 bg-emerald-400/[0.03]" : "border-white/10 bg-white/[0.02]"
      }`}
    >
      <p className="mb-2 text-center text-[9px] font-bold tracking-[0.2em] text-white/25 uppercase">
        {label}
      </p>
      <SlotBox
        name={nameAt(round, a)}
        highlight={highlight}
        onSave={(value) => save(round, a, value)}
        onDeclareWinner={() => declareWinner(round, a)}
      />
      <div className="my-1.5 flex items-center gap-2">
        <div className="h-px flex-1 bg-white/10" />
        <p className="text-[10px] font-bold tracking-widest text-white/40">VS</p>
        <div className="h-px flex-1 bg-white/10" />
      </div>
      <SlotBox
        name={nameAt(round, b)}
        highlight={highlight}
        onSave={(value) => save(round, b, value)}
        onDeclareWinner={() => declareWinner(round, b)}
      />
    </div>
  );
}
