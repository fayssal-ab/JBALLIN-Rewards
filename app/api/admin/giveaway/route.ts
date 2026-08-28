import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";
import {
  getGiveawaySession,
  getGiveawayEntries,
  startGiveawaySession,
  stopGiveawaySession,
} from "@/lib/giveawaySession";
import { getBroadcasterUserId, subscribeToChatMessages } from "@/lib/kick";
import { KICK_CHANNEL } from "@/lib/constants";

type Body =
  | { action: "start"; keyword: string }
  | { action: "stop" }
  // One-time setup: looks up the channel and subscribes to chat.message.sent.
  // Requires KICK_CLIENT_ID/KICK_CLIENT_SECRET to be set and the webhook URL
  // (app/api/webhooks/kick/chat) to already be configured on the Kick app.
  | { action: "connect" };

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Body | null;
  if (!body) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  switch (body.action) {
    case "start":
      if (!body.keyword?.trim()) {
        return NextResponse.json({ error: "missing_keyword" }, { status: 400 });
      }
      await startGiveawaySession(body.keyword.trim());
      break;
    case "stop":
      await stopGiveawaySession();
      break;
    case "connect": {
      try {
        const broadcasterUserId = await getBroadcasterUserId(KICK_CHANNEL);
        const result = await subscribeToChatMessages(broadcasterUserId);
        return NextResponse.json({ ok: true, result });
      } catch (err) {
        return NextResponse.json(
          { error: "kick_connect_failed", message: (err as Error).message },
          { status: 502 }
        );
      }
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

  const [session, entries] = await Promise.all([getGiveawaySession(), getGiveawayEntries()]);
  return NextResponse.json({ session, entries });
}
