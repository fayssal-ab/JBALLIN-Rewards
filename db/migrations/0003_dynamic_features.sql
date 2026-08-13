-- Bonus Hunt and Tournament bracket, both admin-editable via ADMIN_PASSWORD
-- (see lib/admin.ts, app/api/admin/*). Single ongoing hunt/bracket at a
-- time — same "one live thing" simplicity as `periods`.

USE wager_leaderboard;

CREATE TABLE IF NOT EXISTS bonus_hunt (
  id TINYINT PRIMARY KEY DEFAULT 1,
  starting_balance DECIMAL(20, 8) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT bonus_hunt_singleton CHECK (id = 1)
);

INSERT IGNORE INTO bonus_hunt (id, starting_balance) VALUES (1, 0);

CREATE TABLE IF NOT EXISTS bonus_hunt_entries (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  position INT NOT NULL,
  slot_name VARCHAR(255) NOT NULL,
  provider VARCHAR(255),
  bet DECIMAL(20, 8) NOT NULL,
  payout DECIMAL(20, 8) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY bonus_hunt_entries_position (position)
);

-- 15 boxes total for an 8-slot single-elimination bracket:
-- round 1 = Round of 8 (slot_index 0-7), round 2 = Semifinals (0-3),
-- round 3 = Final (0-1). Rows are created on demand by the admin API, not
-- pre-seeded — a missing (round, slot_index) just means "TBD" in the UI.
CREATE TABLE IF NOT EXISTS tournament_slots (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  round TINYINT NOT NULL,
  slot_index TINYINT NOT NULL,
  name VARCHAR(255) NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY tournament_round_slot (round, slot_index)
);
