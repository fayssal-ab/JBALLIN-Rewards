import "server-only";
import type { RowDataPacket } from "mysql2";
import { getPool } from "./db";

export interface BonusHuntEntry {
  id: number;
  position: number;
  slot_name: string;
  provider: string | null;
  image_url: string | null;
  bet: string;
  payout: string | null;
}

export interface BonusHuntData {
  startingBalance: string;
  entries: BonusHuntEntry[];
}

export async function getBonusHunt(): Promise<BonusHuntData> {
  const pool = getPool();

  const [metaRows] = await pool.query<RowDataPacket[]>(
    "SELECT starting_balance FROM bonus_hunt WHERE id = 1"
  );
  const [entryRows] = await pool.query<RowDataPacket[]>(
    "SELECT id, position, slot_name, provider, image_url, bet, payout FROM bonus_hunt_entries ORDER BY position ASC"
  );

  return {
    startingBalance: (metaRows[0]?.starting_balance as string) ?? "0",
    entries: entryRows as BonusHuntEntry[],
  };
}

export async function setStartingBalance(amount: string): Promise<void> {
  await getPool().query("UPDATE bonus_hunt SET starting_balance = ? WHERE id = 1", [
    amount,
  ]);
}

export async function addBonusHuntEntry(input: {
  slotName: string;
  provider: string | null;
  imageUrl: string | null;
  bet: string;
}): Promise<void> {
  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT COALESCE(MAX(position), -1) + 1 AS nextPosition FROM bonus_hunt_entries"
  );
  const nextPosition = rows[0]?.nextPosition ?? 0;

  await pool.query(
    "INSERT INTO bonus_hunt_entries (position, slot_name, provider, image_url, bet) VALUES (?, ?, ?, ?, ?)",
    [nextPosition, input.slotName, input.provider, input.imageUrl, input.bet]
  );
}

export async function setBonusHuntPayout(
  id: number,
  payout: string | null
): Promise<void> {
  await getPool().query("UPDATE bonus_hunt_entries SET payout = ? WHERE id = ?", [
    payout,
    id,
  ]);
}

export async function deleteBonusHuntEntry(id: number): Promise<void> {
  await getPool().query("DELETE FROM bonus_hunt_entries WHERE id = ?", [id]);
}

export async function resetBonusHunt(): Promise<void> {
  const pool = getPool();
  await pool.query("DELETE FROM bonus_hunt_entries");
  await pool.query("UPDATE bonus_hunt SET starting_balance = 0 WHERE id = 1");
}
