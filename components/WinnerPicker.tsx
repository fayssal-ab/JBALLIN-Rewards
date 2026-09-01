"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Icon } from "@/components/Icon";
import { SocialIcon } from "@/components/SocialIcon";
import { useConfirm } from "@/components/ConfirmDialog";
import { ACTIVE_MESSAGE_THRESHOLD } from "@/lib/giveawayConstants";
import { rollSound } from "@/lib/rollSound";

const ITEM_WIDTH = 160; // px — must match the w-40 class on each reel card
const ITEM_GAP = 10; // px — matches gap-2.5
const STEP = ITEM_WIDTH + ITEM_GAP;
const REEL_LENGTH = 36;
const WINNER_INDEX = 28; // leaves a few cards after it so the strip doesn't look like it "ran out"
const ROLL_DURATION_MS = 4000;
const WHEEL_DURATION_MS = 4500;
const WHEEL_EXTRA_SPINS = 6;
const WHEEL_COLORS = ["#10b981", "#065f46", "#34d399", "#047857", "#0d9488", "#059669"];

const CONFETTI_COLORS = ["#34d399", "#ffffff", "#fbbf24"];
const CONFETTI_COUNT = 28;

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
  // Kick mode only: false means this pick didn't clear the activity
  // threshold and was NOT recorded as a winner server-side — it's shown so
  // the admin can see who it landed on, with a Reroll option. Always true
  // for manual/wheel picks, which have no activity concept.
  qualifiesActive?: boolean;
}

// One reel strip per winner being drawn — only the landing card (index
// WINNER_INDEX) carries a real avatar; filler cards stay text-only so a
// 5-winner draw doesn't fire off 150+ avatar image requests at once.
interface ReelItem {
  username: string;
  avatarUrl: string | null;
}

