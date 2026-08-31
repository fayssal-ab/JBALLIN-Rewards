-- "Guess the Bonus" prediction game. Admin flags one bonus_hunt_entries row
-- as the live round; viewers guess its payout via "!gb <amount>" in Kick
-- chat (see app/api/webhooks/kick/chat/route.ts); closest guess once the
-- admin enters the real payout wins. Same singleton pattern as bonus_hunt.
USE wager_leaderboard;

CREATE TABLE IF NOT EXISTS prediction_round (
  id TINYINT PRIMARY KEY DEFAULT 1,
  bonus_entry_id BIGINT NULL,
  CONSTRAINT prediction_round_singleton CHECK (id = 1),
  CONSTRAINT prediction_round_entry_fk FOREIGN KEY (bonus_entry_id)
    REFERENCES bonus_hunt_entries (id) ON DELETE SET NULL
);

INSERT IGNORE INTO prediction_round (id, bonus_entry_id) VALUES (1, NULL);

-- One guess per person per round — re-guessing updates it rather than
-- adding a second row (ON DUPLICATE KEY UPDATE in recordPredictionGuessIfActive).
CREATE TABLE IF NOT EXISTS prediction_guesses (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  bonus_entry_id BIGINT NOT NULL,
  username VARCHAR(255) NOT NULL,
  guess DECIMAL(20,8) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY prediction_guesses_entry_user (bonus_entry_id, username),
  CONSTRAINT prediction_guesses_entry_fk FOREIGN KEY (bonus_entry_id)
    REFERENCES bonus_hunt_entries (id) ON DELETE CASCADE
);
