import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";
import {
  setActivePrediction,
  clearActivePrediction,
  getActivePredictionEntryId,
  getPredictionGuesses,
} from "@/lib/prediction";

type Body = { action: "start"; entryId: number } | { action: "stop" };

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
      if (!body.entryId) {
        return NextResponse.json({ error: "missing_entry" }, { status: 400 });
      }
      await setActivePrediction(body.entryId);
      break;
    case "stop":
      await clearActivePrediction();
      break;
    default:
      return NextResponse.json({ error: "unknown_action" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const entryId = await getActivePredictionEntryId();
  const guesses = entryId ? await getPredictionGuesses(entryId) : [];
  return NextResponse.json({ entryId, guessCount: guesses.length });
}
