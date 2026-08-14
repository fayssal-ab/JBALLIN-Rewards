-- Winner prize for the tournament bracket, same singleton pattern as
-- bonus_hunt. Champion is modeled as round 4 (a single slot) in
-- tournament_slots so it reuses the exact same editable-box UI as every
-- other bracket position.

USE wager_leaderboard;

CREATE TABLE IF NOT EXISTS tournament (
  id TINYINT PRIMARY KEY DEFAULT 1,
  prize DECIMAL(20, 8) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT tournament_singleton CHECK (id = 1)
);

INSERT IGNORE INTO tournament (id, prize) VALUES (1, 0);
