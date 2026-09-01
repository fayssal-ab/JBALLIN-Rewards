"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { BonusHuntEntry } from "@/lib/bonusHunt";
import type { SlotSuggestion } from "@/lib/slotSearch";
import { Icon } from "@/components/Icon";
import { useConfirm } from "@/components/ConfirmDialog";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

async function callApi(body: object) {
  await fetch("/api/admin/bonus-hunt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// Slot-name autocomplete, backed by slot.report (see lib/slotSearch.ts).
// Debounced so it doesn't hit the API on every keystroke.
function SlotNameInput({
  value,
  onChange,
  onPick,
}: {
  value: string;
  onChange: (value: string) => void;
  onPick: (slot: SlotSuggestion) => void;
}) {
  const [suggestions, setSuggestions] = useState<SlotSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/slots/search?q=${encodeURIComponent(value)}`);
      const data = await res.json();
      setSuggestions(data.results ?? []);
      setOpen(true);
    }, 250);
    return () => clearTimeout(timer);
  }, [value]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={boxRef} className="relative">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder="Slot name"
        autoComplete="off"
        className="w-40 rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white"
      />
      {open && suggestions.length > 0 ? (
        <div className="absolute left-0 top-full z-10 mt-1 max-h-56 w-64 overflow-y-auto rounded-md border border-white/10 bg-zinc-900 shadow-lg">
          {suggestions.map((s) => (
            <button
              key={`${s.name}-${s.provider}`}
              type="button"
              onClick={() => {
                onPick(s);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-emerald-400/10"
            >
              <img
                src={s.imageUrl}
                alt=""
                onError={(e) => { (e.target as HTMLImageElement).style.visibility = "hidden"; }}
                className="h-8 w-8 shrink-0 rounded object-cover"
              />
              <span className="flex flex-col items-start">
                <span className="text-white">{s.name}</span>
                <span className="text-xs text-white/40">{s.provider}</span>
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

interface RankedGuess {
  username: string;
  guess: string;
  offBy: number;
  rank: number;
  prize: number;
}

interface PredictionState {
  round: {
    active: boolean;
    started_at: string | null;
    rank1Prize: string;
    rank2Prize: string;
    rank3Prize: string;
  };
  guessCount: number;
  final: { finalBalance: number; prizePool: number; ranked: RankedGuess[] } | null;
}

export function BonusHuntBoard({
  entries,
  startingBalance,
  initialPrediction,
}: {
  entries: BonusHuntEntry[];
  startingBalance: string;
  initialPrediction: PredictionState;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ slotName: "", provider: "", imageUrl: "", bet: "" });
  const [balanceInput, setBalanceInput] = useState(startingBalance);
  const [prediction, setPrediction] = useState<PredictionState>(initialPrediction);
  const [prizeInputs, setPrizeInputs] = useState({ rank1: "", rank2: "", rank3: "" });

  // Polls while mounted — guesses arrive via the Kick webhook, not through
  // this admin session, so nothing else would otherwise update this view.
  useEffect(() => {
    let cancelled = false;
    async function poll() {
      const res = await fetch("/api/admin/prediction");
      if (!res.ok || cancelled) return;
      setPrediction(await res.json());
    }
    const interval = setInterval(poll, 4000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  async function callPredictionApi(body: object) {
    setBusy(true);
    await fetch("/api/admin/prediction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const res = await fetch("/api/admin/prediction");
    setPrediction(await res.json());
    setBusy(false);
  }

  const totalCost = entries.reduce((sum, b) => sum + Number(b.bet), 0);
  const opened = entries.filter((b) => b.payout !== null);
  const totalPayout = opened.reduce((sum, b) => sum + Number(b.payout), 0);
  const openedCost = opened.reduce((sum, b) => sum + Number(b.bet), 0);
  const averageX = openedCost > 0 ? totalPayout / openedCost : 0;
  // Profit/Loss is against the starting balance (what the account actually
  // gained or lost), not total bet size — those are unrelated numbers; a
  // slot's listed "bet" is just the stake level it hit at, not money spent
  // out of this balance to buy the bonus.
  const profit = totalPayout - Number(startingBalance);
  const profitPercent = Number(startingBalance) > 0 ? (profit / Number(startingBalance)) * 100 : 0;
  const pendingCost = totalCost - openedCost;
  const remainingToBreakEven = totalCost - totalPayout;
  const requiredAvgX =
    remainingToBreakEven > 0 && pendingCost > 0
      ? remainingToBreakEven / pendingCost
      : 0;

  const stats = [
    { label: "Starting Balance", value: currency.format(Number(startingBalance)) },
    { label: "Total Cost", value: currency.format(totalCost) },
    { label: "Total Payout", value: currency.format(totalPayout) },
    {
      label: "Profit / Loss",
      value: `${profit >= 0 ? "+" : ""}${currency.format(profit)} (${profit >= 0 ? "+" : ""}${profitPercent.toFixed(1)}%)`,
    },
    { label: "Average X", value: `${averageX.toFixed(2)}x` },
    {
      label: "Required Avg X",
      value: requiredAvgX > 0 ? `${requiredAvgX.toFixed(2)}x` : "Break even reached",
    },
  ];

  async function refresh() {
    setBusy(false);
    router.refresh();
  }

  async function addEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!form.slotName || !form.bet) return;
    setBusy(true);
    await callApi({
      action: "add",
      slotName: form.slotName,
      provider: form.provider || undefined,
      imageUrl: form.imageUrl || undefined,
      bet: form.bet,
    });
    setForm({ slotName: "", provider: "", imageUrl: "", bet: "" });
    await refresh();
  }

  async function setPayout(id: number, value: string) {
    setBusy(true);
    await callApi({ action: "payout", id, payout: value === "" ? null : value });
    await refresh();
  }

  async function removeEntry(id: number) {
    setBusy(true);
    await callApi({ action: "delete", id });
    await refresh();
  }

  async function saveBalance() {
    setBusy(true);
    await callApi({ action: "balance", amount: balanceInput || "0" });
    await refresh();
  }

  async function resetHunt() {
    if (!(await confirm("Reset the whole bonus hunt? This deletes every entry.", { danger: true }))) return;
    setBusy(true);
    await callApi({ action: "reset" });
    await refresh();
  }

  return (
    <div>
      <div className="mt-6 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-white/40">Starting balance:</span>
        <input
          value={balanceInput}
          onChange={(e) => setBalanceInput(e.target.value)}
          className="w-24 rounded-md border border-white/10 bg-zinc-900 px-2 py-1 text-white"
        />
        <button
          onClick={saveBalance}
          disabled={busy}
          className="rounded-md border border-emerald-400/30 px-3 py-1 text-emerald-300 hover:bg-emerald-400/10 disabled:opacity-50"
        >
          Save
        </button>
        <button
          onClick={resetHunt}
          disabled={busy}
          className="rounded-md border border-red-400/30 px-3 py-1 text-red-300 hover:bg-red-400/10 disabled:opacity-50"
        >
          Reset hunt
        </button>
      </div>

      {/* Stats */}
      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
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

      {/* Guess The Balance — one round for the whole hunt, viewers guess
          the final balance via "!gb <amount>" in Kick chat. */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-400/[0.05] to-transparent">
        <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
          <Icon name="target" className="h-4 w-4 text-emerald-300" />
          <span className="text-xs font-bold tracking-wide text-white/70 uppercase">
            Guess The Balance
          </span>
          {prediction.round.active ? (
            <span className="ml-auto flex items-center gap-1.5 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-red-400 uppercase">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
              </span>
              Live · {prediction.guessCount}
            </span>
          ) : null}
        </div>

        <div className="p-4">
          {!prediction.round.active ? (
            <div className="flex flex-wrap items-end gap-2">
              <div>
                <label className="text-[10px] font-semibold tracking-wide text-white/40 uppercase">
                  1st prize
                </label>
                <input
                  value={prizeInputs.rank1}
                  onChange={(e) => setPrizeInputs({ ...prizeInputs, rank1: e.target.value })}
                  placeholder="$0"
                  className="mt-1 block w-20 rounded-md border border-white/10 bg-zinc-900 px-2 py-1.5 text-sm text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold tracking-wide text-white/40 uppercase">
                  2nd prize
                </label>
                <input
                  value={prizeInputs.rank2}
                  onChange={(e) => setPrizeInputs({ ...prizeInputs, rank2: e.target.value })}
                  placeholder="$0"
                  className="mt-1 block w-20 rounded-md border border-white/10 bg-zinc-900 px-2 py-1.5 text-sm text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold tracking-wide text-white/40 uppercase">
                  3rd prize
                </label>
                <input
                  value={prizeInputs.rank3}
                  onChange={(e) => setPrizeInputs({ ...prizeInputs, rank3: e.target.value })}
                  placeholder="$0"
                  className="mt-1 block w-20 rounded-md border border-white/10 bg-zinc-900 px-2 py-1.5 text-sm text-white"
                />
              </div>
              <button
                onClick={() =>
                  callPredictionApi({
                    action: "start",
                    rank1Prize: prizeInputs.rank1,
                    rank2Prize: prizeInputs.rank2,
                    rank3Prize: prizeInputs.rank3,
                  })
                }
                disabled={busy}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-400 px-3 py-2 text-xs font-bold text-black disabled:opacity-50"
              >
                <Icon name="bolt" className="h-3 w-3" />
                Start guessing
              </button>
              <p className="w-full text-xs text-white/40">
                Leave a prize blank for fewer than 3 paid places. Viewers type{" "}
                <span className="font-semibold text-white/70">!gb &lt;amount&gt;</span>{" "}
                in chat to guess the hunt&apos;s final balance.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => callPredictionApi({ action: "stop" })}
                disabled={busy}
                className="flex items-center gap-1.5 rounded-lg border border-red-400/30 px-3 py-1.5 text-xs font-bold text-red-300 hover:bg-red-400/10 disabled:opacity-50"
              >
                <Icon name="stop" className="h-3 w-3" />
                Stop guessing
              </button>
              {prediction.guessCount > 0 ? (
                <button
                  onClick={async () => {
                    if (await confirm("Clear every guess collected so far?", { danger: true })) {
                      callPredictionApi({ action: "clear" });
                    }
                  }}
                  disabled={busy}
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/50 hover:border-white/20 hover:text-white disabled:opacity-50"
                >
                  Clear guesses
                </button>
              ) : null}
              <p className="text-xs text-white/40">
                Paying{" "}
                {[prediction.round.rank1Prize, prediction.round.rank2Prize, prediction.round.rank3Prize]
                  .map((p, i) => (Number(p) > 0 ? `#${i + 1} ${currency.format(Number(p))}` : null))
                  .filter(Boolean)
                  .join(" · ") || "no prizes set"}
              </p>
            </div>
          )}
        </div>

        {prediction.final ? (
          <div className="border-t border-white/5 p-4">
            <p className="text-xs text-white/50">
              Hunt complete — final balance{" "}
              <span className="font-semibold text-emerald-300">
                {currency.format(prediction.final.finalBalance)}
              </span>
            </p>
            {prediction.final.ranked.length > 0 ? (
              <ol className="mt-2 space-y-1 text-sm">
                {prediction.final.ranked.slice(0, 5).map((g) => (
                  <li key={g.username} className="flex items-center justify-between text-white/70">
                    <span>
                      #{g.rank} {g.username}
                    </span>
                    <span>
                      {currency.format(Number(g.guess))}{" "}
                      <span className="text-white/30">
                        (off by {currency.format(g.offBy)})
                      </span>
                      {g.prize > 0 ? (
                        <span className="ml-2 font-semibold text-emerald-300">
                          +{currency.format(g.prize)}
                        </span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ol>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Add entry — kept above the list so it stays reachable without
          scrolling once the hunt has a lot of entries. */}
      <form
        onSubmit={addEntry}
        className="mt-8 flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-zinc-900/40 p-4"
      >
        <SlotNameInput
          value={form.slotName}
          onChange={(slotName) => setForm({ ...form, slotName })}
          onPick={(slot) =>
            setForm({ ...form, slotName: slot.name, provider: slot.provider, imageUrl: slot.imageUrl })
          }
        />
        <input
          value={form.provider}
          onChange={(e) => setForm({ ...form, provider: e.target.value })}
          placeholder="Provider (optional)"
          className="w-40 rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white"
        />
        <input
          value={form.bet}
          onChange={(e) => setForm({ ...form, bet: e.target.value })}
          placeholder="Bet"
          className="w-24 rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-emerald-400 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
        >
          Add bonus
        </button>
      </form>

      {/* Bonus list */}
      {entries.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-white/10 bg-zinc-900/40 p-12 text-center text-white/50">
          No bonuses collected yet.
        </div>
      ) : (
        <div className="mt-10 overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-white/50 uppercase tracking-wide">
              <tr>
                <th className="px-6 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium" />
                <th className="px-6 py-3 font-medium">Slot</th>
                <th className="hidden px-6 py-3 font-medium sm:table-cell">
                  Provider
                </th>
                <th className="px-6 py-3 text-right font-medium">Bet</th>
                <th className="px-6 py-3 text-right font-medium">Payout</th>
                <th className="px-6 py-3 text-right font-medium">Mult.</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {entries.map((b, i) => {
                const mult = b.payout !== null ? Number(b.payout) / Number(b.bet) : null;
                return (
                  <tr
                    key={b.id}
                    className="border-t border-white/5 text-white/80 hover:bg-white/[0.03]"
                  >
                    <td className="px-6 py-3 text-white/40">{i + 1}</td>
                    <td className="py-3 pl-4">
                      {b.image_url ? (
                        // Arbitrary admin-pasted URLs, any host — plain <img>
                        // instead of next/image so it doesn't 404 against
                        // next.config's remotePatterns allowlist.
                        <img
                          src={b.image_url}
                          alt=""
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03]">
                          <Icon name="box" className="h-4 w-4 text-white/20" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-3 font-medium">{b.slot_name}</td>
                    <td className="hidden px-6 py-3 text-white/50 sm:table-cell">
                      {b.provider ?? "—"}
                    </td>
                    <td className="px-6 py-3 text-right">
                      {currency.format(Number(b.bet))}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <input
                        defaultValue={b.payout ?? ""}
                        placeholder="—"
                        onBlur={(e) => {
                          if (e.target.value !== (b.payout ?? "")) {
                            setPayout(b.id, e.target.value);
                          }
                        }}
                        className="w-24 rounded-md border border-white/10 bg-zinc-900 px-2 py-1 text-right text-white"
                      />
                    </td>
                    <td className="px-6 py-3 text-right font-semibold text-emerald-300">
                      {mult !== null ? `${mult.toFixed(1)}x` : "—"}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => removeEntry(b.id)}
                        disabled={busy}
                        aria-label="Remove entry"
                        className="text-white/30 hover:text-red-400"
                      >
                        <Icon name="close" className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
