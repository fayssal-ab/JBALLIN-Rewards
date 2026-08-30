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

// A dashed ring drawn with SVG (not an image) so it stays crisp at any size
// and can be tinted to the site's emerald accent instead of a fixed color.
function RingDial({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-[72px] w-[72px] sm:h-28 sm:w-28">
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="rgba(52,211,153,0.3)"
            strokeWidth="4"
            strokeDasharray="3 6"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-2xl tabular-nums text-white sm:text-4xl">
            {String(value).padStart(2, "0")}
          </span>
        </div>
      </div>
      <span className="mt-2 text-[9px] tracking-[0.2em] text-white/40 uppercase sm:text-xs">
        {label}
      </span>
    </div>
  );
}

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
    <div className="flex items-center justify-center gap-2 sm:gap-8">
      {UNITS.map((unit) => (
        <RingDial key={unit.key} value={display[unit.key]} label={unit.label} />
      ))}
    </div>
  );
}
