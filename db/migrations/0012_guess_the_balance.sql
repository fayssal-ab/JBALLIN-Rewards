-- Replaces the per-slot prediction design (0011) with a whole-hunt "Guess
-- the Balance" game, matching codeivanb.com/guessthebalance: one round per
-- bonus hunt, viewers guess the hunt's FINAL balance (starting balance +
-- total payout) via "!gb <amount>" in Kick chat, closest guess once every
-- entry has a payout wins. The old tables never held real guesses (checked
-- live before dropping), so this is a clean replacement, not a migration
-- of data.
USE wager_leaderboard;

DROP TABLE IF EXISTS prediction_guesses;
DROP TABLE IF EXISTS prediction_round;

CREATE TABLE IF NOT EXISTS guess_balance_round (
  id TINYINT PRIMARY KEY DEFAULT 1,
  active TINYINT(1) NOT NULL DEFAULT 0,
  started_at TIMESTAMP NULL,
  CONSTRAINT guess_balance_round_singleton CHECK (id = 1)
);

INSERT IGNORE INTO guess_balance_round (id) VALUES (1);

-- One guess per person — re-guessing updates it (last one counts).
CREATE TABLE IF NOT EXISTS guess_balance_guesses (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  guess DECIMAL(20,8) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY guess_balance_guesses_username (username)
);
