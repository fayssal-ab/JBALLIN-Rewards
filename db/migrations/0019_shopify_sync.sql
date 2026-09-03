-- Real Shopify integration for the store. Products/collections are pulled
-- in by an admin-triggered sync (app/api/admin/shopify/sync), not entered
-- by hand — /admin/merch becomes a read-only sync status view. See
-- lib/shopify.ts and CLAUDE.md's merch_items entry.
USE wager_leaderboard;

ALTER TABLE merch_items
  ADD COLUMN shopify_product_id VARCHAR(64) NULL AFTER id,
  ADD COLUMN handle VARCHAR(255) NULL AFTER name,
  ADD COLUMN category_id BIGINT NULL AFTER position,
  ADD UNIQUE KEY merch_items_shopify_product (shopify_product_id);

-- The old hand-entered placeholder/test rows (no shopify_product_id) drop
-- off the public page now that real data takes over — soft-hidden, not
-- deleted, same "never destroy data" spirit as the rest of the app.
UPDATE merch_items SET active = 0 WHERE shopify_product_id IS NULL;

CREATE TABLE IF NOT EXISTS merch_categories (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  shopify_collection_id VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  handle VARCHAR(255) NOT NULL,
  image_url VARCHAR(500),
  position INT NOT NULL DEFAULT 0,
  UNIQUE KEY merch_categories_shopify_collection (shopify_collection_id)
);

ALTER TABLE merch_items
  ADD CONSTRAINT merch_items_category_fk FOREIGN KEY (category_id)
    REFERENCES merch_categories (id) ON DELETE SET NULL;

-- Singleton, same pattern as `bonus_hunt`: one store, one Shopify
-- connection. access_token is server-only, never sent to the browser.
CREATE TABLE IF NOT EXISTS shopify_connection (
  id TINYINT PRIMARY KEY DEFAULT 1,
  shop_domain VARCHAR(255) NOT NULL,
  access_token VARCHAR(255) NOT NULL,
  scope VARCHAR(255) NOT NULL,
  connected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT shopify_connection_singleton CHECK (id = 1)
);

CREATE TABLE IF NOT EXISTS shopify_sync_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  fetched_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status ENUM('success', 'failure') NOT NULL,
  error_message VARCHAR(500),
  items_synced INT,
  KEY shopify_sync_log_fetched_at (fetched_at DESC)
);
