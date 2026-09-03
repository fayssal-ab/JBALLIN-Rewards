import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";
import { fetchActiveProducts, fetchCollections, fetchCollectionProductIds } from "@/lib/shopify";
import {
  getShopifyConnection,
  upsertShopifyProducts,
  upsertShopifyCategories,
  getCategoryIdMap,
  writeShopifySyncLog,
} from "@/lib/merch";

// Admin-triggered pull of the live Shopify catalog. On any failure the
// existing merch_items/merch_categories rows are left exactly as they
// were — same "stale beats empty" rule as the Rainbet cron (CLAUDE.md
// golden rule 4), just triggered by a button instead of a schedule since
// there's no live leaderboard-style urgency here.
export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const connection = await getShopifyConnection();
  if (!connection) {
    return NextResponse.json({ error: "not_connected" }, { status: 400 });
  }

  try {
    const [products, collections] = await Promise.all([
      fetchActiveProducts(connection.shop_domain, connection.access_token),
      fetchCollections(connection.shop_domain, connection.access_token),
    ]);

    await upsertShopifyCategories(collections);

    // Map each product to the first collection that contains it, so the
    // store page can group/filter by category.
    const productToCollection = new Map<string, string>();
    const membershipLists = await Promise.all(
      collections.map((c) =>
        fetchCollectionProductIds(connection.shop_domain, connection.access_token, c.shopifyId)
      )
    );
    collections.forEach((c, i) => {
      for (const productId of membershipLists[i]) {
        if (!productToCollection.has(productId)) {
          productToCollection.set(productId, c.shopifyId);
        }
      }
    });
    const productsWithCategory = products.map((p) => ({
      ...p,
      categoryShopifyId: productToCollection.get(p.shopifyId) ?? null,
    }));

    const categoryIdMap = await getCategoryIdMap();
    await upsertShopifyProducts(productsWithCategory, categoryIdMap);
    await writeShopifySyncLog({
      status: "success",
      error_message: null,
      items_synced: products.length,
    });

    return NextResponse.json({ status: "success", items_synced: products.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    await writeShopifySyncLog({
      status: "failure",
      error_message: message.slice(0, 500),
      items_synced: null,
    });
    return NextResponse.json({ status: "failure", error: message }, { status: 502 });
  }
}