interface GiveawayApiState {
  session: {
    active: boolean;
    keyword: string;
    winnerCount: number;
    subscribersOnly: boolean;
    activeOnly: boolean;
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

// The wheel always draws exactly one winner per spin (remove-after-spin,
// like wheelofnames.com) — a "number of winners" input doesn't map onto a
// wheel the way it does onto parallel reels, so it's just not offered here;
// spin again for more.
function NamesWheel({
  names,
  rotation,
  spinning,
}: {
  names: string[];
  rotation: number;
  spinning: boolean;
}) {
  const n = names.length;
  const wedgeAngle = n > 0 ? 360 / n : 360;
  const gradient =
    n > 0
      ? names
          .map((_, i) => `${WHEEL_COLORS[i % WHEEL_COLORS.length]} ${i * wedgeAngle}deg ${(i + 1) * wedgeAngle}deg`)
          .join(", ")
      : "#18181b";

  return (
    <div className="relative mx-auto aspect-square w-full max-w-sm">
      <div className="absolute -top-2 left-1/2 z-20 -translate-x-1/2">
        <div className="h-0 w-0 border-x-[14px] border-t-[24px] border-x-transparent border-t-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
      </div>
      <div
        className="relative h-full w-full overflow-hidden rounded-full border-4 border-emerald-400/50 shadow-[0_0_60px_rgba(52,211,153,0.35)]"
        style={{
          background: `conic-gradient(${gradient})`,
          transform: `rotate(${rotation}deg)`,
          transition: spinning
            ? `transform ${WHEEL_DURATION_MS}ms cubic-bezier(0.15,0.85,0.25,1)`
            : "none",
        }}
      >
        {names.map((name, i) => (
          <div key={i} className="absolute inset-0" style={{ transform: `rotate(${i * wedgeAngle + wedgeAngle / 2}deg)` }}>
            <span
              className="absolute top-[9%] left-1/2 max-w-[38%] -translate-x-1/2 truncate text-xs font-bold text-white sm:text-sm"
              style={{ textShadow: "0 1px 2px rgba(0,0,0,0.9), 0 0 6px rgba(0,0,0,0.6)" }}
            >
              {name}
            </span>
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-emerald-400/60 bg-zinc-950 shadow-[0_0_20px_rgba(52,211,153,0.5)]">
          <Icon name="dice" className={`h-6 w-6 text-emerald-300 ${spinning ? "animate-spin" : ""}`} />
        </div>
      </div>
    </div>
  );
}

export function WinnerPicker() {
  const confirm = useConfirm();
  const [mode, setMode] = useState<Mode>("manual");

  // Manual mode: typed names, no avatars, winners tracked only in this tab.
  const [manualNames, setManualNames] = useState<string[]>([]);
  const [draftName, setDraftName] = useState("");
  const [manualWinners, setManualWinners] = useState<Winner[]>([]);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [wheelSpinning, setWheelSpinning] = useState(false);
  const wheelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Kick mode: settings + server-synced entries/winners.
  const [keyword, setKeyword] = useState("jballin");
  const [winnerCountInput, setWinnerCountInput] = useState("1");
  const [subscribersOnly, setSubscribersOnly] = useState(false);
  const [activeOnly, setActiveOnly] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [kickEntries, setKickEntries] = useState<Participant[]>([]);
  const [kickWinners, setKickWinners] = useState<Winner[]>([]);
  const [kickBusy, setKickBusy] = useState(false);
  const [connectWarning, setConnectWarning] = useState<string | null>(null);

  // Reel animation (Kick mode) — one strip per winner being drawn, all
  // spinning together (see ReelItem above).
  const [rolling, setRolling] = useState(false);
  const [reels, setReels] = useState<ReelItem[][] | null>(null);
  const [revealed, setRevealed] = useState<Winner[] | null>(null);
  const [offset, setOffset] = useState(0);
  const [instant, setInstant] = useState(false);
  const [rollId, setRollId] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const finishTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelTicksRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      if (finishTimer.current) clearTimeout(finishTimer.current);
      if (wheelTimer.current) clearTimeout(wheelTimer.current);
      cancelTicksRef.current?.();
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
      setActiveOnly(data.session.activeOnly);
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

  // "Active only" is NOT a pool filter — everyone shows here normally and
  // stays eligible to be drawn. It only decides, after a draw, whether the
  // pick actually gets confirmed as a winner (see draw()/qualifiesActive).
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
        activeOnly,
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
    if (finishTimer.current) clearTimeout(finishTimer.current);
    if (wheelTimer.current) clearTimeout(wheelTimer.current);
    cancelTicksRef.current?.();
    setReels(null);
    setWheelSpinning(false);
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
    if (finishTimer.current) clearTimeout(finishTimer.current);
    if (wheelTimer.current) clearTimeout(wheelTimer.current);
    cancelTicksRef.current?.();
    setReels(null);
    setWheelSpinning(false);
    setRevealed(null);
  }

  function buildStrip(pool: Participant[], landing: Winner): ReelItem[] {
    return Array.from({ length: REEL_LENGTH }, (_, i) => {
      if (i === WINNER_INDEX) return { username: landing.username, avatarUrl: landing.avatarUrl };
      const p = pool[Math.floor(Math.random() * pool.length)];
      return { username: p.username, avatarUrl: null };
    });
  }

  // One reel per winner, all spinning at once — a 5-winner draw shows 5
  // reels landing together, not one reel followed by a text dump. Every
  // reel shares the same offset/instant/rolling state since they're all
  // the same width and run on the same timer; only their strip contents
  // differ (see buildStrip).
  function runReelAnimation(pool: Participant[], picked: Winner[]) {
    const strips = picked.map((w) => buildStrip(pool, w));

    if (finishTimer.current) clearTimeout(finishTimer.current);
    cancelTicksRef.current?.();
    cancelTicksRef.current = rollSound.scheduleTicks(ROLL_DURATION_MS);

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
      setReels(strips);
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
      rollSound.winChime();
    }, ROLL_DURATION_MS + 150);
  }

  // overrideCount is set by the Reroll button to replace just the picks
  // that failed the activity check, instead of a fresh full-size draw.
  async function draw(overrideCount?: number) {
    if (rolling || participants.length === 0) return;

    if (mode === "kick") {
      setKickBusy(true);
      const res = await fetch("/api/admin/giveaway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          overrideCount ? { action: "draw", count: overrideCount } : { action: "draw" }
        ),
      });
      const data = await res.json().catch(() => null);
      setKickBusy(false);
      const picked: Winner[] = data?.winners ?? [];
      if (picked.length === 0) return;
      // Only picks that cleared the activity check were actually persisted
      // server-side — mirror that here so the Winners panel matches the DB.
      setKickWinners((w) => [...w, ...picked.filter((p) => p.qualifiesActive !== false)]);
      runReelAnimation(participants, picked);
    } else {
      spinWheel();
    }
  }

