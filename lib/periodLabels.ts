// Pure date/label helpers for periods — no DB, safe to import anywhere.
// All dates are "YYYY-MM-DD" strings interpreted as UTC, same as the
// periods table.

const monthName = new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" });
const monthYear = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const fullDate = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function utc(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00Z`);
}

function sameMonth(a: Date, b: Date): boolean {
  return a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth();
}

export function addDays(dateStr: string, days: number): string {
  const d = utc(dateStr);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function formatDate(dateStr: string): string {
  return fullDate.format(utc(dateStr));
}

/** "July 2026", or "August – September 2026" when a period spans months. */
export function periodLabel(startAt: string, endAt: string): string {
  const start = utc(startAt);
  const end = utc(endAt);
  if (sameMonth(start, end)) return monthYear.format(start);
  if (start.getUTCFullYear() === end.getUTCFullYear()) {
    return `${monthName.format(start)} – ${monthYear.format(end)}`;
  }
  return `${monthYear.format(start)} – ${monthYear.format(end)}`;
}

/**
 * Month(s) covered by the inclusive range [from, to] — "October", or
 * "October – November". Null when the range is empty (to < from), which is
 * the normal back-to-back rollover, i.e. no pause.
 */
export function gapLabel(from: string, to: string): string | null {
  if (to < from) return null;
  const a = utc(from);
  const b = utc(to);
  return sameMonth(a, b) ? monthName.format(a) : `${monthName.format(a)} – ${monthName.format(b)}`;
}
