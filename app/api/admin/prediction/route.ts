import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";
import {
  startGuessBalanceRound,
  stopGuessBalanceRound,
  clearGuessBalanceGuesses,
  getGuessBalanceRound,
  getBalanceGuesses,
  getFinalBalanceIfHuntComplete,
} from "@/lib/prediction";

type Body = { action: "start" } | { action: "stop" } | { action: "clear" };

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
      await startGuessBalanceRound();
      break;
    case "stop":
      await stopGuessBalanceRound();
      break;
    case "clear":
      await clearGuessBalanceGuesses();
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

  const [round, guesses, final] = await Promise.all([
    getGuessBalanceRound(),
    getBalanceGuesses(),
    getFinalBalanceIfHuntComplete(),
  ]);
  return NextResponse.json({ round, guessCount: guesses.length, final });
}
