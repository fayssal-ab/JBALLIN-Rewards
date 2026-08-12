-- Ranking and period-close logic live in SQL so money math (wagered amounts,
-- prize splits) never passes through a JS float. Called from lib/periods.ts.

USE wager_leaderboard;

DELIMITER $$

DROP PROCEDURE IF EXISTS recompute_live_ranks$$
CREATE PROCEDURE recompute_live_ranks(IN p_period_id BIGINT)
BEGIN
  UPDATE live_entries le
  JOIN (
    SELECT rainbet_id, ROW_NUMBER() OVER (ORDER BY wagered_amount DESC) AS rnk
    FROM live_entries
    WHERE period_id = p_period_id
  ) ranked ON ranked.rainbet_id = le.rainbet_id
  SET le.`rank` = ranked.rnk
  WHERE le.period_id = p_period_id;
END$$

-- Assumed shape of periods.prize_distribution, since CLAUDE.md doesn't pin
-- one down: a JSON array of {"rank": 1, "percentage": 50}, percentages of
-- prize_pool. Ranks not listed get 0. Revisit if the real shape differs.
DROP PROCEDURE IF EXISTS close_period$$
CREATE PROCEDURE close_period(IN p_period_id BIGINT)
BEGIN
  DECLARE v_prize_pool DECIMAL(20,8);
  DECLARE v_distribution JSON;
  DECLARE v_found INT DEFAULT 0;

  SELECT prize_pool, prize_distribution, 1
    INTO v_prize_pool, v_distribution, v_found
  FROM periods
  WHERE id = p_period_id AND status = 'live'
  LIMIT 1;

  IF v_found = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'close_period: period is not live';
  END IF;

  -- Idempotent on retry: final_results' triggers reject UPDATE, so a plain
  -- upsert would blow up on a second call. INSERT IGNORE skips the
  -- duplicate-key row entirely instead of touching it.
  INSERT IGNORE INTO final_results (period_id, rainbet_id, username, wagered_amount, `rank`, prize)
  SELECT
    le.period_id,
    le.rainbet_id,
    le.username,
    le.wagered_amount,
    le.`rank`,
    COALESCE(
      (
        SELECT (jt.percentage / 100) * v_prize_pool
        FROM JSON_TABLE(
          v_distribution, '$[*]'
          COLUMNS (
            rank_val INT PATH '$.rank',
            percentage DECIMAL(10, 4) PATH '$.percentage'
          )
        ) AS jt
        WHERE jt.rank_val = le.`rank`
      ),
      0
    ) AS prize
  FROM live_entries le
  WHERE le.period_id = p_period_id;

  UPDATE periods SET status = 'closed' WHERE id = p_period_id;
END$$

-- Activates the earliest 'upcoming' period whose start_at has arrived.
-- No-op if none qualifies yet (e.g. gap in the seeded schedule).
--
-- Simplified against periods.timezone: CLAUDE.md says to assume UTC until
-- the Rainbet affiliate manager confirms otherwise, so this compares against
-- UTC_DATE() directly rather than converting per-row via CONVERT_TZ (which
-- also requires the mysql.time_zone tables to be populated). Revisit
-- alongside the timezone open question in CLAUDE.md.
DROP PROCEDURE IF EXISTS activate_next_period$$
CREATE PROCEDURE activate_next_period()
BEGIN
  UPDATE periods
  SET status = 'live'
  WHERE id = (
    SELECT id FROM (
      SELECT id FROM periods
      WHERE status = 'upcoming' AND start_at <= UTC_DATE()
      ORDER BY start_at ASC
      LIMIT 1
    ) AS next_period
  );
END$$

DELIMITER ;
