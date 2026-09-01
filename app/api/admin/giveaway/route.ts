import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";
import {
  getGiveawaySession,
  getGiveawayEntries,
  getGiveawayWinners,
  startGiveawaySession,
  stopGiveawaySession,
  resetGiveawayState,
  drawGiveawayWinners,
  markWebhookConnected,
} from "@/lib/giveawaySession";
import { getBroadcasterUserId, subscribeToChatMessages } from "@/lib/kick";
import { KICK_CHANNEL } from "@/lib/constants";

type Body =
  | { action: "start"; keyword: string; winnerCount: number; subscribersOnly: boolean; activeOnly: boolean }
  | { action: "stop" }
  | { action: "reset" }
  | { action: "draw"; count?: number };

// Looks up the channel and subscribes to chat.message.sent. Requires
// KICK_CLIENT_ID/KICK_CLIENT_SECRET to be set and the webhook URL
// (app/api/webhooks/kick/chat) to already be configured on the Kick app.
// Safe to call more than once — Kick's subscribe endpoint is additive, but
// we still gate on webhook_connected so a normal "Start listening" doesn't
// re-subscribe (and burn into Kick's subscription limit) every session.
async function connectKickWebhookOnce(): Promise<string | null> {
  try {
    const broadcasterUserId = await getBroadcasterUserId(KICK_CHANNEL);
    await subscribeToChatMessages(broadcasterUserId);
    await markWebhookConnected();
    return null;
  } catch (err) {
    return (err as Error).message;
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Body | null;
  if (!body) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  switch (body.action) {
    case "start": {
      if (!body.keyword?.trim()) {
        return NextResponse.json({ error: "missing_keyword" }, { status: 400 });
      }

      // Auto-connect the webhook on first use so there's no separate setup
      // step — a failure here doesn't block starting the session (the admin
      // can still add names manually), it's just surfaced as a warning.
      const session = await getGiveawaySession();
      let connectWarning: string | null = null;
      if (!session.webhookConnected) {
        connectWarning = await connectKickWebhookOnce();
      }

      await startGiveawaySession({
        keyword: body.keyword.trim(),
        winnerCount: Math.max(1, Math.floor(body.winnerCount) || 1),
        subscribersOnly: Boolean(body.subscribersOnly),
        activeOnly: Boolean(body.activeOnly),
      });
      return NextResponse.json({ ok: true, connectWarning });
    }
    case "stop":
      await stopGiveawaySession();
      break;
    case "reset":
      await resetGiveawayState();
      break;
    case "draw": {
      const session = await getGiveawaySession();
      // count overrides session.winnerCount for a reroll — replacing just
      // the picks that failed the activity check, not a fresh full draw.
      const count = body.count ? Math.max(1, Math.floor(body.count)) : session.winnerCount;
      const winners = await drawGiveawayWinners(count, session.subscribersOnly, session.activeOnly);
      return NextResponse.json({ ok: true, winners });
    }
    default:
      return NextResponse.json({ error: "unknown_action" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [session, entries, winners] = await Promise.all([
    getGiveawaySession(),
    getGiveawayEntries(),
    getGiveawayWinners(),
  ]);
  return NextResponse.json({ session, entries, winners });
}
