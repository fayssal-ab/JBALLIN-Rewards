"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Icon } from "@/components/Icon";
import { SocialIcon } from "@/components/SocialIcon";

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
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-400/10">
          <Icon name="dice" className="h-5 w-5 text-emerald-300" />
        </div>
        <div>
          <p className="text-xs tracking-[0.3em] text-white/40 uppercase">
            Giveaway
          </p>
          <h1 className="font-display text-3xl uppercase text-white sm:text-4xl">
            Winner Roller
          </h1>
        </div>
      </div>
      <p className="mt-3 max-w-md text-sm text-white/60">
        Paste names by hand, or collect them live from Kick chat, then roll
        to spin the wheel and land on a random winner.
      </p>

      {/* Mode tabs */}
      <div className="mt-6 flex w-fit gap-1 rounded-xl border border-white/10 bg-zinc-900/60 p-1">
        <button
          type="button"
          onClick={() => setEntryMode("manual")}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wide transition-all ${
            entryMode === "manual"
              ? "bg-emerald-400 text-black shadow-[0_0_16px_rgba(52,211,153,0.35)]"
              : "text-white/50 hover:text-white"
          }`}
        >
          <Icon name="list" className="h-3.5 w-3.5" />
          Manual
        </button>
        <button
          type="button"
          onClick={() => setEntryMode("kick")}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wide transition-all ${
            entryMode === "kick"
              ? "bg-emerald-400 text-black shadow-[0_0_16px_rgba(52,211,153,0.35)]"
              : "text-white/50 hover:text-white"
          }`}
        >
          <SocialIcon platform="kick" className="h-3.5 w-3.5" />
          Kick Chat
        </button>
      </div>

      {entryMode === "kick" ? (
        <div className="mt-4 w-full max-w-md overflow-hidden rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-400/[0.07] to-transparent">
          <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
            <SocialIcon platform="kick" className="h-4 w-4 text-emerald-300" />
            <span className="text-xs font-bold tracking-wide text-white/70 uppercase">
              Kick Chat Entry
            </span>
            {sessionActive ? (
              <span className="ml-auto flex items-center gap-1.5 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-red-400 uppercase">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
                </span>
                Live
              </span>
            ) : null}
          </div>

          <div className="p-4">
            {sessionActive ? (
              <>
                <p className="flex items-center gap-2 text-sm text-white/70">
                  <Icon name="users" className="h-4 w-4 shrink-0 text-emerald-300" />
                  <span>
                    <span className="font-display text-lg text-emerald-300">
                      {liveEntries.length}
                    </span>{" "}
                    entered — type{" "}
                    <span className="font-semibold text-white">{keyword}</span> in
                    chat to join
                  </span>
                </p>
                {liveEntries.length > 0 ? (
                  <div className="mt-3 max-h-32 overflow-y-auto rounded-lg border border-white/5 bg-black/20 p-2">
                    <p className="flex flex-wrap gap-1.5">
                      {liveEntries.map((name) => (
                        <span
                          key={name}
                          className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs font-medium text-white/70"
                        >
                          {name}
                        </span>
                      ))}
                    </p>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-white/30">
                    Waiting for the first entry…
                  </p>
                )}
                <button
                  type="button"
                  onClick={stopListening}
                  disabled={kickBusy}
                  className="mt-4 flex items-center gap-1.5 rounded-lg border border-red-400/30 px-3 py-1.5 text-xs font-bold text-red-300 hover:bg-red-400/10 disabled:opacity-50"
                >
                  <Icon name="stop" className="h-3 w-3" />
                  Stop listening
                </button>
              </>
            ) : (
              <>
                <label className="text-xs font-semibold tracking-wide text-white/40 uppercase">
                  Keyword viewers type in chat
                </label>
                <div className="mt-2 flex gap-2">
                  <input
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="!giveaway"
                    className="w-32 rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-emerald-400/40 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={startListening}
                    disabled={kickBusy || !keyword.trim()}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-400 px-4 py-2 text-sm font-bold text-black transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                  >
                    <Icon name="bolt" className="h-3.5 w-3.5" />
                    Start listening
                  </button>
                </div>
                {liveEntries.length > 0 ? (
                  <p className="mt-2 text-xs text-white/30">
                    {liveEntries.length} names from the last session are loaded
                    into the list below.
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
        </div>
      ) : null}

      {/* Entry list */}
      <div className="mt-4 w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/40">
        <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
          <Icon name="list" className="h-4 w-4 text-white/50" />
          <span className="text-xs font-bold tracking-wide text-white/70 uppercase">
            Entry List
          </span>
          <span className="ml-auto flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-bold text-white/50">
            <Icon name="users" className="h-3 w-3" />
            {entries.length}
          </span>
        </div>
        <textarea
          value={namesText}
          onChange={(e) => setNamesText(e.target.value)}
          placeholder={"player1\nplayer2\nplayer3"}
          rows={7}
          className="w-full bg-transparent p-4 text-sm text-white placeholder:text-white/20 focus:outline-none"
        />
      </div>

      <button
        type="button"
        onClick={roll}
        disabled={entries.length < 2 || rolling}
        className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-400 px-7 py-3.5 text-sm font-bold text-black shadow-[0_0_24px_rgba(52,211,153,0.3)] transition-transform hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
      >
        <Icon name="dice" className={`h-4 w-4 ${rolling ? "animate-spin" : ""}`} />
        {rolling ? "Rolling…" : "Roll winner"}
      </button>

      {reel ? (
        <div
          ref={viewportRef}
          className="relative mx-auto mt-10 h-24 max-w-md overflow-hidden rounded-2xl border border-emerald-400/30 bg-zinc-900/50 shadow-[0_0_30px_rgba(52,211,153,0.1)]"
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
        <div className="animate-glow-pulse relative mx-auto mt-6 max-w-md overflow-hidden rounded-2xl border border-emerald-400/50 bg-gradient-to-b from-emerald-400/10 to-emerald-400/5 p-6 text-center">
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
          <span className="animate-crown-bounce inline-block">
            <Icon name="crown" className="h-8 w-8 text-emerald-300" />
          </span>
          <p className="mt-1 flex items-center justify-center gap-1.5 text-[10px] tracking-[0.3em] text-emerald-400/60 uppercase">
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
