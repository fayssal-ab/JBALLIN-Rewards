import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { searchSlots } from "@/lib/slotSearch";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";
  const results = await searchSlots(query);
  return NextResponse.json({ results });
}
