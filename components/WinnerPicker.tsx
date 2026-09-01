"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Icon } from "@/components/Icon";
import { SocialIcon } from "@/components/SocialIcon";
import { useConfirm } from "@/components/ConfirmDialog";

const ITEM_WIDTH = 160; // px — must match the w-40 class on each reel card
const ITEM_GAP = 10; // px — matches gap-2.5
const STEP = ITEM_WIDTH + ITEM_GAP;
const REEL_LENGTH = 36;
const WINNER_INDEX = 28; // leaves a few cards after it so the strip doesn't look like it "ran out"
const ROLL_DURATION_MS = 4000;

const CONFETTI_COLORS = ["#34d399", "#ffffff", "#fbbf24"];
const CONFETTI_COUNT = 28;

// A Kick-sourced entrant who sent this many chat messages while the
// giveaway was live (not just their entry line) is flagged "Active" —
// a quick signal for whether a winner was genuinely engaged in chat.
const ACTIVE_MESSAGE_THRESHOLD = 3;

type Mode = "manual" | "kick";

interface Participant {
  username: string;
  avatarUrl: string | null;
  isSubscriber?: boolean;
  messageCount?: number;
}

interface Winner {
  username: string;
  avatarUrl: string | null;
  messageCount?: number;
}

interface GiveawayApiState {
  session: {
    active: boolean;
    keyword: string;
    winnerCount: number;
    subscribersOnly: boolean;
    started_at: string | null;
  };
  entries: Participant[];
  winners: Winner[];
}

