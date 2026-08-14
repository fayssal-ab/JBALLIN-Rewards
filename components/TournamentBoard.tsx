"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TournamentSlots, Round } from "@/lib/tournament";

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
  editable = false,
  onSave,
  delay = 0,
}: {
  name: string | null;
  highlight?: boolean;
  editable?: boolean;
  onSave?: (value: string | null) => void;
  delay?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name ?? "");

  if (editable && editing) {
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
              onSave?.(value || null);
            }
          }}
          className="w-full bg-transparent text-sm text-white focus:outline-none"
          placeholder="Slot name"
        />
        <button
          onClick={() => {
            setEditing(false);
            onSave?.(value || null);
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
      {editable ? (
        <button
          onClick={() => setEditing(true)}
          className="shrink-0 text-white/30 hover:text-emerald-300"
          aria-label="Edit slot"
        >
          ✎
        </button>
      ) : null}
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

export function TournamentBoard({
  slots,
  prize,
  isAdmin,
}: {
  slots: TournamentSlots;
  prize: string;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [prizeInput, setPrizeInput] = useState(prize);
  const [busy, setBusy] = useState(false);

  async function save(round: Round, slotIndex: number, name: string | null) {
    await callApi({ action: "set", round, slotIndex, name });
    router.refresh();
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
        {isAdmin ? (
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
        ) : Number(prize) > 0 ? (
          <>
            <p className="font-display animate-shimmer-text bg-gradient-to-r from-white via-emerald-300 to-white bg-clip-text text-4xl text-transparent">
              {currency.format(Number(prize))}
            </p>
            <p className="mt-1 text-[10px] tracking-[0.3em] text-white/40 uppercase">
              Winner Prize
            </p>
          </>
        ) : null}
      </div>

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
                editable={isAdmin}
                save={save}
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
                editable={isAdmin}
                save={save}
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
              editable={isAdmin}
              save={save}
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
          <span className="animate-crown-bounce inline-block text-4xl">
            👑
          </span>
          {isAdmin ? (
            <div className="mt-3">
              <SlotBox
                name={champion}
                highlight
                editable
                onSave={(value) => save(4, 0, value)}
              />
            </div>
          ) : (
            <p className="font-display animate-shimmer-text mt-3 bg-gradient-to-r from-white via-emerald-300 to-white bg-clip-text text-2xl uppercase text-transparent">
              {champion ?? "TBD"}
            </p>
          )}
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
  editable,
  save,
  highlight = false,
  delay = 0,
}: {
  round: Round;
  a: number;
  b: number;
  nameAt: (round: Round, index: number) => string | null;
  editable: boolean;
  save: (round: Round, slotIndex: number, name: string | null) => void;
  highlight?: boolean;
  delay?: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <SlotBox
        name={nameAt(round, a)}
        highlight={highlight}
        editable={editable}
        onSave={(value) => save(round, a, value)}
        delay={delay}
      />
      <p className="text-center text-[10px] tracking-widest text-white/30">VS</p>
      <SlotBox
        name={nameAt(round, b)}
        highlight={highlight}
        editable={editable}
        onSave={(value) => save(round, b, value)}
        delay={delay + 40}
      />
    </div>
  );
}
