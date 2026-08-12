import "server-only";

const CHANNEL_ID = "UCznMlrd9cFvj8BJq7f7SH4g";

export interface LatestVideo {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  watchUrl: string;
}

// Public per-channel RSS feed — no API key, no scraping the channel page's
// HTML (which breaks whenever YouTube reshuffles its internal JSON). Always
// lists videos newest-first. We only ever show a static thumbnail + link
// from this, never an embedded player: age-restricted uploads refuse to
// play in an iframe at all, which is what broke the earlier autoplay embed.
export async function getLatestVideo(): Promise<LatestVideo | null> {
  try {
    const res = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`,
      { next: { revalidate: 1800 } }
    );
    if (!res.ok) return null;

    const xml = await res.text();
    const idMatch = xml.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
    const titleMatch = xml.match(/<title>([^<]+)<\/title>/g);

    if (!idMatch) return null;
    const videoId = idMatch[1];
    // First <title> in the feed is the channel's own name; the video title
    // is the second occurrence.
    const title = titleMatch?.[1]?.replace(/^<title>|<\/title>$/g, "") ?? "Latest video";

    return {
      videoId,
      title,
      thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
      watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
    };
  } catch {
    return null;
  }
}
