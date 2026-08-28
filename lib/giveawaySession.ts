import "server-only";
import type { RowDataPacket } from "mysql2";
import { getPool } from "./db";

export interface GiveawaySession {
  active: boolean;
  keyword: string;
  webhookConnected: boolean;
  started_at: string | null;
}

export async function getGiveawaySession(): Promise<GiveawaySession> {
  const [rows] = await getPool().query<RowDataPacket[]>(
    "SELECT active, keyword, webhook_connected, started_at FROM giveaway_session WHERE id = 1"
  );
  const row = rows[0];
  return {
    active: Boolean(row?.active),
    keyword: (row?.keyword as string | undefined) ?? "!giveaway",
    webhookConnected: Boolean(row?.webhook_connected),
    started_at: (row?.started_at as string | undefined) ?? null,
  };
}

export async function markWebhookConnected(): Promise<void> {
  await getPool().query("UPDATE giveaway_session SET webhook_connected = 1 WHERE id = 1");
}

export async function getGiveawayEntries(): Promise<string[]> {
  const [rows] = await getPool().query<RowDataPacket[]>(
    "SELECT username FROM giveaway_entries ORDER BY created_at ASC"
  );
  return rows.map((row) => row.username as string);
}

// Fresh session each time — clears whatever the previous session collected.
export async function startGiveawaySession(keyword: string): Promise<void> {
  const pool = getPool();
  await pool.query("DELETE FROM giveaway_entries");
  await pool.query(
    "UPDATE giveaway_session SET active = 1, keyword = ?, started_at = CURRENT_TIMESTAMP WHERE id = 1",
    [keyword]
  );
}

export async function stopGiveawaySession(): Promise<void> {
  await getPool().query("UPDATE giveaway_session SET active = 0 WHERE id = 1");
}

// Called from the webhook handler for every chat message. Never throws —
// a non-2xx response makes Kick retry the delivery, and a bad message
// shouldn't be able to wedge the webhook. Silently no-ops when there's no
// active session or the message doesn't match the keyword.
export async function recordGiveawayEntryIfMatches(username: string, content: string): Promise<void> {
  const session = await getGiveawaySession();
  if (!session.active) return;

  const normalized = content.trim().toLowerCase();
  const keyword = session.keyword.trim().toLowerCase();
  if (!keyword || !normalized.startsWith(keyword)) return;

  await getPool().query("INSERT IGNORE INTO giveaway_entries (username) VALUES (?)", [username]);
}
