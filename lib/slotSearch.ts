import "server-only";

export interface SlotSuggestion {
  name: string;
  provider: string;
}

interface SlotReportEntry {
  name: string;
  provider: string;
}

interface SlotReportResponse {
  results: SlotReportEntry[];
}

// slot.report has no search endpoint, only the full list (~6,300 slots,
// ~3MB) and per-provider filters. We fetch the full list once and let
// Next.js's data cache hold it — `revalidate` matches their "updated
// daily" cadence, so this is at most one 3MB fetch per day, not per
// keystroke. See CLAUDE.md-style note: this key is tied to the dofollow
// footer link; if that link ever comes down, slot.report suspends it.
async function getAllSlots(): Promise<SlotReportEntry[]> {
  const apiKey = process.env.SLOT_REPORT_API_KEY;
  if (!apiKey) return [];

  const res = await fetch("https://slot.report/api/v1/slots.json", {
    headers: { "X-API-Key": apiKey },
    next: { revalidate: 86400 },
  });
  if (!res.ok) return [];

  const data: SlotReportResponse = await res.json();
  return data.results ?? [];
}

export async function searchSlots(query: string, limit = 8): Promise<SlotSuggestion[]> {
  const trimmed = query.trim().toLowerCase();
  if (trimmed.length < 2) return [];

  const slots = await getAllSlots();
  const matches: SlotSuggestion[] = [];

  for (const slot of slots) {
    if (slot.name.toLowerCase().includes(trimmed)) {
      matches.push({ name: slot.name, provider: slot.provider });
      if (matches.length >= limit) break;
    }
  }

  return matches;
}
