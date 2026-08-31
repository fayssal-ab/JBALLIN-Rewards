-- Archive of resolved "Guess the Balance" rounds, written when the admin
-- resets the hunt (see the "reset" action in app/api/admin/bonus-hunt/route.ts).
-- Deliberately tiny — only the winner + a few summary numbers, not every
-- guess ever made (those live in guess_balance_guesses, which is cleared on
-- every new round anyway). At ~100 bytes/row this is negligible even after
-- years of daily hunts; the DB's real budget is a shared ~1GB plan.
USE wager_leaderboard;

CREATE TABLE IF NOT EXISTS guess_balance_history (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  starting_balance DECIMAL(20,8) NOT NULL,
  final_balance DECIMAL(20,8) NOT NULL,
  guess_count INT NOT NULL DEFAULT 0,
  winner_username VARCHAR(255) NULL,
  winner_guess DECIMAL(20,8) NULL,
  resolved_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY guess_balance_history_resolved_at (resolved_at DESC)
);
