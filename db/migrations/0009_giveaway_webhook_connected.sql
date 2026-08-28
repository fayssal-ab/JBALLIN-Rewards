-- Tracks whether the one-time Kick webhook subscription has already been
-- made, so "Start listening" can auto-connect on the first use without
-- re-subscribing (and burning into Kick's subscription limit) every session.
USE wager_leaderboard;

ALTER TABLE giveaway_session
  ADD COLUMN webhook_connected TINYINT(1) NOT NULL DEFAULT 0 AFTER keyword;
