import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

// Server-only OAuth + Admin API client. SHOPIFY_CLIENT_SECRET must never
// reach a client component — it's what authenticates the token exchange
// and verifies that a callback request really came from Shopify.

const API_VERSION = "2026-07";
export const SHOPIFY_SCOPES = "read_products,read_collections";
export const OAUTH_STATE_COOKIE = "shopify_oauth_state";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

function shopDomain(): string {
  const shop = requiredEnv("SHOPIFY_SHOP_DOMAIN");
  return shop.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

export function redirectUri(): string {
  return "https://jballin.com/api/shopify/callback";
}

export function getAuthorizeUrl(state: string): string {
  const clientId = requiredEnv("SHOPIFY_CLIENT_ID");
  const url = new URL(`https://${shopDomain()}/admin/oauth/authorize`);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("scope", SHOPIFY_SCOPES);
  url.searchParams.set("redirect_uri", redirectUri());
  url.searchParams.set("state", state);
  return url.toString();
}

/**
 * Shopify's callback HMAC covers the raw query string (minus hmac/signature)
 * with keys sorted ascending, joined as received — not re-encoded. Verifying
 * this before trusting `code`/`shop` is what stops a forged callback request.
 */
export function verifyCallbackHmac(rawQuery: string): boolean {
  const params = new URLSearchParams(rawQuery);
  const hmac = params.get("hmac");
  if (!hmac) return false;

  const pairs = Array.from(new URLSearchParams(rawQuery).entries())
    .filter(([key]) => key !== "hmac" && key !== "signature");
  pairs.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const message = pairs.map(([key, value]) => `${key}=${value}`).join("&");

  const secret = requiredEnv("SHOPIFY_CLIENT_SECRET");
  const digest = createHmac("sha256", secret).update(message).digest("hex");

  const a = Buffer.from(digest);
  const b = Buffer.from(hmac);
  return a.length === b.length && timingSafeEqual(a, b);
}

export interface ShopifyTokenResult {
  access_token: string;
  scope: string;
}

export async function exchangeCodeForToken(
  shop: string,
  code: string
): Promise<ShopifyTokenResult> {
  const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: requiredEnv("SHOPIFY_CLIENT_ID"),
      client_secret: requiredEnv("SHOPIFY_CLIENT_SECRET"),
      code,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`token exchange failed: ${response.status}`);
  }

  return (await response.json()) as ShopifyTokenResult;
}

function adminApiUrl(shop: string, path: string): string {
  return `https://${shop}/admin/api/${API_VERSION}/${path}`;
}

interface ShopifyImage {
  src: string;
}

interface ShopifyVariant {
  price: string;
}

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  status: string;
  images: ShopifyImage[];
  variants: ShopifyVariant[];
}

interface ShopifyCollection {
  id: number;
  title: string;
  handle: string;
  image: ShopifyImage | null;
}

async function shopifyGet<T>(
  shop: string,
  accessToken: string,
  path: string
): Promise<T> {
  const response = await fetch(adminApiUrl(shop, path), {
    headers: { "X-Shopify-Access-Token": accessToken },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Shopify API ${path} failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

/** Follows the Link header's rel="next" cursor until pages run out. */
async function shopifyGetAllPages<T>(
  shop: string,
  accessToken: string,
  path: string,
  key: string
): Promise<T[]> {
  const results: T[] = [];
  let next = adminApiUrl(shop, path);

  while (next) {
    const response = await fetch(next, {
      headers: { "X-Shopify-Access-Token": accessToken },
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`Shopify API ${path} failed: ${response.status}`);
    }
    const body = (await response.json()) as Record<string, T[]>;
    results.push(...(body[key] ?? []));

    const link = response.headers.get("link");
    const nextMatch = link?.match(/<([^>]+)>;\s*rel="next"/);
    next = nextMatch ? nextMatch[1] : "";
  }

  return results;
}

// The store's real public-facing domain (see CLAUDE.md: TypeShit,
// Printful-fulfilled via Shopify). Product buy links point here, not at
// the *.myshopify.com admin domain.
const STOREFRONT_DOMAIN = "typeshit.net";

export interface SyncedProduct {
  shopifyId: string;
  name: string;
  handle: string;
  price: string;
  imageUrl: string | null;
  buyUrl: string;
  categoryShopifyId: string | null;
}

export async function fetchActiveProducts(
  shop: string,
  accessToken: string
): Promise<SyncedProduct[]> {
  const products = await shopifyGetAllPages<ShopifyProduct>(
    shop,
    accessToken,
    "products.json?limit=250&status=active",
    "products"
  );

  return products.map((p) => ({
    shopifyId: String(p.id),
    name: p.title,
    handle: p.handle,
    price: p.variants[0]?.price ?? "0.00",
    imageUrl: p.images[0]?.src ?? null,
    buyUrl: `https://${STOREFRONT_DOMAIN}/products/${p.handle}`,
    categoryShopifyId: null,
  }));
}

export interface SyncedCollection {
  shopifyId: string;
  name: string;
  handle: string;
  imageUrl: string | null;
}

export async function fetchCollections(
  shop: string,
  accessToken: string
): Promise<SyncedCollection[]> {
  const [custom, smart] = await Promise.all([
    shopifyGet<{ custom_collections: ShopifyCollection[] }>(
      shop,
      accessToken,
      "custom_collections.json?limit=250"
    ),
    shopifyGet<{ smart_collections: ShopifyCollection[] }>(
      shop,
      accessToken,
      "smart_collections.json?limit=250"
    ),
  ]);

  const all = [...custom.custom_collections, ...smart.smart_collections];
  return all.map((c) => ({
    shopifyId: String(c.id),
    name: c.title,
    handle: c.handle,
    imageUrl: c.image?.src ?? null,
  }));
}

/** Works for both custom and smart (rule-based) collections uniformly. */
export async function fetchCollectionProductIds(
  shop: string,
  accessToken: string,
  collectionId: string
): Promise<string[]> {
  const products = await shopifyGetAllPages<{ id: number }>(
    shop,
    accessToken,
    `collections/${collectionId}/products.json?limit=250&fields=id`,
    "products"
  );
  return products.map((p) => String(p.id));
}
