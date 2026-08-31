import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";
import {
  addBonusHuntEntry,
  setBonusHuntPayout,
  deleteBonusHuntEntry,
  setStartingBalance,
  resetBonusHunt,
} from "@/lib/bonusHunt";
import { clearActivePredictionIfMatches } from "@/lib/prediction";

type Body =
  | { action: "add"; slotName: string; provider?: string; imageUrl?: string; bet: string }
  | { action: "payout"; id: number; payout: string | null }
  | { action: "delete"; id: number }
  | { action: "balance"; amount: string }
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
    case "add":
      if (!body.slotName || !body.bet) {
        return NextResponse.json({ error: "missing_fields" }, { status: 400 });
      }
      await addBonusHuntEntry({
        slotName: body.slotName,
        provider: body.provider ?? null,
        imageUrl: body.imageUrl ?? null,
        bet: body.bet,
      });
      break;
    case "payout":
      await setBonusHuntPayout(body.id, body.payout);
      // If this entry was the live "Guess the Bonus" round, revealing the
      // real payout resolves and closes it — the entry's own payout column
      // is what the prediction page reads to compute the winner.
      if (body.payout !== null) await clearActivePredictionIfMatches(body.id);
      break;
    case "delete":
      await deleteBonusHuntEntry(body.id);
      break;
    case "balance":
      await setStartingBalance(body.amount);
      break;
    case "reset":
      await resetBonusHunt();
      break;
    default:
      return NextResponse.json({ error: "unknown_action" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
