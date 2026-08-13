import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";
import { setTournamentSlot, resetTournament, type Round } from "@/lib/tournament";

type Body =
  | { action: "set"; round: Round; slotIndex: number; name: string | null }
  | { action: "reset" };

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Body | null;
  if (!body) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  switch (body.action) {
    case "set":
      await setTournamentSlot(body.round, body.slotIndex, body.name);
      break;
    case "reset":
      await resetTournament();
      break;
    default:
      return NextResponse.json({ error: "unknown_action" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
