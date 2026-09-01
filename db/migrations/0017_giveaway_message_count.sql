-- Tracks how many chat messages each entrant sent while the giveaway was
-- active (not just their qualifying keyword message), so the admin can see
-- whether a winner was genuinely chatting or only sent the one entry line.
-- Carried over into giveaway_winners at draw time so the history survives
-- the next session's reset (which clears giveaway_entries).
USE wager_leaderboard;

ALTER TABLE giveaway_entries
  ADD COLUMN message_count INT NOT NULL DEFAULT 1 AFTER is_subscriber;

ALTER TABLE giveaway_winners
  ADD COLUMN message_count INT NOT NULL DEFAULT 0 AFTER avatar_url;
