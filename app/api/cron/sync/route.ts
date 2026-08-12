import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { fetchAffiliates } from "@/lib/rainbet";
import {
  getActivePeriod,
  getBlacklistedIds,
  upsertLiveEntries,
  recomputeLiveRanks,
  closePeriod,
  activateNextPeriod,
  writeSyncLog,
  hasPeriodEnded,
} from "@/lib/periods";

// Implements the cron logic from CLAUDE.md exactly: on failure, log and
// leave existing data untouched (golden rule 4) — never clear the board.
async function runSync(): Promise<NextResponse> {
  const period = await getActivePeriod();

  if (!period) {
    await activateNextPeriod();
    return NextResponse.json({ status: "no_active_period" });
  }

  const result = await fetchAffiliates(period.start_at, period.end_at);

  if (!result.ok) {
    await writeSyncLog({
      period_id: period.id,
      cache_updated_at: null,
      status: "failure",
      error_code: result.errorCode,
    });
    return NextResponse.json(
      { status: "failure", error_code: result.errorCode },
      { status: 502 }
    );
  }

  const blacklisted = await getBlacklistedIds();
  const entries = result.data.affiliates
    .filter((affiliate) => !blacklisted.has(affiliate.id))
    .map((affiliate) => ({
      period_id: period.id,
      rainbet_id: affiliate.id,
      username: affiliate.username,
      wagered_amount: affiliate.wagered_amount,
    }));

  await upsertLiveEntries(entries);
  await recomputeLiveRanks(period.id);
  await writeSyncLog({
    period_id: period.id,
    cache_updated_at: result.data.cache_updated_at,
    status: "success",
    error_code: null,
  });

  if (hasPeriodEnded(period)) {
    await closePeriod(period.id);
    await activateNextPeriod();
  }

  return NextResponse.json({ status: "success", entries: entries.length });
}

function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) throw new Error("CRON_SECRET is not set");
  return request.headers.get("authorization") === `Bearer ${expected}`;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return runSync();
}

// Some free cron services (e.g. cron-job.org) only send GET. Same auth check.
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return runSync();
}
