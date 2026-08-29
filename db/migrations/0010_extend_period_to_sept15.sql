-- The live period was set to end 2026-08-31 (see 0006), but the streamer
-- wants this cycle to run through 2026-09-15 instead. Shifts every already
-- seeded upcoming period by 15 days so they keep chaining back-to-back
-- (16th -> 15th of the following month) with no overlap and no gap.
USE wager_leaderboard;

UPDATE periods SET end_at = '2026-09-15' WHERE id = 1 AND status = 'live';

UPDATE periods SET start_at = '2026-09-16', end_at = '2026-10-15' WHERE id = 3 AND status = 'upcoming';
UPDATE periods SET start_at = '2026-10-16', end_at = '2026-11-15' WHERE id = 4 AND status = 'upcoming';
UPDATE periods SET start_at = '2026-11-16', end_at = '2026-12-15' WHERE id = 5 AND status = 'upcoming';
UPDATE periods SET start_at = '2026-12-16', end_at = '2027-01-15' WHERE id = 6 AND status = 'upcoming';
UPDATE periods SET start_at = '2027-01-16', end_at = '2027-02-15' WHERE id = 7 AND status = 'upcoming';
UPDATE periods SET start_at = '2027-02-16', end_at = '2027-03-15' WHERE id = 8 AND status = 'upcoming';
UPDATE periods SET start_at = '2027-03-16', end_at = '2027-04-15' WHERE id = 9 AND status = 'upcoming';
UPDATE periods SET start_at = '2027-04-16', end_at = '2027-05-15' WHERE id = 10 AND status = 'upcoming';
UPDATE periods SET start_at = '2027-05-16', end_at = '2027-06-15' WHERE id = 11 AND status = 'upcoming';
UPDATE periods SET start_at = '2027-06-16', end_at = '2027-07-15' WHERE id = 12 AND status = 'upcoming';
UPDATE periods SET start_at = '2027-07-16', end_at = '2027-08-15' WHERE id = 13 AND status = 'upcoming';
UPDATE periods SET start_at = '2027-08-16', end_at = '2027-09-15' WHERE id = 14 AND status = 'upcoming';
