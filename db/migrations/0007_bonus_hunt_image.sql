-- Optional slot thumbnail per bonus hunt entry. slot.report's API has no
-- image field (checked live response — name/provider/rtp/etc only, no
-- artwork), so this is admin-pasted, same pattern as merch_items.image_url.
USE wager_leaderboard;

ALTER TABLE bonus_hunt_entries
  ADD COLUMN image_url VARCHAR(500) NULL AFTER provider;
