import "server-only";
import type { RowDataPacket } from "mysql2";
import { getPool } from "./db";
import { PERIOD_RESET_TIME_UTC } from "./constants";

export interface Period {
  id: number;
  start_at: string;
  end_at: string;
  timezone: string;
  prize_pool: string;
  prize_distribution: unknown;
  status: "upcoming" | "live" | "closed";
}

export interface LiveEntryInput {
  period_id: number;
  rainbet_id: string;
  username: string;
  wagered_amount: string;
}

export async function getActivePeriod(): Promise<Period | null> {
  const [rows] = await getPool().query<RowDataPacket[]>(
    "SELECT * FROM periods WHERE status = 'live' LIMIT 1"
  );
  return (rows[0] as Period | undefined) ?? null;
}

export interface LiveEntry {
  rainbet_id: string;
  username: string;
  wagered_amount: string;
  rank: number;
}

export async function getLiveEntries(
  periodId: number,
  limit = 10
): Promise<LiveEntry[]> {
  const [rows] = await getPool().query<RowDataPacket[]>(
    "SELECT rainbet_id, username, wagered_amount, `rank` FROM live_entries WHERE period_id = ? ORDER BY `rank` ASC LIMIT ?",
    [periodId, limit]
  );
  return rows as LiveEntry[];
}

interface PrizeDistributionEntry {
  rank: number;
  percentage: number;
}

/** See close_period() in db/migrations/0002_procedures.sql for this shape. */
export function getRewardForRank(
  rank: number,
  prizePool: string,
  prizeDistribution: unknown
): number {
  if (!Array.isArray(prizeDistribution)) return 0;
  const entry = (prizeDistribution as PrizeDistributionEntry[]).find(
    (d) => Number(d.rank) === rank
  );
  if (!entry) return 0;
  return (Number(prizePool) * Number(entry.percentage)) / 100;
}

export async function getLatestSuccessfulSync(
  periodId: number
): Promise<{ cache_updated_at: string | null } | null> {
  const [rows] = await getPool().query<RowDataPacket[]>(
    `SELECT cache_updated_at FROM sync_log
     WHERE period_id = ? AND status = 'success'
     ORDER BY fetched_at DESC LIMIT 1`,
    [periodId]
  );
  return (rows[0] as { cache_updated_at: string | null } | undefined) ?? null;
}

export async function getBlacklistedIds(): Promise<Set<string>> {
  const [rows] = await getPool().query<RowDataPacket[]>(
    "SELECT rainbet_id FROM blacklist"
  );
  return new Set(rows.map((row) => row.rainbet_id as string));
}

// Wholesale replace-on-conflict upsert. wagered_amount stays a string end to
// end so MySQL parses the decimal, never a JS float (CLAUDE.md).
export async function upsertLiveEntries(entries: LiveEntryInput[]): Promise<void> {
  if (entries.length === 0) return;

  const values = entries.map((entry) => [
    entry.period_id,
    entry.rainbet_id,
    entry.username,
    entry.wagered_amount,
  ]);

  await getPool().query(
    `INSERT INTO live_entries (period_id, rainbet_id, username, wagered_amount)
     VALUES ?
     ON DUPLICATE KEY UPDATE
       username = VALUES(username),
       wagered_amount = VALUES(wagered_amount),
       updated_at = CURRENT_TIMESTAMP`,
    [values]
  );
}

export async function recomputeLiveRanks(periodId: number): Promise<void> {
  await getPool().query("CALL recompute_live_ranks(?)", [periodId]);
}

// Copies live_entries -> final_results, applies prize_distribution, and
// marks the period closed. See close_period() in
// db/migrations/0002_procedures.sql for the assumed distribution shape.
export async function closePeriod(periodId: number): Promise<void> {
  await getPool().query("CALL close_period(?)", [periodId]);
}

export async function activateNextPeriod(): Promise<void> {
  await getPool().query("CALL activate_next_period()");
}

export interface SyncLogEntry {
  period_id: number | null;
  cache_updated_at: string | null;
  status: "success" | "failure";
  error_code: string | null;
}

export async function writeSyncLog(entry: SyncLogEntry): Promise<void> {
  await getPool().query(
    `INSERT INTO sync_log (period_id, cache_updated_at, status, error_code)
     VALUES (?, ?, ?, ?)`,
    [entry.period_id, entry.cache_updated_at, entry.status, entry.error_code]
  );
}

/** Periods reset at PERIOD_RESET_TIME_UTC on end_at's date, not midnight. */
export function hasPeriodEnded(period: Period, now: Date = new Date()): boolean {
  const resetInstant = new Date(`${period.end_at}T${PERIOD_RESET_TIME_UTC}Z`);
  return now.getTime() > resetInstant.getTime();
}
