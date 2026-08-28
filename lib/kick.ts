import "server-only";
import { createVerify } from "node:crypto";

// Server-only Kick API client (OAuth app token, channel lookup, webhook
// subscription, webhook signature verification). Needs KICK_CLIENT_ID /
// KICK_CLIENT_SECRET from an app registered at kick.com/settings/developer
// — see the "connect" action in app/api/admin/giveaway/route.ts for the
// one-time setup flow once those are set.

const TOKEN_URL = "https://id.kick.com/oauth/token";
const API_BASE = "https://api.kick.com/public/v1";

interface CachedToken {
  token: string;
  expiresAt: number;
}

let cachedToken: CachedToken | null = null;

// App access token via the client-credentials grant — no user/broadcaster
// login involved, just our own app's identity. Cached in memory for its
// lifetime (typically ~1hr) minus a minute of safety margin.
async function getAppAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.token;

  const clientId = process.env.KICK_CLIENT_ID;
  const clientSecret = process.env.KICK_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("KICK_CLIENT_ID / KICK_CLIENT_SECRET is not set");
  }

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Kick token request failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 };
  return cachedToken.token;
}

interface KickChannel {
  broadcaster_user_id: number;
}

export async function getBroadcasterUserId(slug: string): Promise<number> {
  const token = await getAppAccessToken();
  const res = await fetch(`${API_BASE}/channels?slug=${encodeURIComponent(slug)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Kick channel lookup failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { data: KickChannel[] };
  const id = data.data?.[0]?.broadcaster_user_id;
  if (!id) throw new Error(`Kick channel "${slug}" not found`);
  return id;
}

// One-time setup call: tells Kick to start POSTing chat.message.sent events
// for this channel to our webhook. The webhook URL itself isn't part of
// this request — it's configured on the app in Kick's developer portal.
export async function subscribeToChatMessages(broadcasterUserId: number): Promise<unknown> {
  const token = await getAppAccessToken();
  const res = await fetch(`${API_BASE}/events/subscriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      broadcaster_user_id: broadcasterUserId,
      events: [{ name: "chat.message.sent", version: 1 }],
      method: "webhook",
    }),
    cache: "no-store",
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Kick subscribe failed: ${res.status} ${JSON.stringify(data)}`);
  }
  return data;
}

let cachedPublicKey: string | null = null;

// Kick's webhook-signing public key is itself served over a public,
// unauthenticated endpoint (no app token needed) — cached for a day since
// it doesn't rotate often.
async function getPublicKey(): Promise<string> {
  if (cachedPublicKey) return cachedPublicKey;

  const res = await fetch(`${API_BASE}/public-key`, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`Kick public-key fetch failed: ${res.status}`);

  const data = (await res.json()) as { data: { public_key: string } };
  cachedPublicKey = data.data.public_key;
  return cachedPublicKey;
}

// Kick signs each webhook delivery with RSA-SHA256 over
// "{message-id}.{timestamp}.{raw body}" (see docs.kick.com/events/webhook-security).
// Verify with the raw request body — not a re-serialized JSON.parse'd
// version, which can differ byte-for-byte and silently break verification.
export async function verifyKickWebhookSignature(params: {
  messageId: string;
  timestamp: string;
  rawBody: string;
  signatureBase64: string;
}): Promise<boolean> {
  const publicKey = await getPublicKey();
  const signedPayload = `${params.messageId}.${params.timestamp}.${params.rawBody}`;

  const verifier = createVerify("RSA-SHA256");
  verifier.update(signedPayload);
  verifier.end();

  try {
    return verifier.verify(publicKey, Buffer.from(params.signatureBase64, "base64"));
  } catch {
    return false;
  }
}
