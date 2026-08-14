"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TournamentSlots, Round } from "@/lib/tournament";
import { Icon } from "@/components/Icon";

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

function SlotBox({
  name,
  highlight = false,
  onSave,
  onDeclareWinner,
  delay = 0,
}: {
  name: string | null;
  highlight?: boolean;
  onSave: (value: string | null) => void;
  /** Copies this slot's name into the next round and advances the bracket. */
  onDeclareWinner?: () => void;
  delay?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name ?? "");

  if (editing) {
    return (
      <div
        className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 ${
          highlight ? "border-emerald-400/50 bg-emerald-400/5" : "border-white/10 bg-zinc-900/50"
        }`}
      >
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setEditing(false);
              onSave(value || null);
            }
          }}
          className="w-full bg-transparent text-sm text-white focus:outline-none"
          placeholder="Slot name"
        />
        <button
          onClick={() => {
            setEditing(false);
            onSave(value || null);
          }}
          className="shrink-0 text-xs text-emerald-300"
        >
          Save
        </button>
      </div>
    );
  }

  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className={`animate-fade-in-up group flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-300 hover:-translate-y-0.5 ${
        highlight
          ? "border-emerald-400/50 bg-emerald-400/5 shadow-[0_0_20px_rgba(52,211,153,0.15)] hover:shadow-[0_0_30px_rgba(52,211,153,0.25)]"
          : "border-white/10 bg-zinc-900/50 hover:border-emerald-400/30"
      }`}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 text-xs text-white/40 group-hover:border-emerald-400/30 group-hover:text-emerald-300">
        ?
      </span>
      <div className="flex-1">
        <p className="text-sm font-semibold text-white">{name ?? "TBD"}</p>
        {!name ? <p className="text-[11px] text-white/30">—</p> : null}
      </div>
      {name && onDeclareWinner ? (
        <button
          onClick={onDeclareWinner}
          title="Advance as winner"
          aria-label="Advance as winner"
          className="shrink-0 rounded-md border border-emerald-400/30 p-1 text-emerald-300 hover:bg-emerald-400/10"
        >
          <Icon name="check" className="h-3.5 w-3.5" />
        </button>
      ) : null}
      <button
        onClick={() => setEditing(true)}
        className="shrink-0 text-white/30 hover:text-emerald-300"
        aria-label="Edit slot"
      >
        <Icon name="edit" className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function Arrow() {
  return (
    <div className="hidden items-center px-2 text-emerald-400/50 lg:flex">
      <svg
        viewBox="0 0 24 24"
        className="animate-pulse-arrow h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
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
    if (!confirm("Reset the whole bracket?")) return;
    await callApi({ action: "reset" });
    router.refresh();
  }

  function nameAt(round: Round, index: number): string | null {
    return slots[round]?.[index] ?? null;
  }

  const champion = nameAt(4, 0);

  return (
    <div>
      {/* Prize */}
      <div className="mt-6 text-center">
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="text-white/40">Winner prize:</span>
          <input
            value={prizeInput}
            onChange={(e) => setPrizeInput(e.target.value)}
            className="w-24 rounded-md border border-white/10 bg-zinc-900 px-2 py-1 text-white"
          />
          <button
            onClick={savePrize}
            disabled={busy}
            className="rounded-md border border-emerald-400/30 px-3 py-1 text-emerald-300 hover:bg-emerald-400/10 disabled:opacity-50"
          >
            Save
          </button>
          <button
            onClick={resetBracket}
            disabled={busy}
            className="rounded-md border border-red-400/30 px-3 py-1 text-red-300 hover:bg-red-400/10 disabled:opacity-50"
          >
            Reset bracket
          </button>
        </div>
      </div>

      <p className="mx-auto mt-4 max-w-sm text-center text-[11px] text-white/30">
        Click the <Icon name="check" className="inline h-3 w-3 align-[-1px] text-emerald-300" /> on
        a name to advance it as the winner. Click the{" "}
        <Icon name="edit" className="inline h-3 w-3 align-[-1px]" /> to rename
        a slot.
      </p>

      <div className="mt-10 flex flex-col items-start gap-10 overflow-x-auto pb-4 lg:flex-row lg:justify-center">
        {/* Round of 8 */}
        <div>
          <RoundLabel>Round of 8</RoundLabel>
          <div className="flex h-[520px] flex-col justify-around gap-4">
            {[0, 1, 2, 3].map((pair) => (
              <RealMatch
                key={pair}
                round={1}
                a={pair * 2}
                b={pair * 2 + 1}
                nameAt={nameAt}
                save={save}
                declareWinner={declareWinner}
                delay={pair * 80}
              />
            ))}
          </div>
        </div>

        <div className="hidden h-[520px] items-center lg:flex">
          <Arrow />
        </div>

        {/* Semifinals */}
        <div>
          <RoundLabel>Semifinals</RoundLabel>
          <div className="flex h-[520px] flex-col justify-around gap-4">
            {[0, 1].map((pair) => (
              <RealMatch
                key={pair}
                round={2}
                a={pair * 2}
                b={pair * 2 + 1}
                nameAt={nameAt}
                save={save}
                declareWinner={declareWinner}
                delay={320 + pair * 80}
              />
            ))}
          </div>
        </div>

        <div className="hidden h-[520px] items-center lg:flex">
          <Arrow />
        </div>

        {/* Final */}
        <div>
          <RoundLabel>Final</RoundLabel>
          <div className="flex h-[520px] flex-col justify-center">
            <RealMatch
              round={3}
              a={0}
              b={1}
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
          <span className="animate-crown-bounce inline-block">
            <Icon name="crown" className="h-10 w-10 text-emerald-300" />
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
  nameAt,
  save,
  declareWinner,
  highlight = false,
  delay = 0,
}: {
  round: Round;
  a: number;
  b: number;
  nameAt: (round: Round, index: number) => string | null;
  save: (round: Round, slotIndex: number, name: string | null) => void;
  declareWinner: (round: Round, slotIndex: number) => void;
  highlight?: boolean;
  delay?: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <SlotBox
        name={nameAt(round, a)}
        highlight={highlight}
        onSave={(value) => save(round, a, value)}
        onDeclareWinner={() => declareWinner(round, a)}
        delay={delay}
      />
      <p className="text-center text-[10px] tracking-widest text-white/30">VS</p>
      <SlotBox
        name={nameAt(round, b)}
        highlight={highlight}
        onSave={(value) => save(round, b, value)}
        onDeclareWinner={() => declareWinner(round, b)}
        delay={delay + 40}
      />
    </div>
  );
}
