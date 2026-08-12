export const RAINBET_URL = "https://rainbet.com?r=jballin";

export const KICK_CHANNEL = "therealjballin";
export const KICK_URL = `https://kick.com/${KICK_CHANNEL}`;

export const TWITTER_URL = "https://x.com/JballinKICK";
export const DISCORD_URL = "https://discord.gg/AhKyHtCwvw";

export const YOUTUBE_URL = "https://www.youtube.com/@JballinKICK";

// Periods reset at 2:49 AM GMT+1, not midnight — 01:49 UTC. Rainbet's API
// itself is date-only (no time-of-day param, see CLAUDE.md), so the actual
// query window is still whole days; this is only the instant shown/used for
// the countdown and for deciding a period has ended.
export const PERIOD_RESET_TIME_UTC = "01:49:00";
