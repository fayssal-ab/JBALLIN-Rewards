// Shared between client (WinnerPicker) and server (giveawaySession) code,
// so this file must NOT have the "server-only" guard.

// A Kick entrant who sent this many chat messages while the giveaway was
// live (not just their entry line) counts as "Active" — used both for the
// UI badge and for the optional "Active only" draw filter.
export const ACTIVE_MESSAGE_THRESHOLD = 3;
