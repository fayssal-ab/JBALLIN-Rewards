-- Avatars + subscriber status (both available on the Kick chat.message.sent
-- payload's sender object), configurable winner count / subscribers-only,
-- and a persisted winners table so drawn winners survive a page refresh and
-- can't be redrawn within the same session.
USE wager_leaderboard;

ALTER TABLE giveaway_entries
  ADD COLUMN avatar_url VARCHAR(500) NULL AFTER username,
  ADD COLUMN is_subscriber TINYINT(1) NOT NULL DEFAULT 0 AFTER avatar_url;

ALTER TABLE giveaway_session
  ADD COLUMN winner_count INT NOT NULL DEFAULT 1 AFTER keyword,
  ADD COLUMN subscribers_only TINYINT(1) NOT NULL DEFAULT 0 AFTER winner_count;

CREATE TABLE IF NOT EXISTS giveaway_winners (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500) NULL,
  won_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
