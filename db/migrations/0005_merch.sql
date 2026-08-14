-- Merch/support section, backed by Printful once a real key is wired in.
-- For now these are placeholder products managed from /admin/merch — swap
-- buy_url/image_url for real Printful product links when available.
USE wager_leaderboard;

CREATE TABLE IF NOT EXISTS merch_items (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  image_url VARCHAR(500),
  buy_url VARCHAR(500),
  position INT NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO merch_items (name, price, image_url, buy_url, position) VALUES
  ('JBALLIN Hoodie', 45.00, NULL, NULL, 0),
  ('JBALLIN Tee', 25.00, NULL, NULL, 1),
  ('JBALLIN Snapback', 30.00, NULL, NULL, 2);