  // Landing math: wedge i's center starts at i*wedgeAngle + wedgeAngle/2
  // (measured clockwise from the top pointer). Rotating the wheel by R
  // clockwise moves that point to (center + R) mod 360, so R must satisfy
  // (center + R) ≡ 0 (mod 360). Rotation only ever increases (never resets
  // to 0), so the CSS transition always has real distance to cover — no
  // flushSync/reflow trick needed like the reel's repeat-roll fix.
  function spinWheel() {
    if (wheelSpinning || participants.length === 0) return;
    const index = Math.floor(Math.random() * participants.length);
    const winner = participants[index];
    const wedgeAngle = 360 / participants.length;
    const jitter = (Math.random() - 0.5) * wedgeAngle * 0.6;
    const center = index * wedgeAngle + wedgeAngle / 2 + jitter;
    const targetMod = (((360 - center) % 360) + 360) % 360;
    const currentMod = ((wheelRotation % 360) + 360) % 360;
    let delta = targetMod - currentMod;
    if (delta <= 0) delta += 360;

    if (wheelTimer.current) clearTimeout(wheelTimer.current);
    cancelTicksRef.current?.();
    cancelTicksRef.current = rollSound.scheduleTicks(WHEEL_DURATION_MS);

    const picked: Winner = { username: winner.username, avatarUrl: null, qualifiesActive: true };
    setRevealed(null);
    setWheelSpinning(true);
    setWheelRotation((r) => r + WHEEL_EXTRA_SPINS * 360 + delta);
    setManualWinners((w) => [...w, picked]);

    wheelTimer.current = setTimeout(() => {
      setWheelSpinning(false);
      setRevealed([picked]);
      setRollId((id) => id + 1);
      rollSound.winChime();
    }, WHEEL_DURATION_MS + 100);
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/40 bg-gradient-to-br from-emerald-400/20 to-emerald-400/5 shadow-[0_0_30px_rgba(52,211,153,0.25)]">
          <div className="animate-glow-pulse absolute inset-0 rounded-2xl" />
          <Icon name="dice" className="h-7 w-7 text-emerald-300" />
        </div>
        <div>
          <p className="flex items-center gap-1.5 text-xs font-bold tracking-[0.3em] text-emerald-400/70 uppercase">
            <Icon name="bolt" className="h-3 w-3" />
            Giveaway
          </p>
          <h1 className="animate-shimmer-text font-display bg-gradient-to-r from-white via-emerald-200 to-white bg-clip-text text-4xl text-transparent uppercase sm:text-5xl">
            Winner Roller
          </h1>
        </div>
      </div>

      {/* Mode tabs */}
      <div className="mt-6 flex w-fit gap-1.5 rounded-xl border border-white/10 bg-zinc-900/60 p-1.5">
        <button
          type="button"
          onClick={() => setMode("manual")}
          className={`flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-xs font-bold uppercase tracking-wide transition-all ${
            mode === "manual"
              ? "scale-105 bg-gradient-to-b from-emerald-300 to-emerald-500 text-black shadow-[0_0_20px_rgba(52,211,153,0.45)]"
              : "text-white/50 hover:text-white"
          }`}
        >
          <Icon name="target" className="h-3.5 w-3.5" />
          Wheel
        </button>
        <button
          type="button"
          onClick={() => setMode("kick")}
          className={`flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-xs font-bold uppercase tracking-wide transition-all ${
            mode === "kick"
              ? "scale-105 bg-gradient-to-b from-emerald-300 to-emerald-500 text-black shadow-[0_0_20px_rgba(52,211,153,0.45)]"
              : "text-white/50 hover:text-white"
          }`}
        >
          <SocialIcon platform="kick" className="h-3.5 w-3.5" />
          Kick Chat
        </button>
      </div>

      {/* Settings | Participants | Winners */}
      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        {/* Settings */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900/60 to-zinc-900/20 shadow-[0_0_25px_rgba(0,0,0,0.3)]">
          <div className="flex items-center gap-2 border-b border-white/5 bg-white/[0.02] px-5 py-4">
            <Icon name="bolt" className="h-4 w-4 text-emerald-300" />
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
                    placeholder="jballin"
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
                <label className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2.5 text-sm text-white/70">
                  <span className="flex items-center gap-1.5">
                    Active only
                    <span
                      title={`Only entrants with ${ACTIVE_MESSAGE_THRESHOLD}+ chat messages during this giveaway are eligible.`}
                      className="cursor-help text-white/30"
                    >
                      <Icon name="message" className="h-3 w-3" />
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={activeOnly}
                    onChange={(e) => setActiveOnly(e.target.checked)}
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
                <p className="text-xs text-white/40">
                  Each spin draws one winner and removes them from the wheel — spin again for
                  more.
                </p>
              </form>
            )}
          </div>
        </div>

