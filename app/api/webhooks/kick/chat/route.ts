import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { verifyKickWebhookSignature } from "@/lib/kick";
import { recordGiveawayEntryIfMatches } from "@/lib/giveawaySession";

// Public endpoint — Kick posts here for every chat.message.sent event once
// subscribed (see the "connect" admin action). Auth is the RSA signature,
// not a shared secret: anyone can hit this URL, but only a payload
// genuinely signed by Kick's private key passes verification.
export const dynamic = "force-dynamic";

interface ChatMessageSentPayload {
  content: string;
  sender: { username: string };
}

export async function POST(request: NextRequest) {
  // Signature is computed over the exact raw bytes Kick sent — read text(),
  // not json(), so re-serialization can't shift whitespace and break it.
  const rawBody = await request.text();

  const messageId = request.headers.get("kick-event-message-id");
  const timestamp = request.headers.get("kick-event-message-timestamp");
  const signature = request.headers.get("kick-event-signature");
  const eventType = request.headers.get("kick-event-type");

  if (!messageId || !timestamp || !signature) {
    return NextResponse.json({ error: "missing_signature_headers" }, { status: 400 });
  }

  const valid = await verifyKickWebhookSignature({
    messageId,
    timestamp,
    rawBody,
    signatureBase64: signature,
  });
  if (!valid) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  if (eventType !== "chat.message.sent") {
    return NextResponse.json({ ok: true });
  }

  const payload = JSON.parse(rawBody) as ChatMessageSentPayload;
  await recordGiveawayEntryIfMatches(payload.sender.username, payload.content);

  return NextResponse.json({ ok: true });
}
