"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function diff(target: Date): TimeLeft {
  const ms = Math.max(0, target.getTime() - Date.now());
  const seconds = Math.floor(ms / 1000);
  return {
    days: Math.floor(seconds / 86400),
    hours: Math.floor((seconds % 86400) / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60,
  };
}

const UNITS: { key: keyof TimeLeft; label: string }[] = [
  { key: "days", label: "Days" },
  { key: "hours", label: "Hours" },
  { key: "minutes", label: "Minutes" },
  { key: "seconds", label: "Seconds" },
];

// `targetIso` must be an absolute instant (with a UTC offset, e.g. the
// "Z" in "2026-08-31T23:59:59Z"). Date arithmetic below happens in the
// visitor's local clock automatically — no timezone conversion needed here,
// that's the whole point of using Date.getTime() (always UTC internally).
export function Countdown({ targetIso }: { targetIso: string }) {
  const target = new Date(targetIso);
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    setTimeLeft(diff(target));
    const id = setInterval(() => setTimeLeft(diff(target)), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetIso]);

  // Render zeros on the server / first paint, then tick client-side —
  // avoids a hydration mismatch from the server and client computing
  // "now" at slightly different instants.
  const display = timeLeft ?? { days: 0, hours: 0, minutes: 0, seconds: 0 };

  return (
    <div className="mx-auto w-fit rounded-2xl border border-emerald-400/20 bg-gradient-to-b from-emerald-400/[0.06] to-transparent px-5 py-4 sm:px-7 sm:py-5">
      <p className="flex items-center justify-center gap-1.5 text-[10px] tracking-[0.3em] text-emerald-400/60 uppercase">
        <Icon name="clock" className="h-3 w-3" />
        Resets in
      </p>
      <div className="mt-3 flex items-center justify-center gap-1.5 sm:gap-2.5">
        {UNITS.map((unit, i) => (
          <div key={unit.key} className="flex items-center gap-1.5 sm:gap-2.5">
            <div className="flex w-14 flex-col items-center rounded-xl border border-white/10 bg-zinc-900/70 py-2.5 shadow-[0_0_20px_rgba(52,211,153,0.08)] sm:w-16">
              <span className="font-display text-xl tabular-nums text-emerald-300 sm:text-2xl">
                {String(display[unit.key]).padStart(2, "0")}
              </span>
              <span className="mt-0.5 text-[9px] tracking-wide text-white/40 uppercase">
                {unit.label}
              </span>
            </div>
            {i < UNITS.length - 1 ? (
              <span className="font-display text-lg text-emerald-400/30">:</span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
