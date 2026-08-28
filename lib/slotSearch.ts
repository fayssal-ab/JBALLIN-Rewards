import "server-only";

export interface SlotSuggestion {
  name: string;
  provider: string;
  imageUrl: string;
}

interface SlotReportEntry {
  name: string;
  slug: string;
  provider: string;
}

// slot.report's JSON API has no image field (checked the live response —
// name/provider/rtp/etc only), but their own site serves each slot's box
// art at this predictable path (confirmed against several real slugs, e.g.
// /images/slots/gates-of-olympus-thumb.webp returns 200 image/webp) — same
// images their homepage grid links to the /slots/{slug} detail page.
function thumbUrl(slug: string): string {
  return `https://slot.report/images/slots/${slug}-thumb.webp`;
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

  // Autocomplete is a convenience, not a critical path — degrade to no
  // suggestions on any failure (bad status, network error, timeout, bad
  // JSON) rather than letting the admin bonus-hunt form 500.
  try {
    const res = await fetch("https://slot.report/api/v1/slots.json", {
      headers: { "X-API-Key": apiKey },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return [];

    const data: SlotReportResponse = await res.json();
    return data.results ?? [];
  } catch {
    return [];
  }
}

export async function searchSlots(query: string, limit = 8): Promise<SlotSuggestion[]> {
  const trimmed = query.trim().toLowerCase();
  if (trimmed.length < 2) return [];

  const slots = await getAllSlots();
  const matches: SlotSuggestion[] = [];

  for (const slot of slots) {
    if (slot.name.toLowerCase().includes(trimmed)) {
      matches.push({ name: slot.name, provider: slot.provider, imageUrl: thumbUrl(slot.slug) });
      if (matches.length >= limit) break;
    }
  }

  return matches;
}
