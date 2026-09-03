import "server-only";
import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";
import { getAuthorizeUrl, OAUTH_STATE_COOKIE } from "@/lib/shopify";

// Kicks off the OAuth handshake: redirect to Shopify's authorize screen
// with a random state, checked back in app/api/shopify/callback to make
// sure the callback we get really answers this request.
export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const state = randomBytes(16).toString("hex");
  const response = NextResponse.redirect(getAuthorizeUrl(state));
  response.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 300,
    path: "/",
  });
  return response;
}
