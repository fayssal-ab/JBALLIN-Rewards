import "server-only";
import type { RowDataPacket } from "mysql2";
import { getPool } from "./db";
import { getBonusHunt } from "./bonusHunt";

export interface GuessBalanceRound {
  active: boolean;
  started_at: string | null;
}

export interface BalanceGuess {
  username: string;
  guess: string;
}

export interface RankedGuess extends BalanceGuess {
  offBy: number;
  rank: number;
}

export interface FinalBalanceResult {
  finalBalance: number;
  ranked: RankedGuess[];
}

export async function getGuessBalanceRound(): Promise<GuessBalanceRound> {
  const [rows] = await getPool().query<RowDataPacket[]>(
    "SELECT active, started_at FROM guess_balance_round WHERE id = 1"
  );
  const row = rows[0];
  return {
    active: Boolean(row?.active),
    started_at: (row?.started_at as string | undefined) ?? null,
  };
}

// Fresh round — clears whatever the previous hunt's guesses were.
export async function startGuessBalanceRound(): Promise<void> {
  const pool = getPool();
  await pool.query("DELETE FROM guess_balance_guesses");
  await pool.query(
    "UPDATE guess_balance_round SET active = 1, started_at = CURRENT_TIMESTAMP WHERE id = 1"
  );
}

export async function stopGuessBalanceRound(): Promise<void> {
  await getPool().query("UPDATE guess_balance_round SET active = 0 WHERE id = 1");
}

export async function clearGuessBalanceGuesses(): Promise<void> {
  await getPool().query("DELETE FROM guess_balance_guesses");
}

export async function getBalanceGuesses(): Promise<BalanceGuess[]> {
  const [rows] = await getPool().query<RowDataPacket[]>(
    "SELECT username, guess FROM guess_balance_guesses ORDER BY created_at ASC"
  );
  return rows as BalanceGuess[];
}

// Called from the webhook handler for every chat message — never throws,
// and silently no-ops on garbage input (anything that doesn't match
// "!gb <number>") or when no round is open.
export async function recordBalanceGuessIfActive(username: string, content: string): Promise<void> {
  const match = content.trim().match(/^!gb\s+\$?(\d+(?:\.\d+)?)/i);
  if (!match) return;

  const round = await getGuessBalanceRound();
  if (!round.active) return;

  await getPool().query(
    `INSERT INTO guess_balance_guesses (username, guess) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE guess = VALUES(guess)`,
    [username, match[1]]
  );
}

// The hunt is "finished" once every collected entry has a payout — that's
// the moment the real final balance exists and guesses can be ranked. Not
// gated on the round's active flag: even if the admin never clicks "Stop",
// finishing the hunt itself resolves the round.
export async function getFinalBalanceIfHuntComplete(): Promise<FinalBalanceResult | null> {
  const { startingBalance, entries } = await getBonusHunt();
  if (entries.length === 0 || entries.some((e) => e.payout === null)) return null;

  const totalPayout = entries.reduce((sum, e) => sum + Number(e.payout), 0);
  const finalBalance = Number(startingBalance) + totalPayout;

  const guesses = await getBalanceGuesses();
  const ranked = guesses
    .map((g) => ({ ...g, offBy: Math.abs(Number(g.guess) - finalBalance) }))
    .sort((a, b) => a.offBy - b.offBy)
    .map((g, i) => ({ ...g, rank: i + 1 }));

  return { finalBalance, ranked };
}
