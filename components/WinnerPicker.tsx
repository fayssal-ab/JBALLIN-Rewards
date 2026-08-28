"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Icon } from "@/components/Icon";

const ITEM_WIDTH = 128; // px — must match the w-32 class on each reel card
const ITEM_GAP = 8; // px — matches gap-2
const STEP = ITEM_WIDTH + ITEM_GAP;
const REEL_LENGTH = 36;
const WINNER_INDEX = 28; // leaves a few cards after it so the strip doesn't look like it "ran out"
const ROLL_DURATION_MS = 4000;

const CONFETTI_COLORS = ["#34d399", "#ffffff", "#fbbf24"];
const CONFETTI_COUNT = 28;

type EntryMode = "manual" | "kick";

interface GiveawayApiState {
  session: { active: boolean; keyword: string; started_at: string | null };
  entries: string[];
}

export function WinnerPicker() {
  const [namesText, setNamesText] = useState("");
  const [rolling, setRolling] = useState(false);
  const [reel, setReel] = useState<string[] | null>(null);
  const [winner, setWinner] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [instant, setInstant] = useState(false);
  const [rollId, setRollId] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const finishTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [entryMode, setEntryMode] = useState<EntryMode>("manual");
  const [keyword, setKeyword] = useState("!giveaway");
  const [sessionActive, setSessionActive] = useState(false);
  const [liveEntries, setLiveEntries] = useState<string[]>([]);
  const [kickBusy, setKickBusy] = useState(false);
  const [connectStatus, setConnectStatus] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (finishTimer.current) clearTimeout(finishTimer.current);
    };
  }, []);

  async function refreshGiveawayState() {
    const res = await fetch("/api/admin/giveaway");
    if (!res.ok) return;
    const data = (await res.json()) as GiveawayApiState;
    setSessionActive(data.session.active);
    // Only sync the keyword field from the server while a session is
    // actually running (it's read-only in that state anyway). Otherwise
    // this poll — which fires every 3s regardless of what the admin is
    // doing — would stomp on a keyword they're mid-typing before starting.
    if (data.session.active) setKeyword(data.session.keyword);
    setLiveEntries(data.entries);
  }

  // Poll while the Kick tab is open so the entry count updates live as
  // chat messages come in, without the admin having to refresh.
  useEffect(() => {
    if (entryMode !== "kick") return;
    refreshGiveawayState();
    const interval = setInterval(refreshGiveawayState, 3000);
    return () => clearInterval(interval);
  }, [entryMode]);

  async function startListening() {
    if (!keyword.trim()) return;
    setKickBusy(true);
    await fetch("/api/admin/giveaway", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start", keyword: keyword.trim() }),
    });
    await refreshGiveawayState();
    setKickBusy(false);
  }

  // Stopping hands the collected usernames to the same textarea/roll flow
  // manual mode uses — one roller, two ways to fill it.
  async function stopListening() {
    setKickBusy(true);
    await fetch("/api/admin/giveaway", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "stop" }),
    });
    const res = await fetch("/api/admin/giveaway");
    const data = (await res.json()) as GiveawayApiState;
    setSessionActive(false);
    setLiveEntries(data.entries);
    setNamesText(data.entries.join("\n"));
    setKickBusy(false);
  }

  async function connectKickWebhook() {
    setKickBusy(true);
    setConnectStatus(null);
    const res = await fetch("/api/admin/giveaway", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "connect" }),
    });
    const data = await res.json();
    setConnectStatus(res.ok ? "Connected — Kick chat is now linked." : `Failed: ${data.message ?? data.error}`);
    setKickBusy(false);
  }

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

    if (finishTimer.current) clearTimeout(finishTimer.current);

    // The target offset only depends on fixed constants (WINNER_INDEX, STEP,
    // viewport width), so it's identical on every roll. Snapping back to 0
    // WITH the transition still enabled risks the browser coalescing "reset
    // to 0" and "move to target" into one no-op paint when target equals the
    // value already on screen — no transition ever starts, so the reel
    // never visibly spins on a repeat roll (and previously left the button
    // stuck on "Rolling…" forever, since it wasn't relying on this render
    // at all — see the timer below).
    //
    // Fix: disable the transition, snap to 0, force a synchronous reflow
    // (reading offsetWidth) to lock that in as the browser's real current
    // style, then re-enable the transition and move to the target. The
    // reflow makes this deterministic — no reliance on requestAnimationFrame
    // actually landing a real paint between the two writes.
    flushSync(() => {
      setWinner(null);
      setReel(strip);
      setRolling(true);
      setInstant(true);
      setOffset(0);
    });
    void viewportRef.current?.offsetWidth;

    const viewportWidth = viewportRef.current?.offsetWidth ?? 0;
    setInstant(false);
    setOffset(WINNER_INDEX * STEP + ITEM_WIDTH / 2 - viewportWidth / 2);

    // Drives the reveal on a fixed timer instead of the reel's
    // onTransitionEnd — deterministic regardless of whether the browser
    // actually ran a transition for this particular roll.
    finishTimer.current = setTimeout(() => {
      setRolling(false);
      setWinner(chosen);
      setRollId((id) => id + 1);
    }, ROLL_DURATION_MS + 150);
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
        Paste names by hand, or collect them live from Kick chat, then roll
        to spin the wheel and land on a random winner.
      </p>

      <div className="mt-6 flex w-fit gap-1 rounded-lg border border-white/10 bg-zinc-900/60 p-1">
        {(["manual", "kick"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setEntryMode(m)}
            className={`rounded-md px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
              entryMode === m ? "bg-emerald-400 text-black" : "text-white/50 hover:text-white"
            }`}
          >
            {m === "manual" ? "Manual" : "Kick Chat"}
          </button>
        ))}
      </div>

      {entryMode === "kick" ? (
        <div className="mt-4 w-full max-w-md rounded-xl border border-white/10 bg-zinc-900/40 p-4">
          {sessionActive ? (
            <>
              <p className="text-sm text-white/70">
                Listening for{" "}
                <span className="font-semibold text-emerald-300">{keyword}</span> in
                chat — <span className="font-semibold text-white">{liveEntries.length}</span>{" "}
                entered so far.
              </p>
              {liveEntries.length > 0 ? (
                <div className="mt-3 max-h-32 overflow-y-auto rounded-lg border border-white/5 bg-black/20 p-2">
                  <p className="flex flex-wrap gap-1.5">
                    {liveEntries.map((name) => (
                      <span
                        key={name}
                        className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-white/70"
                      >
                        {name}
                      </span>
                    ))}
                  </p>
                </div>
              ) : null}
              <button
                type="button"
                onClick={stopListening}
                disabled={kickBusy}
                className="mt-3 rounded-md border border-red-400/30 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-400/10 disabled:opacity-50"
              >
                Stop listening
              </button>
            </>
          ) : (
            <>
              <label className="text-xs text-white/40 uppercase tracking-wide">
                Keyword viewers type in chat
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="!giveaway"
                  className="w-32 rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white"
                />
                <button
                  type="button"
                  onClick={startListening}
                  disabled={kickBusy || !keyword.trim()}
                  className="rounded-md bg-emerald-400 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
                >
                  Start listening
                </button>
              </div>
              {liveEntries.length > 0 ? (
                <p className="mt-2 text-xs text-white/30">
                  {liveEntries.length} names from the last session are loaded into the
                  list below.
                </p>
              ) : null}
              <button
                type="button"
                onClick={connectKickWebhook}
                disabled={kickBusy}
                className="mt-3 block text-xs text-white/30 underline decoration-white/20 underline-offset-2 hover:text-white/60"
              >
                Connect Kick webhook (one-time setup)
              </button>
              {connectStatus ? (
                <p className="mt-1 text-xs text-white/50">{connectStatus}</p>
              ) : null}
            </>
          )}
        </div>
      ) : null}

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
            className="flex h-full items-center gap-2 px-2 transition-transform ease-out"
            style={{
              transform: `translateX(${-offset}px)`,
              transitionDuration: instant ? "0ms" : `${ROLL_DURATION_MS}ms`,
            }}
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