// Real Kick avatar when we have one; a two-letter initials badge when we
// don't (manual entries never have one) or the image 404s.
function Avatar({
  username,
  avatarUrl,
  size = 32,
}: {
  username: string;
  avatarUrl: string | null;
  size?: number;
}) {
  const [errored, setErrored] = useState(false);
  if (avatarUrl && !errored) {
    return (
      <img
        src={avatarUrl}
        alt=""
        onError={() => setErrored(true)}
        style={{ width: size, height: size }}
        className="shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center rounded-full bg-emerald-400/10 text-xs font-bold text-emerald-300"
    >
      {username.slice(0, 2).toUpperCase()}
    </div>
  );
}

// Kick-mode only — manual entries have no message history to show.
function ActivityBadge({ messageCount }: { messageCount: number }) {
  const active = messageCount >= ACTIVE_MESSAGE_THRESHOLD;
  return (
    <span
      className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
        active ? "bg-emerald-400/10 text-emerald-300" : "bg-white/5 text-white/40"
      }`}
      title={`${messageCount} message${messageCount === 1 ? "" : "s"} sent`}
    >
      <Icon name="message" className="h-2.5 w-2.5" />
      {messageCount}
      {active ? <span className="ml-0.5">Active</span> : null}
    </span>
  );
}

export function WinnerPicker() {
  const confirm = useConfirm();
  const [mode, setMode] = useState<Mode>("manual");

  // Manual mode: typed names, no avatars, winners tracked only in this tab.
  const [manualNames, setManualNames] = useState<string[]>([]);
  const [draftName, setDraftName] = useState("");
  const [manualWinners, setManualWinners] = useState<Winner[]>([]);

  // Kick mode: settings + server-synced entries/winners.
  const [keyword, setKeyword] = useState("!giveaway");
  const [winnerCountInput, setWinnerCountInput] = useState("1");
  const [subscribersOnly, setSubscribersOnly] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [kickEntries, setKickEntries] = useState<Participant[]>([]);
  const [kickWinners, setKickWinners] = useState<Winner[]>([]);
  const [kickBusy, setKickBusy] = useState(false);
  const [connectWarning, setConnectWarning] = useState<string | null>(null);

  // Roll animation — mode-agnostic, drives off whatever draw() feeds it.
  const [rolling, setRolling] = useState(false);
  const [reel, setReel] = useState<string[] | null>(null);
  const [revealed, setRevealed] = useState<Winner[] | null>(null);
  const [offset, setOffset] = useState(0);
  const [instant, setInstant] = useState(false);
  const [rollId, setRollId] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const finishTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    // Only sync settings from the server while a session is actually
    // running — they're read-only in that state anyway. Otherwise this
    // poll (every 3s) would stomp on values the admin is mid-typing.
    if (data.session.active) {
      setKeyword(data.session.keyword);
      setWinnerCountInput(String(data.session.winnerCount));
      setSubscribersOnly(data.session.subscribersOnly);
    }
    setKickEntries(data.entries);
    setKickWinners(data.winners);
  }

  // Poll while the Kick tab is open so entries/winners update live as chat
  // messages come in (or another admin tab draws), without a manual refresh.
  useEffect(() => {
    if (mode !== "kick") return;
    refreshGiveawayState();
    const interval = setInterval(refreshGiveawayState, 3000);
    return () => clearInterval(interval);
  }, [mode]);

  const winnerCount = Math.max(1, parseInt(winnerCountInput, 10) || 1);
  const winners = mode === "kick" ? kickWinners : manualWinners;
  const wonUsernames = useMemo(() => new Set(winners.map((w) => w.username)), [winners]);

  const participants: Participant[] = useMemo(() => {
    if (mode === "kick") {
      return kickEntries.filter(
        (e) => !wonUsernames.has(e.username) && (!subscribersOnly || e.isSubscriber)
      );
    }
    return manualNames
      .filter((n) => !wonUsernames.has(n))
      .map((n) => ({ username: n, avatarUrl: null }));
  }, [mode, kickEntries, manualNames, wonUsernames, subscribersOnly]);

  // Auto-connects the Kick webhook on the server the first time this is
  // called (see the "start" action) — no separate setup step to click.
  async function startGiveaway() {
    if (!keyword.trim()) return;
    setKickBusy(true);
    setConnectWarning(null);
    const res = await fetch("/api/admin/giveaway", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "start",
        keyword: keyword.trim(),
        winnerCount,
        subscribersOnly,
      }),
    });
    const data = await res.json().catch(() => null);
    if (data?.connectWarning) setConnectWarning(data.connectWarning);
    await refreshGiveawayState();
    setKickBusy(false);
  }

  async function stopGiveaway() {
    setKickBusy(true);
    await fetch("/api/admin/giveaway", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "stop" }),
    });
    await refreshGiveawayState();
    setKickBusy(false);
  }

  async function resetAll() {
    if (!(await confirm("Reset everything? This clears participants and winners.", { danger: true }))) return;
    if (mode === "kick") {
      setKickBusy(true);
      await fetch("/api/admin/giveaway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      await refreshGiveawayState();
      setKickBusy(false);
    } else {
      setManualNames([]);
      setManualWinners([]);
    }
    setReel(null);
    setRevealed(null);
  }

  function addNames(raw: string) {
    const additions = raw
      .split("\n")
      .map((n) => n.trim())
      .filter(Boolean);
    if (additions.length === 0) return;
    setManualNames((names) => [...names, ...additions]);
  }

  function removeParticipant(username: string) {
    setManualNames((names) => names.filter((n) => n !== username));
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

  function closeRollOverlay() {
    setReel(null);
    setRevealed(null);
  }

  // Spins the reel landing on `landing`, then reveals the full `picked`
  // set at once — one dramatic spin per draw regardless of winner count,
  // since animating N sequential spins for N winners gets slow fast.
  function runReelAnimation(pool: string[], landing: string, picked: Winner[]) {
    const strip = Array.from({ length: REEL_LENGTH }, (_, i) =>
      i === WINNER_INDEX ? landing : pool[Math.floor(Math.random() * pool.length)]
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
      setRevealed(null);
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
      setRevealed(picked);
      setRollId((id) => id + 1);
    }, ROLL_DURATION_MS + 150);
  }

  async function draw() {
    if (rolling || participants.length === 0) return;

    if (mode === "kick") {
      setKickBusy(true);
      const res = await fetch("/api/admin/giveaway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "draw" }),
      });
      const data = await res.json().catch(() => null);
      setKickBusy(false);
      const picked: Winner[] = data?.winners ?? [];
      if (picked.length === 0) return;
      setKickWinners((w) => [...w, ...picked]);
      runReelAnimation(
        participants.map((p) => p.username),
        picked[0].username,
        picked
      );
    } else {
      const shuffled = [...participants].sort(() => Math.random() - 0.5);
      const picked = shuffled.slice(0, Math.min(winnerCount, shuffled.length)).map((p) => ({
        username: p.username,
        avatarUrl: null,
      }));
      if (picked.length === 0) return;
      setManualWinners((w) => [...w, ...picked]);
      runReelAnimation(
        participants.map((p) => p.username),
        picked[0].username,
        picked
      );
    }
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
      <p className="mt-3 max-w-lg text-sm text-white/60">
        Add names by hand, or collect them live from Kick chat, then draw one
        or more winners at once.
      </p>

      {/* Mode tabs */}
      <div className="mt-6 flex w-fit gap-1 rounded-xl border border-white/10 bg-zinc-900/60 p-1">
        <button
          type="button"
          onClick={() => setMode("manual")}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wide transition-all ${
            mode === "manual"
              ? "bg-emerald-400 text-black shadow-[0_0_16px_rgba(52,211,153,0.35)]"
              : "text-white/50 hover:text-white"
          }`}
        >
          <Icon name="list" className="h-3.5 w-3.5" />
          Manual
        </button>
        <button
          type="button"
          onClick={() => setMode("kick")}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wide transition-all ${
            mode === "kick"
              ? "bg-emerald-400 text-black shadow-[0_0_16px_rgba(52,211,153,0.35)]"
              : "text-white/50 hover:text-white"
          }`}
        >
          <SocialIcon platform="kick" className="h-3.5 w-3.5" />
          Kick Chat
        </button>
      </div>

      {/* Settings | Participants | Winners */}
      <div className="mt-4 grid gap-5 lg:grid-cols-3">
        {/* Settings */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/40">
          <div className="flex items-center gap-2 border-b border-white/5 px-5 py-4">
            <Icon name="bolt" className="h-4 w-4 text-white/50" />
            <span className="text-xs font-bold tracking-wide text-white/70 uppercase">
              Settings
            </span>
            {mode === "kick" && sessionActive ? (
              <span className="ml-auto flex items-center gap-1.5 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-red-400 uppercase">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
                </span>
                Live
              </span>
            ) : null}
          </div>

          <div className="space-y-4 p-5">
            {mode === "kick" ? (
              <>
                <div>
                  <label className="text-[10px] font-semibold tracking-wide text-white/40 uppercase">
                    Keyword
                  </label>
                  <input
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    disabled={sessionActive}
                    placeholder="!giveaway"
                    className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-emerald-400/40 focus:outline-none disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold tracking-wide text-white/40 uppercase">
                    Number of winners
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={winnerCountInput}
                    onChange={(e) => setWinnerCountInput(e.target.value)}
                    disabled={sessionActive}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-emerald-400/40 focus:outline-none disabled:opacity-50"
                  />
                </div>
                <label className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2.5 text-sm text-white/70">
                  Subscribers only
                  <input
                    type="checkbox"
                    checked={subscribersOnly}
                    onChange={(e) => setSubscribersOnly(e.target.checked)}
                    disabled={sessionActive}
                    className="h-4 w-4 accent-emerald-400 disabled:opacity-50"
                  />
                </label>

                {connectWarning ? (
                  <p className="text-xs text-amber-400/80">
                    Kick connection issue: {connectWarning}
                  </p>
                ) : null}

                {sessionActive ? (
                  <button
                    type="button"
                    onClick={stopGiveaway}
                    disabled={kickBusy}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-400/30 px-3 py-2.5 text-xs font-bold text-red-300 hover:bg-red-400/10 disabled:opacity-50"
                  >
                    <Icon name="stop" className="h-3 w-3" />
                    Stop Giveaway
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startGiveaway}
                    disabled={kickBusy || !keyword.trim()}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-400 px-3 py-2.5 text-xs font-bold text-black transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                  >
                    <Icon name="bolt" className="h-3.5 w-3.5" />
                    Start Giveaway
                  </button>
                )}
                <p className="text-xs text-white/40">
                  Viewers type{" "}
                  <span className="font-semibold text-white/70">{keyword}</span>{" "}
                  in chat to join.
                </p>
              </>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addNames(draftName);
                  setDraftName("");
                }}
                className="space-y-3"
              >
                <div>
                  <label className="text-[10px] font-semibold tracking-wide text-white/40 uppercase">
                    Number of winners
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={winnerCountInput}
                    onChange={(e) => setWinnerCountInput(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-emerald-400/40 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold tracking-wide text-white/40 uppercase">
                    Add a name
                  </label>
                  <div className="mt-1 flex gap-2">
                    <input
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      onPaste={(e) => {
                        const pasted = e.clipboardData.getData("text");
                        if (pasted.includes("\n")) {
                          e.preventDefault();
                          addNames(pasted);
                          setDraftName("");
                        }
                      }}
                      placeholder="Type or paste a list"
                      className="min-w-0 flex-1 rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:border-emerald-400/40 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!draftName.trim()}
                      className="shrink-0 rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-white/60 hover:border-emerald-400/30 hover:text-emerald-300 disabled:opacity-30"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Participants */}
        <div className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/40">
          <div className="flex items-center gap-2 border-b border-white/5 px-5 py-4">
            <Icon name="users" className="h-4 w-4 text-white/50" />
            <span className="text-xs font-bold tracking-wide text-white/70 uppercase">
              Participants
            </span>
            <span className="ml-auto rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-bold text-white/50">
              {participants.length}
            </span>
          </div>
          <div className="max-h-[28rem] flex-1 space-y-2 overflow-y-auto p-4">
            {participants.length === 0 ? (
              <p className="p-2 text-sm text-white/30">
                {mode === "kick"
                  ? "Waiting for entries…"
                  : "No participants yet — add names on the left."}
              </p>
            ) : (
              participants.map((p) => (
                <div
                  key={p.username}
                  className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-2.5"
                >
                  <Avatar username={p.username} avatarUrl={p.avatarUrl} size={32} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-white">
                    {p.username}
                  </span>
                  {mode === "kick" ? (
                    <ActivityBadge messageCount={p.messageCount ?? 0} />
                  ) : null}
                  {mode === "manual" ? (
                    <button
                      type="button"
                      onClick={() => removeParticipant(p.username)}
                      aria-label={`Remove ${p.username}`}
                      className="shrink-0 rounded-full p-1 text-white/30 hover:bg-red-400/10 hover:text-red-300"
                    >
                      <Icon name="close" className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Winners */}
        <div className="flex flex-col overflow-hidden rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-400/[0.05] to-transparent">
          <div className="flex items-center gap-2 border-b border-white/5 px-5 py-4">
            <Icon name="trophy" className="h-4 w-4 text-emerald-300" />
            <span className="text-xs font-bold tracking-wide text-white/70 uppercase">
              Winners
            </span>
            <span className="ml-auto rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
              {winners.length}
            </span>
          </div>
          <div className="max-h-[28rem] flex-1 space-y-2 overflow-y-auto p-4">
            {winners.length === 0 ? (
              <p className="p-2 text-sm text-white/30">
                Nobody drawn yet — click Draw Winner below.
              </p>
            ) : (
              winners.map((w, i) => (
                <div
                  key={`${w.username}-${i}`}
                  className="flex items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-3.5 py-2.5"
                >
                  <Avatar username={w.username} avatarUrl={w.avatarUrl} size={32} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-white">
                    {w.username}
                  </span>
                  {mode === "kick" ? (
                    <ActivityBadge messageCount={w.messageCount ?? 0} />
                  ) : null}
                  <Icon name="crown" className="h-4 w-4 shrink-0 text-emerald-300" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={draw}
          disabled={rolling || participants.length === 0 || (mode === "kick" && kickBusy)}
          className="flex items-center gap-2 rounded-xl bg-emerald-400 px-7 py-3.5 text-sm font-bold text-black shadow-[0_0_24px_rgba(52,211,153,0.3)] transition-transform hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
        >
          <Icon name="dice" className={`h-4 w-4 ${rolling ? "animate-spin" : ""}`} />
          {rolling ? "Rolling…" : `Draw ${winnerCount > 1 ? `${winnerCount} Winners` : "Winner"}`}
        </button>
        <button
          type="button"
          onClick={resetAll}
          disabled={rolling}
          className="rounded-xl border border-red-400/30 px-5 py-3.5 text-sm font-bold text-red-300 hover:bg-red-400/10 disabled:opacity-40"
        >
          Reset
        </button>
      </div>

      {/* Centered overlay so the winner is always visible on screen the
          instant it lands — no scrolling down the page to find it. */}
      {reel ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeRollOverlay();
          }}
        >
          <div className="relative w-full max-w-2xl">
            <button
              type="button"
              onClick={closeRollOverlay}
              aria-label="Close"
              className="absolute -top-11 right-0 rounded-full border border-white/10 p-2 text-white/40 hover:border-white/30 hover:text-white"
            >
              <Icon name="close" className="h-4 w-4" />
            </button>

            <div
              ref={viewportRef}
              className="relative h-32 overflow-hidden rounded-2xl border border-emerald-400/30 bg-zinc-900/80 shadow-[0_0_40px_rgba(52,211,153,0.15)]"
            >
              <div className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-0.5 -translate-x-1/2 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-full bg-gradient-to-r from-zinc-950 via-transparent to-zinc-950" />
              <div
                className="flex h-full items-center gap-2.5 px-2 transition-transform ease-out"
                style={{
                  transform: `translateX(${-offset}px)`,
                  transitionDuration: instant ? "0ms" : `${ROLL_DURATION_MS}ms`,
                }}
              >
                {reel.map((name, i) => (
                  <div
                    key={i}
                    style={{ width: ITEM_WIDTH }}
                    className={`flex h-24 shrink-0 items-center justify-center rounded-xl border px-3 text-center text-base font-semibold ${
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

            {revealed ? (
              <div className="animate-glow-pulse relative mt-6 overflow-hidden rounded-2xl border border-emerald-400/50 bg-gradient-to-b from-emerald-400/10 to-emerald-400/5 p-8 text-center">
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
                  <Icon name="crown" className="h-10 w-10 text-emerald-300" />
                </span>
                <p className="mt-1 flex items-center justify-center gap-1.5 text-xs tracking-[0.3em] text-emerald-400/60 uppercase">
                  <Icon name="trophy" className="h-4 w-4" />
                  {revealed.length > 1 ? "Winners" : "Winner"}
                </p>
                <div className="relative z-10 mt-4 space-y-3">
                  {revealed.map((w) => (
                    <div
                      key={w.username}
                      className="flex items-center justify-center gap-3"
                    >
                      <Avatar username={w.username} avatarUrl={w.avatarUrl} size={40} />
                      <span className="font-display animate-winner-pop text-3xl uppercase text-white sm:text-4xl">
                        {w.username}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
