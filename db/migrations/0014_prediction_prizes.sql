-- Lets the admin decide how many "Guess the Balance" places pay out (1, 2,
-- or 3) and how much each one wins, set when the round starts. 0 in a slot
-- means that place doesn't pay — e.g. rank2_prize/rank3_prize left at 0
-- means only 1st place wins anything.
USE wager_leaderboard;

ALTER TABLE guess_balance_round
  ADD COLUMN rank1_prize DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER started_at,
  ADD COLUMN rank2_prize DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER rank1_prize,
  ADD COLUMN rank3_prize DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER rank2_prize;

ALTER TABLE guess_balance_history
  ADD COLUMN winner_prize DECIMAL(10,2) NULL AFTER winner_guess;
