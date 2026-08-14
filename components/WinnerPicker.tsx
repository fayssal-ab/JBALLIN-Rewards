"use client";

import { useEffect, useRef, useState } from "react";

const ROLL_STEPS = 24;

export function WinnerPicker() {
  const [namesText, setNamesText] = useState("");
  const [rolling, setRolling] = useState(false);
  const [display, setDisplay] = useState<string | null>(null);
  const [winner, setWinner] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => clearTimeout(timerRef.current ?? undefined), []);

  const entries = namesText
    .split("\n")
    .map((n) => n.trim())
    .filter(Boolean);

  function roll() {
    if (entries.length < 2 || rolling) return;
    setRolling(true);
    setWinner(null);
    const chosen = entries[Math.floor(Math.random() * entries.length)];

    let step = 0;
    function tick() {
      step += 1;
      if (step >= ROLL_STEPS) {
        setDisplay(chosen);
        setWinner(chosen);
        setRolling(false);
        return;
      }
      setDisplay(entries[Math.floor(Math.random() * entries.length)]);
      const delay = 60 + (step / ROLL_STEPS) ** 2 * 300;
      timerRef.current = setTimeout(tick, delay);
    }
    tick();
  }

  return (
    <div>
      <p className="text-xs tracking-[0.3em] text-white/40 uppercase">
        Giveaway
      </p>
      <h1 className="font-display text-3xl uppercase text-white sm:text-4xl">
        Winner Roller
      </h1>
      <p className="mt-3 max-w-md text-sm text-white/60">
        Paste one name per line, then roll to pick a random winner.
      </p>

      <textarea
        value={namesText}
        onChange={(e) => setNamesText(e.target.value)}
        placeholder={"player1\nplayer2\nplayer3"}
        rows={8}
        className="mt-6 w-full max-w-md rounded-xl border border-white/10 bg-zinc-900 p-3 text-sm text-white placeholder:text-white/20 focus:border-emerald-400/30 focus:outline-none"
      />

      <p className="mt-2 text-xs text-white/30">{entries.length} entries</p>

      <button
        type="button"
        onClick={roll}
        disabled={entries.length < 2 || rolling}
        className="mt-4 rounded-lg bg-emerald-400 px-6 py-3 text-sm font-bold text-black transition-transform hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
      >
        {rolling ? "Rolling…" : "Roll winner"}
      </button>

      {display ? (
        <div
          className={`mt-10 max-w-md rounded-2xl border p-10 text-center transition-colors ${
            winner
              ? "animate-glow-pulse border-emerald-400/50 bg-emerald-400/5"
              : "border-white/10 bg-zinc-900/50"
          }`}
        >
          {winner ? (
            <p className="text-[10px] tracking-[0.3em] text-emerald-400/60 uppercase">
              🎉 Winner
            </p>
          ) : null}
          <p className="font-display mt-2 text-3xl uppercase text-white sm:text-4xl">
            {display}
          </p>
        </div>
      ) : null}
    </div>
  );
}
