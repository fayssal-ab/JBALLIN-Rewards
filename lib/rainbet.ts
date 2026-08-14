import "server-only";

// Server-only client for the Rainbet affiliate API. Never import this from
// a client component: RAINBET_API_KEY goes in the query string, so any
// client-side fetch would leak it in DevTools. See CLAUDE.md golden rules 1-2.

const BASE_URL = "https://services.rainbet.com";

export interface RainbetAffiliate {
  username: string;
  id: string;
  /** Decimal string at full precision. Do not parse to a JS number. */
  wagered_amount: string;
}

export interface RainbetAffiliatesResponse {
  affiliates: RainbetAffiliate[];
  cache_updated_at: string;
}

export type RainbetErrorCode =
  | "er_missing_parameters"
  | "er_invalid_date_format"
  | "er_start_at_parameter_invalid"
  | "er_end_at_parameter_invalid"
  | "er_end_at_parameter_within_4_month"
  | "er_invalid_key"
  | "er_invalid_target_edge_configuration"
  | "er_unexpected_response";

export type RainbetResult =
  | { ok: true; data: RainbetAffiliatesResponse }
  | { ok: false; errorCode: RainbetErrorCode; status: number };

const MAX_RANGE_DAYS = 123;

/** YYYY-MM-DD, inclusive on both ends per the API spec. */
function daysBetween(startAt: string, endAt: string): number {
  const start = new Date(`${startAt}T00:00:00Z`);
  const end = new Date(`${endAt}T00:00:00Z`);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

export async function fetchAffiliates(
  startAt: string,
  endAt: string
): Promise<RainbetResult> {
  const apiKey = process.env.RAINBET_API_KEY;
  if (!apiKey) {
    throw new Error("RAINBET_API_KEY is not set");
  }

  if (daysBetween(startAt, endAt) > MAX_RANGE_DAYS) {
    return { ok: false, errorCode: "er_end_at_parameter_within_4_month", status: 400 };
  }

  const url = new URL("/v1/external/affiliates", BASE_URL);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("start_at", startAt);
  url.searchParams.set("end_at", endAt);

  const response = await fetch(url, { cache: "no-store" });

  if (response.status === 200) {
    const data = (await response.json()) as RainbetAffiliatesResponse;
    return { ok: true, data };
  }

  if (response.status === 400 || response.status === 500) {
    const body = (await response.json()) as { error?: string };
    switch (body.error) {
      case "er_missing_parameters":
      case "er_invalid_date_format":
      case "er_start_at_parameter_invalid":
      case "er_end_at_parameter_invalid":
      case "er_end_at_parameter_within_4_month":
      case "er_invalid_key":
      case "er_invalid_target_edge_configuration":
        return { ok: false, errorCode: body.error, status: response.status };
      default:
        return { ok: false, errorCode: "er_unexpected_response", status: response.status };
    }
  }

  return { ok: false, errorCode: "er_unexpected_response", status: response.status };
}
