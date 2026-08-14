import "server-only";
import type { RowDataPacket } from "mysql2";
import { getPool } from "./db";

export interface MerchItem {
  id: number;
  name: string;
  price: string;
  image_url: string | null;
  buy_url: string | null;
  position: number;
  active: boolean;
}

function toMerchItem(row: RowDataPacket): MerchItem {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    image_url: row.image_url,
    buy_url: row.buy_url,
    position: row.position,
    active: Boolean(row.active),
  };
}

export async function getActiveMerchItems(): Promise<MerchItem[]> {
  const [rows] = await getPool().query<RowDataPacket[]>(
    "SELECT * FROM merch_items WHERE active = 1 ORDER BY position ASC, id ASC"
  );
  return rows.map(toMerchItem);
}

export async function getAllMerchItems(): Promise<MerchItem[]> {
  const [rows] = await getPool().query<RowDataPacket[]>(
    "SELECT * FROM merch_items ORDER BY position ASC, id ASC"
  );
  return rows.map(toMerchItem);
}

export interface MerchItemInput {
  name: string;
  price: string;
  image_url: string | null;
  buy_url: string | null;
}

export async function addMerchItem(input: MerchItemInput): Promise<void> {
  const [rows] = await getPool().query<RowDataPacket[]>(
    "SELECT COALESCE(MAX(position), -1) + 1 AS next_position FROM merch_items"
  );
  const position = rows[0].next_position as number;
  await getPool().query(
    "INSERT INTO merch_items (name, price, image_url, buy_url, position) VALUES (?, ?, ?, ?, ?)",
    [input.name, input.price, input.image_url, input.buy_url, position]
  );
}

export async function updateMerchItem(id: number, input: MerchItemInput): Promise<void> {
  await getPool().query(
    "UPDATE merch_items SET name = ?, price = ?, image_url = ?, buy_url = ? WHERE id = ?",
    [input.name, input.price, input.image_url, input.buy_url, id]
  );
}

export async function setMerchItemActive(id: number, active: boolean): Promise<void> {
  await getPool().query("UPDATE merch_items SET active = ? WHERE id = ?", [active, id]);
}

export async function deleteMerchItem(id: number): Promise<void> {
  await getPool().query("DELETE FROM merch_items WHERE id = ?", [id]);
}
