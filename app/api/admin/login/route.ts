import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { checkPassword, adminToken, ADMIN_COOKIE_NAME } from "@/lib/admin";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { password?: string } | null;

  if (!body || typeof body.password !== "string" || !checkPassword(body.password)) {
    return NextResponse.json({ error: "invalid_password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, adminToken(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(ADMIN_COOKIE_NAME);
  return res;
}
