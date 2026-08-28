-- Kick-chat auto-entry for the Winner Roller. Admin starts a session with a
-- keyword; viewers who type it in the streamer's Kick chat get added here
-- via the chat.message.sent webhook (app/api/webhooks/kick/chat/route.ts).
-- Same "one live thing" singleton pattern as bonus_hunt / tournament.
USE wager_leaderboard;

CREATE TABLE IF NOT EXISTS giveaway_session (
  id TINYINT PRIMARY KEY DEFAULT 1,
  active TINYINT(1) NOT NULL DEFAULT 0,
  keyword VARCHAR(64) NOT NULL DEFAULT '!giveaway',
  started_at TIMESTAMP NULL,
  CONSTRAINT giveaway_session_singleton CHECK (id = 1)
);

INSERT IGNORE INTO giveaway_session (id) VALUES (1);

-- Cleared and repopulated on every new session (see startGiveawaySession).
-- UNIQUE on username so a viewer spamming the keyword only counts once.
CREATE TABLE IF NOT EXISTS giveaway_entries (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY giveaway_entries_username (username)
);
