import "server-only";
import type { RowDataPacket } from "mysql2";
import { getPool } from "./db";

export interface GiveawaySession {
  active: boolean;
  keyword: string;
  winnerCount: number;
  subscribersOnly: boolean;
  webhookConnected: boolean;
  started_at: string | null;
}

export interface GiveawayEntry {
  username: string;
  avatarUrl: string | null;
  isSubscriber: boolean;
}

export interface GiveawayWinner {
  username: string;
  avatarUrl: string | null;
}

export async function getGiveawaySession(): Promise<GiveawaySession> {
  const [rows] = await getPool().query<RowDataPacket[]>(
    `SELECT active, keyword, winner_count, subscribers_only, webhook_connected, started_at
     FROM giveaway_session WHERE id = 1`
  );
  const row = rows[0];
  return {
    active: Boolean(row?.active),
    keyword: (row?.keyword as string | undefined) ?? "!giveaway",
    winnerCount: (row?.winner_count as number | undefined) ?? 1,
    subscribersOnly: Boolean(row?.subscribers_only),
    webhookConnected: Boolean(row?.webhook_connected),
    started_at: (row?.started_at as string | undefined) ?? null,
  };
}

export async function markWebhookConnected(): Promise<void> {
  await getPool().query("UPDATE giveaway_session SET webhook_connected = 1 WHERE id = 1");
}

export async function getGiveawayEntries(): Promise<GiveawayEntry[]> {
  const [rows] = await getPool().query<RowDataPacket[]>(
    "SELECT username, avatar_url, is_subscriber FROM giveaway_entries ORDER BY created_at ASC"
  );
  return rows.map((row) => ({
    username: row.username as string,
    avatarUrl: (row.avatar_url as string | null) ?? null,
    isSubscriber: Boolean(row.is_subscriber),
  }));
}

export async function getGiveawayWinners(): Promise<GiveawayWinner[]> {
  const [rows] = await getPool().query<RowDataPacket[]>(
    "SELECT username, avatar_url FROM giveaway_winners ORDER BY won_at ASC"
  );
  return rows.map((row) => ({
    username: row.username as string,
    avatarUrl: (row.avatar_url as string | null) ?? null,
  }));
}

// Fresh session each time — clears whatever the previous session collected,
// both entries and any winners already drawn.
export async function startGiveawaySession(opts: {
  keyword: string;
  winnerCount: number;
  subscribersOnly: boolean;
}): Promise<void> {
  const pool = getPool();
  await pool.query("DELETE FROM giveaway_entries");
  await pool.query("DELETE FROM giveaway_winners");
  await pool.query(
    `UPDATE giveaway_session
     SET active = 1, keyword = ?, winner_count = ?, subscribers_only = ?, started_at = CURRENT_TIMESTAMP
     WHERE id = 1`,
    [opts.keyword, opts.winnerCount, opts.subscribersOnly ? 1 : 0]
  );
}

export async function stopGiveawaySession(): Promise<void> {
  await getPool().query("UPDATE giveaway_session SET active = 0 WHERE id = 1");
}

// Distinct from stop: clears the collected entries and winners too, not
// just closing chat collection. Used by the admin "Reset" button.
export async function resetGiveawayState(): Promise<void> {
  const pool = getPool();
  await pool.query("UPDATE giveaway_session SET active = 0 WHERE id = 1");
  await pool.query("DELETE FROM giveaway_entries");
  await pool.query("DELETE FROM giveaway_winners");
}

// Random, non-repeating draw: picks up to `count` entries that haven't
// already won this session (optionally restricted to subscribers) and
// records them in giveaway_winners. Shuffled in JS, not SQL ORDER BY RAND()
// — fine at this scale (a chat giveaway's entrant count, not a table scan)
// and keeps the randomness source obvious.
export async function drawGiveawayWinners(
  count: number,
  subscribersOnly: boolean
): Promise<GiveawayWinner[]> {
  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT e.username, e.avatar_url FROM giveaway_entries e
     WHERE e.username NOT IN (SELECT username FROM giveaway_winners)
       ${subscribersOnly ? "AND e.is_subscriber = 1" : ""}`
  );
  const candidates: GiveawayWinner[] = rows.map((r) => ({
    username: r.username as string,
    avatarUrl: (r.avatar_url as string | null) ?? null,
  }));

  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  const picked = candidates.slice(0, count);

  if (picked.length > 0) {
    await pool.query("INSERT INTO giveaway_winners (username, avatar_url) VALUES ?", [
      picked.map((p) => [p.username, p.avatarUrl]),
    ]);
  }
  return picked;
}

// Called from the webhook handler for every chat message. Never throws —
// a non-2xx response makes Kick retry the delivery, and a bad message
// shouldn't be able to wedge the webhook. Silently no-ops when there's no
// active session or the message doesn't match the keyword.
export async function recordGiveawayEntryIfMatches(
  username: string,
  content: string,
  avatarUrl: string | null,
  isSubscriber: boolean
): Promise<void> {
  const session = await getGiveawaySession();
  if (!session.active) return;

  const normalized = content.trim().toLowerCase();
  const keyword = session.keyword.trim().toLowerCase();
  if (!keyword || !normalized.startsWith(keyword)) return;

  await getPool().query(
    `INSERT INTO giveaway_entries (username, avatar_url, is_subscriber) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE avatar_url = VALUES(avatar_url), is_subscriber = VALUES(is_subscriber)`,
    [username, avatarUrl, isSubscriber ? 1 : 0]
  );
}
