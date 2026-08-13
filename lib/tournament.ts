import "server-only";
import type { RowDataPacket } from "mysql2";
import { getPool } from "./db";

export const ROUND_SIZES = { 1: 8, 2: 4, 3: 2 } as const;
export type Round = keyof typeof ROUND_SIZES;

/** slots[round][index] -> name, or null if empty/TBD. */
export type TournamentSlots = Record<number, Record<number, string | null>>;

export async function getTournamentSlots(): Promise<TournamentSlots> {
  const [rows] = await getPool().query<RowDataPacket[]>(
    "SELECT round, slot_index, name FROM tournament_slots"
  );

  const slots: TournamentSlots = { 1: {}, 2: {}, 3: {} };
  for (const row of rows) {
    slots[row.round as number][row.slot_index as number] = row.name as string | null;
  }
  return slots;
}

export async function setTournamentSlot(
  round: Round,
  slotIndex: number,
  name: string | null
): Promise<void> {
  if (slotIndex < 0 || slotIndex >= ROUND_SIZES[round]) {
    throw new Error(`slot_index ${slotIndex} out of range for round ${round}`);
  }

  await getPool().query(
    `INSERT INTO tournament_slots (round, slot_index, name)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE name = VALUES(name)`,
    [round, slotIndex, name]
  );
}

export async function resetTournament(): Promise<void> {
  await getPool().query("DELETE FROM tournament_slots");
}
