-- Aligns the live period to calendar month-end (it was seeded as
-- 2026-08-01 -> 2026-09-11, which meant the cron wouldn't auto-close it
-- until Sept 12) and seeds a year of upcoming calendar-month periods so
-- admin never has to touch this to keep the monthly rollover going, per
-- CLAUDE.md's "seed 12 periods ahead" working-style rule.
--
-- All seeded periods reuse the same $500 pool / rank 1-10 percentage split
-- as the current live period. Edit prize_pool / prize_distribution by hand
-- per period once real prize amounts are decided for a given month.

USE wager_leaderboard;

UPDATE periods SET end_at = '2026-08-31' WHERE id = 1 AND status = 'live';

INSERT INTO periods (start_at, end_at, timezone, prize_pool, prize_distribution, status)
VALUES
  ('2026-09-01', '2026-09-30', 'UTC', 500.00, JSON_ARRAY(
    JSON_OBJECT('rank', 1, 'percentage', 40), JSON_OBJECT('rank', 2, 'percentage', 20),
    JSON_OBJECT('rank', 3, 'percentage', 15), JSON_OBJECT('rank', 4, 'percentage', 8),
    JSON_OBJECT('rank', 5, 'percentage', 6), JSON_OBJECT('rank', 6, 'percentage', 4),
    JSON_OBJECT('rank', 7, 'percentage', 3), JSON_OBJECT('rank', 8, 'percentage', 2),
    JSON_OBJECT('rank', 9, 'percentage', 1), JSON_OBJECT('rank', 10, 'percentage', 1)
  ), 'upcoming'),
  ('2026-10-01', '2026-10-31', 'UTC', 500.00, JSON_ARRAY(
    JSON_OBJECT('rank', 1, 'percentage', 40), JSON_OBJECT('rank', 2, 'percentage', 20),
    JSON_OBJECT('rank', 3, 'percentage', 15), JSON_OBJECT('rank', 4, 'percentage', 8),
    JSON_OBJECT('rank', 5, 'percentage', 6), JSON_OBJECT('rank', 6, 'percentage', 4),
    JSON_OBJECT('rank', 7, 'percentage', 3), JSON_OBJECT('rank', 8, 'percentage', 2),
    JSON_OBJECT('rank', 9, 'percentage', 1), JSON_OBJECT('rank', 10, 'percentage', 1)
  ), 'upcoming'),
  ('2026-11-01', '2026-11-30', 'UTC', 500.00, JSON_ARRAY(
    JSON_OBJECT('rank', 1, 'percentage', 40), JSON_OBJECT('rank', 2, 'percentage', 20),
    JSON_OBJECT('rank', 3, 'percentage', 15), JSON_OBJECT('rank', 4, 'percentage', 8),
    JSON_OBJECT('rank', 5, 'percentage', 6), JSON_OBJECT('rank', 6, 'percentage', 4),
    JSON_OBJECT('rank', 7, 'percentage', 3), JSON_OBJECT('rank', 8, 'percentage', 2),
    JSON_OBJECT('rank', 9, 'percentage', 1), JSON_OBJECT('rank', 10, 'percentage', 1)
  ), 'upcoming'),
  ('2026-12-01', '2026-12-31', 'UTC', 500.00, JSON_ARRAY(
    JSON_OBJECT('rank', 1, 'percentage', 40), JSON_OBJECT('rank', 2, 'percentage', 20),
    JSON_OBJECT('rank', 3, 'percentage', 15), JSON_OBJECT('rank', 4, 'percentage', 8),
    JSON_OBJECT('rank', 5, 'percentage', 6), JSON_OBJECT('rank', 6, 'percentage', 4),
    JSON_OBJECT('rank', 7, 'percentage', 3), JSON_OBJECT('rank', 8, 'percentage', 2),
    JSON_OBJECT('rank', 9, 'percentage', 1), JSON_OBJECT('rank', 10, 'percentage', 1)
  ), 'upcoming'),
  ('2027-01-01', '2027-01-31', 'UTC', 500.00, JSON_ARRAY(
    JSON_OBJECT('rank', 1, 'percentage', 40), JSON_OBJECT('rank', 2, 'percentage', 20),
    JSON_OBJECT('rank', 3, 'percentage', 15), JSON_OBJECT('rank', 4, 'percentage', 8),
    JSON_OBJECT('rank', 5, 'percentage', 6), JSON_OBJECT('rank', 6, 'percentage', 4),
    JSON_OBJECT('rank', 7, 'percentage', 3), JSON_OBJECT('rank', 8, 'percentage', 2),
    JSON_OBJECT('rank', 9, 'percentage', 1), JSON_OBJECT('rank', 10, 'percentage', 1)
  ), 'upcoming'),
  ('2027-02-01', '2027-02-28', 'UTC', 500.00, JSON_ARRAY(
    JSON_OBJECT('rank', 1, 'percentage', 40), JSON_OBJECT('rank', 2, 'percentage', 20),
    JSON_OBJECT('rank', 3, 'percentage', 15), JSON_OBJECT('rank', 4, 'percentage', 8),
    JSON_OBJECT('rank', 5, 'percentage', 6), JSON_OBJECT('rank', 6, 'percentage', 4),
    JSON_OBJECT('rank', 7, 'percentage', 3), JSON_OBJECT('rank', 8, 'percentage', 2),
    JSON_OBJECT('rank', 9, 'percentage', 1), JSON_OBJECT('rank', 10, 'percentage', 1)
  ), 'upcoming'),
  ('2027-03-01', '2027-03-31', 'UTC', 500.00, JSON_ARRAY(
    JSON_OBJECT('rank', 1, 'percentage', 40), JSON_OBJECT('rank', 2, 'percentage', 20),
    JSON_OBJECT('rank', 3, 'percentage', 15), JSON_OBJECT('rank', 4, 'percentage', 8),
    JSON_OBJECT('rank', 5, 'percentage', 6), JSON_OBJECT('rank', 6, 'percentage', 4),
    JSON_OBJECT('rank', 7, 'percentage', 3), JSON_OBJECT('rank', 8, 'percentage', 2),
    JSON_OBJECT('rank', 9, 'percentage', 1), JSON_OBJECT('rank', 10, 'percentage', 1)
  ), 'upcoming'),
  ('2027-04-01', '2027-04-30', 'UTC', 500.00, JSON_ARRAY(
    JSON_OBJECT('rank', 1, 'percentage', 40), JSON_OBJECT('rank', 2, 'percentage', 20),
    JSON_OBJECT('rank', 3, 'percentage', 15), JSON_OBJECT('rank', 4, 'percentage', 8),
    JSON_OBJECT('rank', 5, 'percentage', 6), JSON_OBJECT('rank', 6, 'percentage', 4),
    JSON_OBJECT('rank', 7, 'percentage', 3), JSON_OBJECT('rank', 8, 'percentage', 2),
    JSON_OBJECT('rank', 9, 'percentage', 1), JSON_OBJECT('rank', 10, 'percentage', 1)
  ), 'upcoming'),
  ('2027-05-01', '2027-05-31', 'UTC', 500.00, JSON_ARRAY(
    JSON_OBJECT('rank', 1, 'percentage', 40), JSON_OBJECT('rank', 2, 'percentage', 20),
    JSON_OBJECT('rank', 3, 'percentage', 15), JSON_OBJECT('rank', 4, 'percentage', 8),
    JSON_OBJECT('rank', 5, 'percentage', 6), JSON_OBJECT('rank', 6, 'percentage', 4),
    JSON_OBJECT('rank', 7, 'percentage', 3), JSON_OBJECT('rank', 8, 'percentage', 2),
    JSON_OBJECT('rank', 9, 'percentage', 1), JSON_OBJECT('rank', 10, 'percentage', 1)
  ), 'upcoming'),
  ('2027-06-01', '2027-06-30', 'UTC', 500.00, JSON_ARRAY(
    JSON_OBJECT('rank', 1, 'percentage', 40), JSON_OBJECT('rank', 2, 'percentage', 20),
    JSON_OBJECT('rank', 3, 'percentage', 15), JSON_OBJECT('rank', 4, 'percentage', 8),
    JSON_OBJECT('rank', 5, 'percentage', 6), JSON_OBJECT('rank', 6, 'percentage', 4),
    JSON_OBJECT('rank', 7, 'percentage', 3), JSON_OBJECT('rank', 8, 'percentage', 2),
    JSON_OBJECT('rank', 9, 'percentage', 1), JSON_OBJECT('rank', 10, 'percentage', 1)
  ), 'upcoming'),
  ('2027-07-01', '2027-07-31', 'UTC', 500.00, JSON_ARRAY(
    JSON_OBJECT('rank', 1, 'percentage', 40), JSON_OBJECT('rank', 2, 'percentage', 20),
    JSON_OBJECT('rank', 3, 'percentage', 15), JSON_OBJECT('rank', 4, 'percentage', 8),
    JSON_OBJECT('rank', 5, 'percentage', 6), JSON_OBJECT('rank', 6, 'percentage', 4),
    JSON_OBJECT('rank', 7, 'percentage', 3), JSON_OBJECT('rank', 8, 'percentage', 2),
    JSON_OBJECT('rank', 9, 'percentage', 1), JSON_OBJECT('rank', 10, 'percentage', 1)
  ), 'upcoming'),
  ('2027-08-01', '2027-08-31', 'UTC', 500.00, JSON_ARRAY(
    JSON_OBJECT('rank', 1, 'percentage', 40), JSON_OBJECT('rank', 2, 'percentage', 20),
    JSON_OBJECT('rank', 3, 'percentage', 15), JSON_OBJECT('rank', 4, 'percentage', 8),
    JSON_OBJECT('rank', 5, 'percentage', 6), JSON_OBJECT('rank', 6, 'percentage', 4),
    JSON_OBJECT('rank', 7, 'percentage', 3), JSON_OBJECT('rank', 8, 'percentage', 2),
    JSON_OBJECT('rank', 9, 'percentage', 1), JSON_OBJECT('rank', 10, 'percentage', 1)
  ), 'upcoming');
