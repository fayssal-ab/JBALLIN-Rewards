"use client";

import { useEffect, useState } from "react";

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
    <div className="flex items-center justify-center gap-3 sm:gap-4">
      {UNITS.map((unit) => (
        <div
          key={unit.key}
          className="flex w-16 flex-col items-center rounded-xl border border-white/10 bg-zinc-900/60 py-3 sm:w-20"
        >
          <span className="font-display text-2xl text-emerald-300 sm:text-3xl">
            {String(display[unit.key]).padStart(2, "0")}
          </span>
          <span className="mt-1 text-[10px] tracking-wide text-white/40 uppercase">
            {unit.label}
          </span>
        </div>
      ))}
    </div>
  );
}
