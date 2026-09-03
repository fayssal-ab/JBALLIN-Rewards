import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";
import { setMerchItemActive } from "@/lib/merch";

// Products come from Shopify (see app/api/admin/shopify/sync) — the only
// admin action left here is hiding/showing a synced item on the public page.
type Body = { action: "active"; id: number; active: boolean };

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Body | null;
  if (!body || body.action !== "active") {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  await setMerchItemActive(body.id, body.active);
  return NextResponse.json({ ok: true });
}
