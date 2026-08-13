"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BonusHuntEntry } from "@/lib/bonusHunt";

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

export function BonusHuntBoard({
  entries,
  startingBalance,
  isAdmin,
}: {
  entries: BonusHuntEntry[];
  startingBalance: string;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ slotName: "", provider: "", bet: "" });
  const [balanceInput, setBalanceInput] = useState(startingBalance);

  const totalCost = entries.reduce((sum, b) => sum + Number(b.bet), 0);
  const opened = entries.filter((b) => b.payout !== null);
  const totalPayout = opened.reduce((sum, b) => sum + Number(b.payout), 0);
  const openedCost = opened.reduce((sum, b) => sum + Number(b.bet), 0);
  const averageX = openedCost > 0 ? totalPayout / openedCost : 0;
  const profit = totalPayout - totalCost;
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
    { label: "Profit / Loss", value: `${profit >= 0 ? "+" : ""}${currency.format(profit)}` },
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
      bet: form.bet,
    });
    setForm({ slotName: "", provider: "", bet: "" });
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
    if (!confirm("Reset the whole bonus hunt? This deletes every entry.")) return;
    setBusy(true);
    await callApi({ action: "reset" });
    await refresh();
  }

  return (
    <div>
      {isAdmin ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs">
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
      ) : null}

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
                <th className="px-6 py-3 font-medium">Slot</th>
                <th className="hidden px-6 py-3 font-medium sm:table-cell">
                  Provider
                </th>
                <th className="px-6 py-3 text-right font-medium">Bet</th>
                <th className="px-6 py-3 text-right font-medium">Payout</th>
                <th className="px-6 py-3 text-right font-medium">Mult.</th>
                {isAdmin ? <th className="px-6 py-3" /> : null}
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
                    <td className="px-6 py-3 font-medium">{b.slot_name}</td>
                    <td className="hidden px-6 py-3 text-white/50 sm:table-cell">
                      {b.provider ?? "—"}
                    </td>
                    <td className="px-6 py-3 text-right">
                      {currency.format(Number(b.bet))}
                    </td>
                    <td className="px-6 py-3 text-right">
                      {isAdmin ? (
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
                      ) : b.payout !== null ? (
                        currency.format(Number(b.payout))
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-6 py-3 text-right font-semibold text-emerald-300">
                      {mult !== null ? `${mult.toFixed(1)}x` : "—"}
                    </td>
                    {isAdmin ? (
                      <td className="px-6 py-3 text-right">
                        <button
                          onClick={() => removeEntry(b.id)}
                          disabled={busy}
                          className="text-white/30 hover:text-red-400"
                        >
                          ✕
                        </button>
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {isAdmin ? (
        <form
          onSubmit={addEntry}
          className="mt-6 flex flex-wrap items-center justify-center gap-2"
        >
          <input
            value={form.slotName}
            onChange={(e) => setForm({ ...form, slotName: e.target.value })}
            placeholder="Slot name"
            className="w-40 rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white"
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
      ) : null}
    </div>
  );
}
