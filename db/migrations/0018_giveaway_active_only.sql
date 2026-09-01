-- "Active only" draw filter, alongside the existing subscribers-only one —
-- restricts the winner pool to entrants who cleared the chat-activity
-- threshold (see lib/giveawayConstants.ts), not just people who typed the
-- keyword once.
USE wager_leaderboard;

ALTER TABLE giveaway_session
  ADD COLUMN active_only TINYINT(1) NOT NULL DEFAULT 0 AFTER subscribers_only;
