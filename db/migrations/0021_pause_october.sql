-- Pause the leaderboard for October: nothing is live between the end of
-- the current period and the next one. Every seeded upcoming period moves
-- forward one calendar month (Oct 2026 -> Nov 2026, ... Sep 2027 -> Oct
-- 2027), so there's still 12 periods seeded ahead and the cron's
-- activate_next_period() simply finds nothing eligible until Nov 1.
-- To un-pause, shift these back a month.
USE wager_leaderboard;

UPDATE periods SET start_at = '2026-11-01', end_at = '2026-11-30' WHERE id = 3 AND status = 'upcoming';
UPDATE periods SET start_at = '2026-12-01', end_at = '2026-12-31' WHERE id = 4 AND status = 'upcoming';
UPDATE periods SET start_at = '2027-01-01', end_at = '2027-01-31' WHERE id = 5 AND status = 'upcoming';
UPDATE periods SET start_at = '2027-02-01', end_at = '2027-02-28' WHERE id = 6 AND status = 'upcoming';
UPDATE periods SET start_at = '2027-03-01', end_at = '2027-03-31' WHERE id = 7 AND status = 'upcoming';
UPDATE periods SET start_at = '2027-04-01', end_at = '2027-04-30' WHERE id = 8 AND status = 'upcoming';
UPDATE periods SET start_at = '2027-05-01', end_at = '2027-05-31' WHERE id = 9 AND status = 'upcoming';
UPDATE periods SET start_at = '2027-06-01', end_at = '2027-06-30' WHERE id = 10 AND status = 'upcoming';
UPDATE periods SET start_at = '2027-07-01', end_at = '2027-07-31' WHERE id = 11 AND status = 'upcoming';
UPDATE periods SET start_at = '2027-08-01', end_at = '2027-08-31' WHERE id = 12 AND status = 'upcoming';
UPDATE periods SET start_at = '2027-09-01', end_at = '2027-09-30' WHERE id = 13 AND status = 'upcoming';
UPDATE periods SET start_at = '2027-10-01', end_at = '2027-10-31' WHERE id = 14 AND status = 'upcoming';
