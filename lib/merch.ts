import "server-only";
import type { RowDataPacket } from "mysql2";
import { getPool } from "./db";
import type { SyncedProduct, SyncedCollection } from "./shopify";

export interface MerchCategory {
  id: number;
  name: string;
  handle: string;
  image_url: string | null;
  position: number;
}

export interface MerchItem {
  id: number;
  name: string;
  price: string;
  image_url: string | null;
  buy_url: string | null;
  position: number;
  active: boolean;
  category_id: number | null;
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
    category_id: row.category_id,
  };
}

function toCategory(row: RowDataPacket): MerchCategory {
  return {
    id: row.id,
    name: row.name,
    handle: row.handle,
    image_url: row.image_url,
    position: row.position,
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

export async function getMerchCategories(): Promise<MerchCategory[]> {
  const [rows] = await getPool().query<RowDataPacket[]>(
    "SELECT * FROM merch_categories ORDER BY position ASC, id ASC"
  );
  return rows.map(toCategory);
}

export async function setMerchItemActive(id: number, active: boolean): Promise<void> {
  await getPool().query("UPDATE merch_items SET active = ? WHERE id = ?", [active, id]);
}

// --- Shopify connection (singleton row, same pattern as `bonus_hunt`) ---

export interface ShopifyConnection {
  shop_domain: string;
  access_token: string;
  scope: string;
  connected_at: string;
}

export async function getShopifyConnection(): Promise<ShopifyConnection | null> {
  const [rows] = await getPool().query<RowDataPacket[]>(
    "SELECT shop_domain, access_token, scope, connected_at FROM shopify_connection WHERE id = 1"
  );
  return (rows[0] as ShopifyConnection) ?? null;
}

export async function saveShopifyConnection(input: {
  shop_domain: string;
  access_token: string;
  scope: string;
}): Promise<void> {
  await getPool().query(
    `INSERT INTO shopify_connection (id, shop_domain, access_token, scope)
     VALUES (1, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       shop_domain = VALUES(shop_domain),
       access_token = VALUES(access_token),
       scope = VALUES(scope),
       connected_at = CURRENT_TIMESTAMP`,
    [input.shop_domain, input.access_token, input.scope]
  );
}

// --- Sync log ---

export interface ShopifySyncLogEntry {
  fetched_at: string;
  status: "success" | "failure";
  error_message: string | null;
  items_synced: number | null;
}

export async function writeShopifySyncLog(entry: {
  status: "success" | "failure";
  error_message: string | null;
  items_synced: number | null;
}): Promise<void> {
  await getPool().query(
    `INSERT INTO shopify_sync_log (status, error_message, items_synced)
     VALUES (?, ?, ?)`,
    [entry.status, entry.error_message, entry.items_synced]
  );
}

export async function getLastShopifySyncLog(): Promise<ShopifySyncLogEntry | null> {
  const [rows] = await getPool().query<RowDataPacket[]>(
    "SELECT * FROM shopify_sync_log ORDER BY fetched_at DESC LIMIT 1"
  );
  return (rows[0] as ShopifySyncLogEntry) ?? null;
}

// --- Sync: pull Shopify's catalog into merch_items / merch_categories.
// Never touches rows this sync doesn't own (shopify_product_id IS NULL),
// and on any error the caller keeps whatever was last synced successfully
// (see app/api/admin/shopify/sync/route.ts) — same "stale beats empty"
// rule as the Rainbet cron (CLAUDE.md golden rule 4).

export async function upsertShopifyCategories(
  collections: SyncedCollection[]
): Promise<void> {
  if (collections.length === 0) return;

  const values = collections.map((c, i) => [
    c.shopifyId,
    c.name,
    c.handle,
    c.imageUrl,
    i,
  ]);

  await getPool().query(
    `INSERT INTO merch_categories (shopify_collection_id, name, handle, image_url, position)
     VALUES ?
     ON DUPLICATE KEY UPDATE
       name = VALUES(name),
       handle = VALUES(handle),
       image_url = VALUES(image_url),
       position = VALUES(position)`,
    [values]
  );
}

/** shopify_collection_id -> our merch_categories.id, for linking synced products. */
export async function getCategoryIdMap(): Promise<Map<string, number>> {
  const [rows] = await getPool().query<RowDataPacket[]>(
    "SELECT shopify_collection_id, id FROM merch_categories"
  );
  return new Map(rows.map((r) => [r.shopify_collection_id as string, r.id as number]));
}

export async function upsertShopifyProducts(
  products: SyncedProduct[],
  categoryIdMap: Map<string, number>
): Promise<void> {
  if (products.length === 0) return;

  const values = products.map((p, i) => [
    p.shopifyId,
    p.name,
    p.handle,
    p.price,
    p.imageUrl,
    p.buyUrl,
    p.categoryShopifyId ? (categoryIdMap.get(p.categoryShopifyId) ?? null) : null,
    i,
  ]);

  await getPool().query(
    `INSERT INTO merch_items (shopify_product_id, name, handle, price, image_url, buy_url, category_id, position, active)
     VALUES ${values.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, 1)").join(", ")}
     ON DUPLICATE KEY UPDATE
       name = VALUES(name),
       handle = VALUES(handle),
       price = VALUES(price),
       image_url = VALUES(image_url),
       buy_url = VALUES(buy_url),
       category_id = VALUES(category_id),
       position = VALUES(position),
       active = 1`,
    values.flat()
  );

  // Anything Shopify no longer returns (unpublished/deleted there) drops
  // off the public page — soft-hidden, never deleted.
  const currentIds = products.map((p) => p.shopifyId);
  await getPool().query(
    `UPDATE merch_items SET active = 0
     WHERE shopify_product_id IS NOT NULL AND shopify_product_id NOT IN (?)`,
    [currentIds.length > 0 ? currentIds : [""]]
  );
}
