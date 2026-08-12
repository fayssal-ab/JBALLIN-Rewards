-- Phase 1 schema: periods, live_entries, final_results, sync_log, blacklist.
-- See CLAUDE.md "Data model" and "Golden rules" for the constraints this encodes.
-- MySQL 8.0+ required (window functions, JSON_TABLE, CHECK constraints,
-- functional/generated-column indexes, SIGNAL in triggers).

CREATE DATABASE IF NOT EXISTS wager_leaderboard
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE wager_leaderboard;

CREATE TABLE IF NOT EXISTS periods (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  start_at DATE NOT NULL,
  end_at DATE NOT NULL,
  timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
  prize_pool DECIMAL(20,8) NOT NULL DEFAULT 0,
  prize_distribution JSON NOT NULL DEFAULT (JSON_ARRAY()),
  status ENUM('upcoming', 'live', 'closed') NOT NULL DEFAULT 'upcoming',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- MySQL has no partial/filtered unique index. This generated column is
  -- NULL for every non-live row, and MySQL unique indexes allow multiple
  -- NULLs, so only one 'live' row can ever exist.
  live_flag TINYINT GENERATED ALWAYS AS (CASE WHEN status = 'live' THEN 1 ELSE NULL END) STORED,
  CONSTRAINT periods_end_after_start CHECK (end_at >= start_at),
  UNIQUE KEY periods_one_live (live_flag)
);

CREATE TABLE IF NOT EXISTS blacklist (
  rainbet_id VARCHAR(64) PRIMARY KEY,
  reason VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Replaced wholesale on every successful sync. rainbet_id is the stable key
-- (usernames are not) per CLAUDE.md.
CREATE TABLE IF NOT EXISTS live_entries (
  period_id BIGINT NOT NULL,
  rainbet_id VARCHAR(64) NOT NULL,
  username VARCHAR(255) NOT NULL,
  wagered_amount DECIMAL(20,8) NOT NULL,
  -- Defaulted, then recomputed by recompute_live_ranks() after each sync
  -- (see 0002_procedures.sql) so ranking never happens via JS float math.
  `rank` INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (period_id, rainbet_id),
  KEY live_entries_period_rank (period_id, `rank`),
  CONSTRAINT live_entries_period_fk FOREIGN KEY (period_id) REFERENCES periods (id) ON DELETE CASCADE
);

-- Frozen once a period closes. Golden rule 5: never recompute from the API.
CREATE TABLE IF NOT EXISTS final_results (
  period_id BIGINT NOT NULL,
  rainbet_id VARCHAR(64) NOT NULL,
  username VARCHAR(255) NOT NULL,
  wagered_amount DECIMAL(20,8) NOT NULL,
  `rank` INT NOT NULL,
  prize DECIMAL(20,8) NOT NULL DEFAULT 0,
  frozen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (period_id, rainbet_id),
  -- Deliberately not CASCADE: InnoDB does not fire triggers for rows removed
  -- by a cascading FK action, so a CASCADE here would let `DELETE FROM
  -- periods` silently wipe frozen results, bypassing the immutability
  -- triggers below. RESTRICT forces that delete to fail loudly instead.
  CONSTRAINT final_results_period_fk FOREIGN KEY (period_id) REFERENCES periods (id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS sync_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  period_id BIGINT,
  fetched_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  cache_updated_at DATETIME,
  status ENUM('success', 'failure') NOT NULL,
  error_code VARCHAR(64),
  KEY sync_log_fetched_at (fetched_at DESC),
  CONSTRAINT sync_log_period_fk FOREIGN KEY (period_id) REFERENCES periods (id) ON DELETE SET NULL
);

-- Belt-and-suspenders for golden rule 5: reject any attempt to mutate a
-- frozen row instead of relying solely on application code.
DELIMITER $$

DROP TRIGGER IF EXISTS final_results_no_update$$
CREATE TRIGGER final_results_no_update
BEFORE UPDATE ON final_results
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'final_results is immutable once written';
END$$

DROP TRIGGER IF EXISTS final_results_no_delete$$
CREATE TRIGGER final_results_no_delete
BEFORE DELETE ON final_results
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'final_results is immutable once written';
END$$

DELIMITER ;
