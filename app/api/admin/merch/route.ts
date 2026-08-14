import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";
import {
  addMerchItem,
  updateMerchItem,
  setMerchItemActive,
  deleteMerchItem,
  type MerchItemInput,
} from "@/lib/merch";

type Body =
  | ({ action: "add" } & MerchItemInput)
  | ({ action: "update"; id: number } & MerchItemInput)
  | { action: "active"; id: number; active: boolean }
  | { action: "delete"; id: number };

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
      if (!body.name || !body.price) {
        return NextResponse.json({ error: "missing_fields" }, { status: 400 });
      }
      await addMerchItem({
        name: body.name,
        price: body.price,
        image_url: body.image_url || null,
        buy_url: body.buy_url || null,
      });
      break;
    case "update":
      await updateMerchItem(body.id, {
        name: body.name,
        price: body.price,
        image_url: body.image_url || null,
        buy_url: body.buy_url || null,
      });
      break;
    case "active":
      await setMerchItemActive(body.id, body.active);
      break;
    case "delete":
      await deleteMerchItem(body.id);
      break;
    default:
      return NextResponse.json({ error: "unknown_action" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
