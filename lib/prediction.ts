import "server-only";
import type { RowDataPacket } from "mysql2";
import { getPool } from "./db";

export interface PredictionEntry {
  id: number;
  slot_name: string;
  provider: string | null;
  image_url: string | null;
  bet: string;
}

export interface PredictionGuess {
  username: string;
  guess: string;
}

export interface ResolvedRound {
  id: number;
  slot_name: string;
  image_url: string | null;
  payout: string;
  winner: string | null;
  winnerGuess: string | null;
  guessCount: number;
}

export async function getActivePredictionEntryId(): Promise<number | null> {
  const [rows] = await getPool().query<RowDataPacket[]>(
    "SELECT bonus_entry_id FROM prediction_round WHERE id = 1"
  );
  return (rows[0]?.bonus_entry_id as number | null) ?? null;
}

export async function getActivePredictionEntry(): Promise<PredictionEntry | null> {
  const entryId = await getActivePredictionEntryId();
  if (!entryId) return null;

  const [rows] = await getPool().query<RowDataPacket[]>(
    "SELECT id, slot_name, provider, image_url, bet FROM bonus_hunt_entries WHERE id = ?",
    [entryId]
  );
  return (rows[0] as PredictionEntry | undefined) ?? null;
}

// Fresh round: clears any leftover guesses on this entry first, so
// clicking "Start guessing" twice on the same row doesn't carry over
// stale data.
export async function setActivePrediction(entryId: number): Promise<void> {
  const pool = getPool();
  await pool.query("DELETE FROM prediction_guesses WHERE bonus_entry_id = ?", [entryId]);
  await pool.query("UPDATE prediction_round SET bonus_entry_id = ? WHERE id = 1", [entryId]);
}

export async function clearActivePrediction(): Promise<void> {
  await getPool().query("UPDATE prediction_round SET bonus_entry_id = NULL WHERE id = 1");
}

// Called when a bonus hunt entry's payout is set (see the "payout" action
// in app/api/admin/bonus-hunt/route.ts) — if that entry was the active
// round, close it out. The entry's own `payout` column is what makes it
// show up in getPredictionHistory below; nothing else to persist here.
export async function clearActivePredictionIfMatches(entryId: number): Promise<void> {
  await getPool().query(
    "UPDATE prediction_round SET bonus_entry_id = NULL WHERE id = 1 AND bonus_entry_id = ?",
    [entryId]
  );
}

export async function getPredictionGuesses(entryId: number): Promise<PredictionGuess[]> {
  const [rows] = await getPool().query<RowDataPacket[]>(
    "SELECT username, guess FROM prediction_guesses WHERE bonus_entry_id = ? ORDER BY created_at ASC",
    [entryId]
  );
  return rows as PredictionGuess[];
}

// Past rounds: any opened bonus_hunt_entries row that had at least one
// guess. Winner is whoever's guess has the smallest absolute distance to
// the real payout — computed on read, not stored, so it can't drift out of
// sync with the entry's payout.
export async function getPredictionHistory(limit = 10): Promise<ResolvedRound[]> {
  const [rows] = await getPool().query<RowDataPacket[]>(
    `SELECT
       e.id, e.slot_name, e.image_url, e.payout,
       (SELECT g.username FROM prediction_guesses g
        WHERE g.bonus_entry_id = e.id
        ORDER BY ABS(g.guess - e.payout) ASC, g.created_at ASC LIMIT 1) AS winner,
       (SELECT g.guess FROM prediction_guesses g
        WHERE g.bonus_entry_id = e.id
        ORDER BY ABS(g.guess - e.payout) ASC, g.created_at ASC LIMIT 1) AS winnerGuess,
       (SELECT COUNT(*) FROM prediction_guesses g WHERE g.bonus_entry_id = e.id) AS guessCount
     FROM bonus_hunt_entries e
     WHERE e.payout IS NOT NULL
       AND EXISTS (SELECT 1 FROM prediction_guesses g WHERE g.bonus_entry_id = e.id)
     ORDER BY e.id DESC
     LIMIT ?`,
    [limit]
  );
  return rows as ResolvedRound[];
}

// Called from the webhook handler for every chat message — mirrors
// recordGiveawayEntryIfMatches in lib/giveawaySession.ts. Never throws, and
// silently no-ops when there's no active round or the message doesn't match
// the "!gb <amount>" pattern.
export async function recordPredictionGuessIfActive(username: string, content: string): Promise<void> {
  const match = content.trim().match(/^!gb\s+\$?(\d+(?:\.\d+)?)/i);
  if (!match) return;

  const activeEntryId = await getActivePredictionEntryId();
  if (!activeEntryId) return;

  await getPool().query(
    `INSERT INTO prediction_guesses (bonus_entry_id, username, guess) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE guess = VALUES(guess)`,
    [activeEntryId, username, match[1]]
  );
}
