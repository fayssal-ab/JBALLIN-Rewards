-- The live period was set to end 2026-09-15 (see 0010), but the streamer
-- wants this cycle to run through the end of September instead. Rather than
-- another flat day-shift, this switches the chain over to clean calendar
-- months (1st -> last day of month) from October onward, still 12 periods
-- seeded ahead with no overlap and no gap.
USE wager_leaderboard;

UPDATE periods SET end_at = '2026-09-30' WHERE id = 1 AND status = 'live';

UPDATE periods SET start_at = '2026-10-01', end_at = '2026-10-31' WHERE id = 3 AND status = 'upcoming';
UPDATE periods SET start_at = '2026-11-01', end_at = '2026-11-30' WHERE id = 4 AND status = 'upcoming';
UPDATE periods SET start_at = '2026-12-01', end_at = '2026-12-31' WHERE id = 5 AND status = 'upcoming';
UPDATE periods SET start_at = '2027-01-01', end_at = '2027-01-31' WHERE id = 6 AND status = 'upcoming';
UPDATE periods SET start_at = '2027-02-01', end_at = '2027-02-28' WHERE id = 7 AND status = 'upcoming';
UPDATE periods SET start_at = '2027-03-01', end_at = '2027-03-31' WHERE id = 8 AND status = 'upcoming';
UPDATE periods SET start_at = '2027-04-01', end_at = '2027-04-30' WHERE id = 9 AND status = 'upcoming';
UPDATE periods SET start_at = '2027-05-01', end_at = '2027-05-31' WHERE id = 10 AND status = 'upcoming';
UPDATE periods SET start_at = '2027-06-01', end_at = '2027-06-30' WHERE id = 11 AND status = 'upcoming';
UPDATE periods SET start_at = '2027-07-01', end_at = '2027-07-31' WHERE id = 12 AND status = 'upcoming';
UPDATE periods SET start_at = '2027-08-01', end_at = '2027-08-31' WHERE id = 13 AND status = 'upcoming';
UPDATE periods SET start_at = '2027-09-01', end_at = '2027-09-30' WHERE id = 14 AND status = 'upcoming';