        {/* Participants */}
        <div className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900/60 to-zinc-900/20 shadow-[0_0_25px_rgba(0,0,0,0.3)]">
          <div className="flex items-center gap-2 border-b border-white/5 bg-white/[0.02] px-5 py-4">
            <Icon name="users" className="h-4 w-4 text-emerald-300" />
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
        <div className="animate-glow-pulse flex flex-col overflow-hidden rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-400/10 to-transparent shadow-[0_0_25px_rgba(52,211,153,0.1)]">
          <div className="flex items-center gap-2 border-b border-white/5 bg-white/[0.02] px-5 py-4">
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
                Nobody drawn yet — click {mode === "kick" ? "Draw Winner" : "Spin"} below.
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

      {mode === "manual" ? (
        <div className="mt-6 max-w-sm">
          <NamesWheel
            names={participants.map((p) => p.username)}
            rotation={wheelRotation}
            spinning={wheelSpinning}
          />
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() => draw()}
          disabled={rolling || wheelSpinning || participants.length === 0 || (mode === "kick" && kickBusy)}
          className="group relative flex items-center gap-2.5 rounded-2xl bg-gradient-to-b from-emerald-300 to-emerald-500 px-9 py-4 text-base font-bold text-black shadow-[0_0_35px_rgba(52,211,153,0.4)] transition-transform hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
        >
          <span className="absolute inset-0 -z-10 rounded-2xl bg-emerald-400 opacity-0 blur-xl transition-opacity group-hover:opacity-60" />
          <Icon
            name="dice"
            className={`h-5 w-5 ${rolling || wheelSpinning ? "animate-spin" : ""}`}
          />
          {mode === "kick"
            ? rolling
              ? "Rolling…"
              : `Draw ${winnerCount > 1 ? `${winnerCount} Winners` : "Winner"}`
            : wheelSpinning
              ? "Spinning…"
              : "Spin the Wheel"}
        </button>
        <button
          type="button"
          onClick={resetAll}
          disabled={rolling || wheelSpinning}
          className="rounded-xl border border-red-400/30 px-5 py-3.5 text-sm font-bold text-red-300 hover:bg-red-400/10 disabled:opacity-40"
        >
          Reset
        </button>
      </div>

      {/* Centered on screen so it's the obvious focal point when it fires —
          but NO backdrop dim/blur behind it. Everything else on the page
          stays fully visible; only this panel pops, on its own glow. Kick
          mode shows the reel(s); manual mode's wheel already renders inline
          above, so this only needs to carry the reveal card for that case. */}
      {reels || (mode === "manual" && revealed) ? (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="pointer-events-auto relative w-full max-w-2xl">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold tracking-[0.3em] text-emerald-300 uppercase">
                <Icon name="dice" className={`h-3.5 w-3.5 ${rolling ? "animate-spin" : ""}`} />
                {rolling ? "Rolling…" : "Roll Result"}
              </span>
              <button
                type="button"
                onClick={closeRollOverlay}
                aria-label="Close"
                className="rounded-full border border-white/10 bg-zinc-950 p-1.5 text-white/40 hover:border-white/30 hover:text-white"
              >
                <Icon name="close" className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* One reel per winner — all spin together. Scrolls internally
                once there are enough winners to overflow the viewport. */}
            {reels ? (
              <div
                className={`space-y-3 ${reels.length > 1 ? "max-h-[65vh] overflow-y-auto pr-1" : ""}`}
              >
                {reels.map((strip, reelIndex) => (
                  <div key={reelIndex} className="relative">
                    {reels.length > 1 ? (
                      <p className="mb-1.5 text-[10px] font-bold tracking-[0.3em] text-emerald-400/50 uppercase">
                        Winner {reelIndex + 1}
                      </p>
                    ) : null}
                    <div
                      ref={reelIndex === 0 ? viewportRef : undefined}
                      className={`relative ${reels.length > 1 ? "h-20" : "h-36"} overflow-hidden rounded-2xl border-2 border-emerald-400/50 bg-zinc-950 shadow-[0_0_50px_rgba(52,211,153,0.35)]`}
                    >
                      <div className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-1 -translate-x-1/2 bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,1)]" />
                      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-full bg-gradient-to-r from-zinc-950 via-transparent to-zinc-950" />
                      <div
                        className="flex h-full items-center gap-2.5 px-2 transition-transform ease-out"
                        style={{
                          transform: `translateX(${-offset}px)`,
                          transitionDuration: instant ? "0ms" : `${ROLL_DURATION_MS}ms`,
                        }}
                      >
                        {strip.map((item, i) => (
                          <div
                            key={i}
                            style={{ width: ITEM_WIDTH }}
                            className={`flex ${reels.length > 1 ? "h-14" : "h-24"} shrink-0 items-center justify-center gap-2 rounded-xl border px-3 text-center ${reels.length > 1 ? "text-sm" : "text-base"} font-semibold ${
                              !rolling && i === WINNER_INDEX
                                ? revealed?.[reelIndex]?.qualifiesActive === false
                                  ? "border-amber-400/60 bg-amber-400/10 text-amber-300"
                                  : "border-emerald-400/60 bg-emerald-400/10 text-emerald-300"
                                : "border-white/10 bg-zinc-900/70 text-white/70"
                            }`}
                          >
                            {i === WINNER_INDEX ? (
                              <Avatar
                                username={item.username}
                                avatarUrl={item.avatarUrl}
                                size={reels.length > 1 ? 22 : 30}
                              />
                            ) : null}
                            <span className="truncate">{item.username}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {revealed ? (
              <div className="animate-glow-pulse relative mt-6 overflow-hidden rounded-2xl border-2 border-emerald-400/60 bg-gradient-to-b from-zinc-950 via-emerald-400/10 to-zinc-950 p-8 text-center shadow-[0_0_60px_rgba(52,211,153,0.35)]">
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
                    <div key={w.username} className="flex flex-col items-center gap-1">
                      <div className="flex items-center justify-center gap-3">
                        <Avatar username={w.username} avatarUrl={w.avatarUrl} size={40} />
                        <span
                          className={`font-display animate-winner-pop text-3xl uppercase sm:text-4xl ${
                            w.qualifiesActive === false ? "text-white/40" : "text-white"
                          }`}
                        >
                          {w.username}
                        </span>
                      </div>
                      {w.qualifiesActive === false ? (
                        <p className="flex items-center gap-1 text-xs font-semibold text-amber-400">
                          <Icon name="message" className="h-3 w-3" />
                          Not active enough in chat — needs a reroll
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>

                {revealed.some((w) => w.qualifiesActive === false) ? (
                  <button
                    type="button"
                    onClick={() =>
                      draw(revealed.filter((w) => w.qualifiesActive === false).length)
                    }
                    disabled={rolling || (mode === "kick" && kickBusy)}
                    className="relative z-10 mx-auto mt-5 flex items-center justify-center gap-1.5 rounded-lg border border-amber-400/40 px-4 py-2 text-xs font-bold text-amber-300 hover:bg-amber-400/10 disabled:opacity-40"
                  >
                    <Icon name="dice" className="h-3.5 w-3.5" />
                    Reroll {revealed.filter((w) => w.qualifiesActive === false).length} Inactive
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
