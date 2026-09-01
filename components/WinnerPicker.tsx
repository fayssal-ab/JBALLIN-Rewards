"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Icon } from "@/components/Icon";
import { SocialIcon } from "@/components/SocialIcon";
import { useConfirm } from "@/components/ConfirmDialog";
import { ACTIVE_MESSAGE_THRESHOLD } from "@/lib/giveawayConstants";

const ITEM_WIDTH = 128; // px — must match the w-32 class on each reel card
const ITEM_GAP = 10; // px — matches gap-2.5
const STEP = ITEM_WIDTH + ITEM_GAP;
const REEL_LENGTH = 36;
const WINNER_INDEX = 28; // leaves a few cards after it so the strip doesn't look like it "ran out"
const ROLL_DURATION_MS = 4000;
const VERIFY_DURATION_MS = 900;

const CONFETTI_COLORS = ["#ffd966", "#7fc24d", "#ffffff"];
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
  // (or omitted) for manual-mode picks, which have no activity concept.
  qualifiesActive?: boolean;
}

// One reel strip per winner being drawn.
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
  ring = false,
}: {
  username: string;
  avatarUrl: string | null;
  size?: number;
  ring?: boolean;
}) {
  const [errored, setErrored] = useState(false);
  const ringStyle = ring
    ? { width: size, height: size, border: "3px solid #ffd966", boxShadow: "0 0 0 2px #1a1008" }
    : { width: size, height: size };
  if (avatarUrl && !errored) {
    return (
      <img
        src={avatarUrl}
        alt=""
        onError={() => setErrored(true)}
        style={ringStyle}
        className="shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <div
      style={ringStyle}
      className="pixel-text flex shrink-0 items-center justify-center rounded-full bg-[#4a3016] text-[9px] font-bold text-[#ffd966]"
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
      className={`pixel-chip ${active ? "pixel-chip-active" : ""} flex shrink-0 items-center gap-1 rounded px-1.5 py-1 text-[8px]`}
      title={`${messageCount} message${messageCount === 1 ? "" : "s"} sent`}
    >
      <Icon name="message" className="h-2.5 w-2.5" />
      {messageCount}
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
  const [activeOnly, setActiveOnly] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [kickEntries, setKickEntries] = useState<Participant[]>([]);
  const [kickWinners, setKickWinners] = useState<Winner[]>([]);
  const [kickBusy, setKickBusy] = useState(false);
  const [connectWarning, setConnectWarning] = useState<string | null>(null);

  // Roll animation — mode-agnostic, drives off whatever draw() feeds it.
  // One strip per winner being drawn (see ReelItem above).
  const [rolling, setRolling] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [reels, setReels] = useState<ReelItem[][] | null>(null);
  const [revealed, setRevealed] = useState<Winner[] | null>(null);
  const [offset, setOffset] = useState(0);
  const [instant, setInstant] = useState(false);
  const [rollId, setRollId] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const finishTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const verifyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (finishTimer.current) clearTimeout(finishTimer.current);
      if (verifyTimer.current) clearTimeout(verifyTimer.current);
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
    setReels(null);
    setRevealed(null);
    setVerifying(false);
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
    if (verifyTimer.current) clearTimeout(verifyTimer.current);
    setReels(null);
    setRevealed(null);
    setVerifying(false);
  }

  function buildStrip(pool: Participant[], landing: Winner): ReelItem[] {
    return Array.from({ length: REEL_LENGTH }, (_, i) => {
      if (i === WINNER_INDEX) return { username: landing.username, avatarUrl: landing.avatarUrl };
      const p = pool[Math.floor(Math.random() * pool.length)];
      return { username: p.username, avatarUrl: p.avatarUrl };
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
    if (verifyTimer.current) clearTimeout(verifyTimer.current);

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
      setVerifying(false);
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
    // actually ran a transition for this particular roll. When there's a
    // real activity check to run (Kick + Active only), a short "Checking
    // status…" beat plays first instead of revealing instantly.
    finishTimer.current = setTimeout(() => {
      setRolling(false);
      if (mode === "kick" && activeOnly) {
        setVerifying(true);
        verifyTimer.current = setTimeout(() => {
          setVerifying(false);
          setRevealed(picked);
          setRollId((id) => id + 1);
        }, VERIFY_DURATION_MS);
      } else {
        setRevealed(picked);
        setRollId((id) => id + 1);
      }
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
      const count = overrideCount ?? winnerCount;
      const shuffled = [...participants].sort(() => Math.random() - 0.5);
      const picked = shuffled.slice(0, Math.min(count, shuffled.length)).map((p) => ({
        username: p.username,
        avatarUrl: null,
        qualifiesActive: true,
      }));
      if (picked.length === 0) return;
      setManualWinners((w) => [...w, ...picked]);
      runReelAnimation(participants, picked);
    }
  }

  const failedCount = revealed?.filter((w) => w.qualifiesActive === false).length ?? 0;

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="pixel-panel pixel-corners flex h-14 w-14 shrink-0 items-center justify-center">
          <Icon name="dice" className="h-6 w-6 text-[#ffd966]" />
        </div>
        <div>
          <p className="pixel-text text-[9px] tracking-widest text-white/40 uppercase">
            Giveaway
          </p>
          <h1 className="pixel-text-gold text-xl sm:text-2xl">Winner Vault</h1>
        </div>
      </div>

      {/* Mode tabs */}
      <div className="mt-6 flex w-fit gap-2">
        <button
          type="button"
          onClick={() => setMode("manual")}
          className={`pixel-btn pixel-corners flex items-center gap-1.5 px-4 py-2.5 text-[10px] ${
            mode === "manual" ? "pixel-btn-green" : "bg-[#3a2514] text-[#d8b98a]"
          }`}
        >
          <Icon name="list" className="h-3.5 w-3.5" />
          Manual
        </button>
        <button
          type="button"
          onClick={() => setMode("kick")}
          className={`pixel-btn pixel-corners flex items-center gap-1.5 px-4 py-2.5 text-[10px] ${
            mode === "kick" ? "pixel-btn-green" : "bg-[#3a2514] text-[#d8b98a]"
          }`}
        >
          <SocialIcon platform="kick" className="h-3.5 w-3.5" />
          Kick Chat
        </button>
      </div>

      {/* Settings | Participants | Winners */}
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        {/* Settings */}
        <div className="pixel-panel pixel-corners overflow-hidden">
          <div className="flex items-center gap-2 border-b-2 border-black/30 px-4 py-3">
            <Icon name="bolt" className="h-4 w-4 text-[#ffd966]" />
            <span className="pixel-text text-[9px] text-[#ffd966]">Settings</span>
            {mode === "kick" && sessionActive ? (
              <span className="pixel-chip pixel-chip-active ml-auto flex items-center gap-1.5 rounded px-2 py-1 text-[8px]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                </span>
                Live
              </span>
            ) : null}
          </div>

          <div className="space-y-4 p-4">
            {mode === "kick" ? (
              <>
                <div>
                  <label className="pixel-text text-[8px] text-[#d8b98a]">Keyword</label>
                  <input
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    disabled={sessionActive}
                    placeholder="!giveaway"
                    className="pixel-panel-dark pixel-text mt-1.5 w-full px-3 py-2.5 text-[10px] text-[#ffd966] focus:outline-none disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="pixel-text text-[8px] text-[#d8b98a]">
                    Number of winners
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={winnerCountInput}
                    onChange={(e) => setWinnerCountInput(e.target.value)}
                    disabled={sessionActive}
                    className="pixel-panel-dark pixel-text mt-1.5 w-full px-3 py-2.5 text-[10px] text-[#ffd966] focus:outline-none disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSubscribersOnly((v) => !v)}
                    disabled={sessionActive}
                    className={`pixel-chip ${subscribersOnly ? "pixel-chip-active" : ""} flex items-center gap-1 rounded px-2 py-1.5 text-[8px] disabled:opacity-50`}
                  >
                    {subscribersOnly ? <Icon name="check" className="h-2.5 w-2.5" /> : null}
                    Subscribers Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveOnly((v) => !v)}
                    disabled={sessionActive}
                    title={`A winner picked with fewer than ${ACTIVE_MESSAGE_THRESHOLD} chat messages gets flagged for a reroll instead of confirmed.`}
                    className={`pixel-chip ${activeOnly ? "pixel-chip-active" : ""} flex items-center gap-1 rounded px-2 py-1.5 text-[8px] disabled:opacity-50`}
                  >
                    {activeOnly ? <Icon name="check" className="h-2.5 w-2.5" /> : null}
                    Active Only
                  </button>
                </div>

                {connectWarning ? (
                  <p className="pixel-text text-[8px] leading-relaxed text-[#f2c35c]">
                    Kick connection issue: {connectWarning}
                  </p>
                ) : null}

                {sessionActive ? (
                  <button
                    type="button"
                    onClick={stopGiveaway}
                    disabled={kickBusy}
                    className="pixel-btn pixel-btn-red pixel-corners flex w-full items-center justify-center gap-1.5 px-3 py-3 text-[9px] disabled:opacity-50"
                  >
                    <Icon name="stop" className="h-3 w-3" />
                    Stop Giveaway
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startGiveaway}
                    disabled={kickBusy || !keyword.trim()}
                    className="pixel-btn pixel-btn-green pixel-corners flex w-full items-center justify-center gap-1.5 px-3 py-3 text-[9px] disabled:opacity-50"
                  >
                    <Icon name="bolt" className="h-3.5 w-3.5" />
                    Start Giveaway
                  </button>
                )}
                <p className="pixel-text text-[8px] leading-relaxed text-[#d8b98a]">
                  Viewers type <span className="text-[#ffd966]">{keyword}</span> in chat to join.
                </p>
              </>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addNames(draftName);
                  setDraftName("");
                }}
                className="space-y-4"
              >
                <div>
                  <label className="pixel-text text-[8px] text-[#d8b98a]">
                    Number of winners
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={winnerCountInput}
                    onChange={(e) => setWinnerCountInput(e.target.value)}
                    className="pixel-panel-dark pixel-text mt-1.5 w-full px-3 py-2.5 text-[10px] text-[#ffd966] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="pixel-text text-[8px] text-[#d8b98a]">Add a name</label>
                  <div className="mt-1.5 flex gap-2">
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
                      className="pixel-panel-dark pixel-text min-w-0 flex-1 px-3 py-2.5 text-[10px] text-[#ffd966] placeholder:text-[#5c4526] focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!draftName.trim()}
                      className="pixel-btn pixel-corners shrink-0 bg-[#3a2514] px-3 py-2 text-[9px] text-[#d8b98a] disabled:opacity-30"
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
        <div className="pixel-panel pixel-corners flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 border-b-2 border-black/30 px-4 py-3">
            <Icon name="users" className="h-4 w-4 text-[#ffd966]" />
            <span className="pixel-text text-[9px] text-[#ffd966]">Entries</span>
            <span className="pixel-chip ml-auto rounded px-2 py-1 text-[8px]">
              {participants.length}
            </span>
          </div>
          <div className="max-h-[28rem] flex-1 space-y-2 overflow-y-auto p-3">
            {participants.length === 0 ? (
              <p className="pixel-text p-2 text-[9px] leading-relaxed text-[#8a6c46]">
                {mode === "kick"
                  ? "Waiting for entries…"
                  : "No participants yet — add names on the left."}
              </p>
            ) : (
              participants.map((p) => (
                <div
                  key={p.username}
                  className="pixel-panel-dark flex items-center gap-2.5 rounded px-3 py-2.5"
                >
                  <Avatar username={p.username} avatarUrl={p.avatarUrl} size={28} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#f0dcb8]">
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
                      className="pixel-btn pixel-btn-red pixel-corners shrink-0 px-2 py-1 text-[8px]"
                    >
                      Kick
                    </button>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Winners */}
        <div className="pixel-panel pixel-corners flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 border-b-2 border-black/30 px-4 py-3">
            <Icon name="trophy" className="h-4 w-4 text-[#ffd966]" />
            <span className="pixel-text text-[9px] text-[#ffd966]">Winners</span>
            <span className="pixel-chip pixel-chip-active ml-auto rounded px-2 py-1 text-[8px]">
              {winners.length}
            </span>
          </div>
          <div className="max-h-[28rem] flex-1 space-y-2 overflow-y-auto p-3">
            {winners.length === 0 ? (
              <p className="pixel-text p-2 text-[9px] leading-relaxed text-[#8a6c46]">
                Nobody drawn yet — click Roll below.
              </p>
            ) : (
              winners.map((w, i) => (
                <div
                  key={`${w.username}-${i}`}
                  className="pixel-panel-dark flex items-center gap-2.5 rounded px-3 py-2.5"
                >
                  <Avatar username={w.username} avatarUrl={w.avatarUrl} size={28} ring />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#f0dcb8]">
                    {w.username}
                  </span>
                  {mode === "kick" ? (
                    <ActivityBadge messageCount={w.messageCount ?? 0} />
                  ) : null}
                  <Icon name="crown" className="h-4 w-4 shrink-0 text-[#ffd966]" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => draw()}
          disabled={rolling || participants.length === 0 || (mode === "kick" && kickBusy)}
          className="pixel-btn pixel-btn-green pixel-corners flex items-center gap-2 px-7 py-4 text-[11px] disabled:opacity-40"
        >
          <Icon name="dice" className={`h-4 w-4 ${rolling ? "animate-spin" : ""}`} />
          {rolling ? "Rolling…" : `Roll ${winnerCount > 1 ? `${winnerCount} Winners` : "Winner"}`}
        </button>
        <button
          type="button"
          onClick={resetAll}
          disabled={rolling}
          className="pixel-btn pixel-btn-red pixel-corners px-5 py-4 text-[11px] disabled:opacity-40"
        >
          Reset
        </button>
      </div>

      {/* Centered overlay so the winner is always visible on screen the
          instant it lands — no scrolling down the page to find it. */}
      {reels ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeRollOverlay();
          }}
        >
          <div className="relative w-full max-w-2xl">
            <button
              type="button"
              onClick={closeRollOverlay}
              aria-label="Close"
              className="pixel-btn pixel-corners absolute -top-12 right-0 bg-[#3a2514] p-2 text-[#d8b98a]"
            >
              <Icon name="close" className="h-4 w-4" />
            </button>

            {/* One reel per winner — all spin together. Scrolls internally
                once there are enough winners to overflow the viewport. */}
            <div
              className={`space-y-3 ${reels.length > 1 ? "max-h-[60vh] overflow-y-auto pr-1" : ""}`}
            >
              {reels.map((strip, reelIndex) => (
                <div key={reelIndex} className="relative">
                  {reels.length > 1 ? (
                    <p className="pixel-text mb-1.5 text-[8px] text-[#ffd966]">
                      Winner {reelIndex + 1}
                    </p>
                  ) : null}
                  <div
                    ref={reelIndex === 0 ? viewportRef : undefined}
                    className={`pixel-panel pixel-corners relative ${reels.length > 1 ? "h-24" : "h-32"} overflow-hidden`}
                  >
                    <div className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-1 -translate-x-1/2 bg-[#ffd966] shadow-[0_0_10px_rgba(255,217,102,0.9)]" />
                    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-full bg-gradient-to-r from-[#2b1b10] via-transparent to-[#2b1b10]" />
                    <div
                      className="flex h-full items-center gap-2.5 px-2 transition-transform ease-out"
                      style={{
                        transform: `translateX(${-offset}px)`,
                        transitionDuration: instant ? "0ms" : `${ROLL_DURATION_MS}ms`,
                      }}
                    >
                      {strip.map((item, i) => {
                        const landed = !rolling && i === WINNER_INDEX;
                        const failed = landed && revealed?.[reelIndex]?.qualifiesActive === false;
                        return (
                          <div
                            key={i}
                            style={{ width: ITEM_WIDTH }}
                            className={`flex ${reels.length > 1 ? "h-20" : "h-28"} shrink-0 flex-col items-center justify-center gap-1 rounded border-2 px-2 text-center ${
                              landed
                                ? failed
                                  ? "border-[#f2c35c] bg-[#3d2b06]"
                                  : "border-[#ffd966] bg-[#3a2f14]"
                                : "border-black/30 bg-[#241609]"
                            }`}
                          >
                            <Avatar
                              username={item.username}
                              avatarUrl={item.avatarUrl}
                              size={reels.length > 1 ? 30 : 38}
                              ring={landed && !failed}
                            />
                            <span
                              className={`truncate text-[10px] font-semibold ${
                                landed ? (failed ? "text-[#f2c35c]" : "text-[#ffd966]") : "text-[#a88a5f]"
                              }`}
                            >
                              {item.username}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {verifying ? (
              <div className="pixel-panel pixel-corners relative mt-6 overflow-hidden p-6 text-center">
                <div className="mx-auto flex w-fit items-center gap-2">
                  <Icon name="message" className="h-4 w-4 animate-pulse text-[#ffd966]" />
                  <p className="pixel-text animate-pulse text-[10px] text-[#ffd966]">
                    Checking activity status…
                  </p>
                </div>
              </div>
            ) : null}

            {revealed ? (
              <div className="pixel-panel pixel-corners animate-glow-pulse relative mt-6 overflow-hidden p-8 text-center">
                {failedCount === 0
                  ? confetti.map((c) => (
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
                    ))
                  : null}
                <span className="animate-crown-bounce inline-block">
                  <Icon name="crown" className="h-10 w-10 text-[#ffd966]" />
                </span>
                <p className="pixel-text mt-2 flex items-center justify-center gap-1.5 text-[9px] text-[#d8b98a]">
                  {revealed.length > 1 ? "Winners Selected" : "Winner Selected"}
                </p>
                <div className="relative z-10 mt-4 space-y-4">
                  {revealed.map((w) => (
                    <div key={w.username} className="flex flex-col items-center gap-1.5">
                      <div className="flex items-center justify-center gap-3">
                        <Avatar
                          username={w.username}
                          avatarUrl={w.avatarUrl}
                          size={44}
                          ring={w.qualifiesActive !== false}
                        />
                        <span
                          className={`pixel-text-gold animate-winner-pop text-base sm:text-lg ${
                            w.qualifiesActive === false ? "opacity-50" : ""
                          }`}
                        >
                          {w.username}
                        </span>
                      </div>
                      {w.qualifiesActive === false ? (
                        <p className="pixel-text flex items-center gap-1 text-[8px] text-[#f2c35c]">
                          <Icon name="message" className="h-3 w-3" />
                          Not active enough — needs a reroll
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>

                {failedCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => draw(failedCount)}
                    disabled={rolling || (mode === "kick" && kickBusy)}
                    className="pixel-btn pixel-btn-amber pixel-corners relative z-10 mx-auto mt-6 flex items-center justify-center gap-1.5 px-5 py-3 text-[9px] disabled:opacity-40"
                  >
                    <Icon name="dice" className="h-3.5 w-3.5" />
                    Reroll {failedCount} Inactive
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={closeRollOverlay}
                    className="pixel-btn pixel-btn-green pixel-corners relative z-10 mx-auto mt-6 block px-8 py-3 text-[10px]"
                  >
                    Continue
                  </button>
                )}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
