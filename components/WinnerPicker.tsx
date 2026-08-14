"use client";

import { useMemo, useRef, useState } from "react";
import { Icon } from "@/components/Icon";

const ITEM_WIDTH = 128; // px — must match the w-32 class on each reel card
const ITEM_GAP = 8; // px — matches gap-2
const STEP = ITEM_WIDTH + ITEM_GAP;
const REEL_LENGTH = 36;
const WINNER_INDEX = 28; // leaves a few cards after it so the strip doesn't look like it "ran out"

const CONFETTI_COLORS = ["#34d399", "#ffffff", "#fbbf24"];
const CONFETTI_COUNT = 28;

export function WinnerPicker() {
  const [namesText, setNamesText] = useState("");
  const [rolling, setRolling] = useState(false);
  const [reel, setReel] = useState<string[] | null>(null);
  const [winner, setWinner] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [rollId, setRollId] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);

  const confetti = useMemo(
    () =>
      Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 350,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        rotate: Math.random() * 360,
      })),
    [rollId]
  );

  const entries = namesText
    .split("\n")
    .map((n) => n.trim())
    .filter(Boolean);

  function roll() {
    if (entries.length < 2 || rolling) return;
    const chosen = entries[Math.floor(Math.random() * entries.length)];
    const strip = Array.from({ length: REEL_LENGTH }, (_, i) =>
      i === WINNER_INDEX
        ? chosen
        : entries[Math.floor(Math.random() * entries.length)]
    );

    setWinner(null);
    setReel(strip);
    setRolling(true);
    setOffset(0);

    // Let the strip paint at offset 0 with the transition already attached,
    // then move it on the next frame so the browser actually animates the
    // change instead of jumping straight to the target.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const viewportWidth = viewportRef.current?.offsetWidth ?? 0;
        setOffset(WINNER_INDEX * STEP + ITEM_WIDTH / 2 - viewportWidth / 2);
      });
    });
  }

  function onReelTransitionEnd() {
    if (!rolling || !reel) return;
    setRolling(false);
    setWinner(reel[WINNER_INDEX]);
    setRollId((id) => id + 1);
  }

  // For elimination-style giveaways: drop the winner from the list so the
  // next roll can't pick them again.
  function removeWinnerAndReset() {
    if (!winner) return;
    setNamesText((text) =>
      text
        .split("\n")
        .filter((line) => line.trim() !== winner)
        .join("\n")
    );
    setReel(null);
    setWinner(null);
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
        Paste one name per line, then roll to spin the wheel and land on a
        random winner.
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

      {reel ? (
        <div
          ref={viewportRef}
          className="relative mx-auto mt-10 h-24 max-w-md overflow-hidden rounded-2xl border border-emerald-400/30 bg-zinc-900/50"
        >
          <div className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-0.5 -translate-x-1/2 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-full bg-gradient-to-r from-zinc-950 via-transparent to-zinc-950" />
          <div
            onTransitionEnd={onReelTransitionEnd}
            className="flex h-full items-center gap-2 px-2 transition-transform duration-[4000ms] ease-out"
            style={{ transform: `translateX(${-offset}px)` }}
          >
            {reel.map((name, i) => (
              <div
                key={i}
                style={{ width: ITEM_WIDTH }}
                className={`flex h-16 shrink-0 items-center justify-center rounded-xl border px-2 text-center text-sm font-semibold ${
                  !rolling && i === WINNER_INDEX
                    ? "border-emerald-400/60 bg-emerald-400/10 text-emerald-300"
                    : "border-white/10 bg-zinc-900/70 text-white/70"
                }`}
              >
                <span className="truncate">{name}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {winner ? (
        <div className="animate-glow-pulse relative mx-auto mt-6 max-w-md overflow-hidden rounded-2xl border border-emerald-400/50 bg-emerald-400/5 p-6 text-center">
          {confetti.map((c) => (
            <span
              key={c.id}
              className="animate-confetti pointer-events-none absolute top-0 h-2 w-2"
              style={{
                left: `${c.left}%`,
                animationDelay: `${c.delay}ms`,
                backgroundColor: c.color,
                transform: `rotate(${c.rotate}deg)`,
              }}
            />
          ))}
          <p className="flex items-center justify-center gap-1.5 text-[10px] tracking-[0.3em] text-emerald-400/60 uppercase">
            <Icon name="trophy" className="h-3.5 w-3.5" />
            Winner
          </p>
          <p className="font-display animate-winner-pop mt-2 text-3xl uppercase text-white sm:text-4xl">
            {winner}
          </p>
          <button
            type="button"
            onClick={removeWinnerAndReset}
            className="relative z-10 mx-auto mt-4 flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/50 hover:border-red-400/30 hover:text-red-300"
          >
            <Icon name="close" className="h-3 w-3" />
            Remove from list
          </button>
        </div>
      ) : null}
    </div>
  );
}
