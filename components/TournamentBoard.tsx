"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TournamentSlots, Round } from "@/lib/tournament";

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
}: {
  name: string | null;
  highlight?: boolean;
  editable?: boolean;
  onSave?: (value: string | null) => void;
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
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
        highlight
          ? "border-emerald-400/50 bg-emerald-400/5 shadow-[0_0_20px_rgba(52,211,153,0.15)]"
          : "border-white/10 bg-zinc-900/50"
      }`}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 text-xs text-white/40">
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
    <div className="hidden items-center px-2 text-emerald-400/40 lg:flex">
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export function TournamentBoard({
  slots,
  isAdmin,
}: {
  slots: TournamentSlots;
  isAdmin: boolean;
}) {
  const router = useRouter();

  async function save(round: Round, slotIndex: number, name: string | null) {
    await callApi({ action: "set", round, slotIndex, name });
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

  return (
    <div>
      {isAdmin ? (
        <div className="mt-6 flex justify-center">
          <button
            onClick={resetBracket}
            className="rounded-md border border-red-400/30 px-3 py-1 text-xs text-red-300 hover:bg-red-400/10"
          >
            Reset bracket
          </button>
        </div>
      ) : null}

      <div className="mt-10 flex flex-col items-center gap-10 overflow-x-auto pb-4 lg:flex-row lg:items-stretch lg:justify-center">
        {/* Round of 8 */}
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
            />
          ))}
        </div>

        <Arrow />

        {/* Semifinals */}
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
            />
          ))}
        </div>

        <Arrow />

        {/* Final */}
        <div className="flex h-[520px] flex-col justify-center">
          <RealMatch
            round={3}
            a={0}
            b={1}
            nameAt={nameAt}
            editable={isAdmin}
            save={save}
            highlight
          />
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
}: {
  round: Round;
  a: number;
  b: number;
  nameAt: (round: Round, index: number) => string | null;
  editable: boolean;
  save: (round: Round, slotIndex: number, name: string | null) => void;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <SlotBox
        name={nameAt(round, a)}
        highlight={highlight}
        editable={editable}
        onSave={(value) => save(round, a, value)}
      />
      <p className="text-center text-[10px] tracking-widest text-white/30">VS</p>
      <SlotBox
        name={nameAt(round, b)}
        highlight={highlight}
        editable={editable}
        onSave={(value) => save(round, b, value)}
      />
    </div>
  );
}
