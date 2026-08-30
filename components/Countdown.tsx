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
    <div className="mx-auto flex w-fit items-center gap-2.5 rounded-full border border-emerald-400/20 bg-zinc-900/60 px-5 py-2.5 shadow-[0_0_20px_rgba(52,211,153,0.08)]">
      <Icon name="clock" className="h-4 w-4 shrink-0 text-emerald-300" />
      <span className="font-display flex items-baseline gap-1 text-base tabular-nums text-white sm:text-lg">
        {UNITS.map((unit) => (
          <span key={unit.key}>
            <span className="text-emerald-300">{String(display[unit.key]).padStart(2, "0")}</span>
            <span className="ml-0.5 text-xs text-white/40 lowercase">
              {unit.label[0]}
            </span>
          </span>
        ))}
      </span>
    </div>
  );
}
