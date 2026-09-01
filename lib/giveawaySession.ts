import "server-only";
import type { RowDataPacket } from "mysql2";
import { getPool } from "./db";
import { ACTIVE_MESSAGE_THRESHOLD } from "./giveawayConstants";

export interface GiveawaySession {
  active: boolean;
  keyword: string;
  winnerCount: number;
  subscribersOnly: boolean;
  activeOnly: boolean;
  webhookConnected: boolean;
  started_at: string | null;
}

export interface GiveawayEntry {
  username: string;
  avatarUrl: string | null;
  isSubscriber: boolean;
  messageCount: number;
}

export interface GiveawayWinner {
  username: string;
  avatarUrl: string | null;
  messageCount: number;
}

export async function getGiveawaySession(): Promise<GiveawaySession> {
  const [rows] = await getPool().query<RowDataPacket[]>(
    `SELECT active, keyword, winner_count, subscribers_only, active_only, webhook_connected, started_at
     FROM giveaway_session WHERE id = 1`
  );
  const row = rows[0];
  return {
    active: Boolean(row?.active),
    keyword: (row?.keyword as string | undefined) ?? "!giveaway",
    winnerCount: (row?.winner_count as number | undefined) ?? 1,
    subscribersOnly: Boolean(row?.subscribers_only),
    activeOnly: Boolean(row?.active_only),
    webhookConnected: Boolean(row?.webhook_connected),
    started_at: (row?.started_at as string | undefined) ?? null,
  };
}

export async function markWebhookConnected(): Promise<void> {
  await getPool().query("UPDATE giveaway_session SET webhook_connected = 1 WHERE id = 1");
}

export async function getGiveawayEntries(): Promise<GiveawayEntry[]> {
  const [rows] = await getPool().query<RowDataPacket[]>(
    "SELECT username, avatar_url, is_subscriber, message_count FROM giveaway_entries ORDER BY created_at ASC"
  );
  return rows.map((row) => ({
    username: row.username as string,
    avatarUrl: (row.avatar_url as string | null) ?? null,
    isSubscriber: Boolean(row.is_subscriber),
    messageCount: row.message_count as number,
  }));
}

export async function getGiveawayWinners(): Promise<GiveawayWinner[]> {
  const [rows] = await getPool().query<RowDataPacket[]>(
    "SELECT username, avatar_url, message_count FROM giveaway_winners ORDER BY won_at ASC"
  );
  return rows.map((row) => ({
    username: row.username as string,
    avatarUrl: (row.avatar_url as string | null) ?? null,
    messageCount: row.message_count as number,
  }));
}

// Fresh session each time — clears whatever the previous session collected,
// both entries and any winners already drawn.
export async function startGiveawaySession(opts: {
  keyword: string;
  winnerCount: number;
  subscribersOnly: boolean;
  activeOnly: boolean;
}): Promise<void> {
  const pool = getPool();
  await pool.query("DELETE FROM giveaway_entries");
  await pool.query("DELETE FROM giveaway_winners");
  await pool.query(
    `UPDATE giveaway_session
     SET active = 1, keyword = ?, winner_count = ?, subscribers_only = ?, active_only = ?, started_at = CURRENT_TIMESTAMP
     WHERE id = 1`,
    [opts.keyword, opts.winnerCount, opts.subscribersOnly ? 1 : 0, opts.activeOnly ? 1 : 0]
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
// already won this session (optionally restricted to subscribers and/or to
// entrants who cleared the chat-activity threshold) and records them in
// giveaway_winners. Shuffled in JS, not SQL ORDER BY RAND() — fine at this
// scale (a chat giveaway's entrant count, not a table scan) and keeps the
// randomness source obvious.
export async function drawGiveawayWinners(
  count: number,
  subscribersOnly: boolean,
  activeOnly: boolean
): Promise<GiveawayWinner[]> {
  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT e.username, e.avatar_url, e.message_count FROM giveaway_entries e
     WHERE e.username NOT IN (SELECT username FROM giveaway_winners)
       ${subscribersOnly ? "AND e.is_subscriber = 1" : ""}
       ${activeOnly ? `AND e.message_count >= ${ACTIVE_MESSAGE_THRESHOLD}` : ""}`
  );
  const candidates: GiveawayWinner[] = rows.map((r) => ({
    username: r.username as string,
    avatarUrl: (r.avatar_url as string | null) ?? null,
    messageCount: r.message_count as number,
  }));

  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  const picked = candidates.slice(0, count);

  if (picked.length > 0) {
    await pool.query("INSERT INTO giveaway_winners (username, avatar_url, message_count) VALUES ?", [
      picked.map((p) => [p.username, p.avatarUrl, p.messageCount]),
    ]);
  }
  return picked;
}

// Called from the webhook handler for every chat message. Never throws —
// a non-2xx response makes Kick retry the delivery, and a bad message
// shouldn't be able to wedge the webhook. Silently no-ops when there's no
// active session.
//
// Every message from an already-entered user bumps message_count, whether
// or not it matches the keyword — this is what lets the admin see how
// engaged a winner actually was, not just that they typed the entry line
// once. A message that itself matches the keyword either creates the entry
// (starting count at 1) or, for a repeat entrant, still counts as activity.
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
  const matchesKeyword = Boolean(keyword) && normalized.startsWith(keyword);

  if (matchesKeyword) {
    await getPool().query(
      `INSERT INTO giveaway_entries (username, avatar_url, is_subscriber, message_count) VALUES (?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE avatar_url = VALUES(avatar_url), is_subscriber = VALUES(is_subscriber), message_count = message_count + 1`,
      [username, avatarUrl, isSubscriber ? 1 : 0]
    );
  } else {
    await getPool().query(
      "UPDATE giveaway_entries SET message_count = message_count + 1, avatar_url = ? WHERE username = ?",
      [avatarUrl, username]
    );
  }
}
