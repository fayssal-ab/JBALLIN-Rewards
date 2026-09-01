// Synthesized via Web Audio API — no external audio files, so there's
// nothing to source/license for a wheel-spin tick and a win chime. Safe to
// import from a client component; every function no-ops on the server or
// before any user gesture has unlocked audio.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tick(volume = 0.16) {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "square";
  osc.frequency.value = 850;
  gain.gain.setValueAtTime(volume, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.045);
  osc.connect(gain).connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + 0.05);
}

function winChime() {
  const c = getCtx();
  if (!c) return;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const start = c.currentTime + i * 0.09;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.22, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.3);
    osc.connect(gain).connect(c.destination);
    osc.start(start);
    osc.stop(start + 0.32);
  });
}

// Schedules decelerating ticks across the roll duration — starts fast,
// eases out, like a wheel or reel physically slowing down. Returns a
// cancel function to clear any not-yet-fired ticks (call on reset/unmount
// so a closed roll doesn't keep clicking).
function scheduleTicks(durationMs: number): () => void {
  const timers: ReturnType<typeof setTimeout>[] = [];
  let elapsed = 0;
  let interval = 70;
  while (elapsed < durationMs) {
    timers.push(setTimeout(tick, elapsed));
    elapsed += interval;
    interval = Math.min(interval * 1.12, 380);
  }
  return () => timers.forEach(clearTimeout);
}

export const rollSound = { tick, winChime, scheduleTicks };
