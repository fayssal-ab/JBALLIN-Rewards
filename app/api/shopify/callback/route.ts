import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { isAdminSession } from "@/lib/admin";
import { saveShopifyConnection } from "@/lib/merch";
import { verifyCallbackHmac, exchangeCodeForToken, OAUTH_STATE_COOKIE } from "@/lib/shopify";

// Shopify redirects the browser here after the merchant approves the app.
// Same-site navigation, so our admin_session cookie is still present —
// verified on top of the state+hmac checks below, which guard against a
// forged/replayed callback specifically.
export async function GET(request: NextRequest) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expectedState = request.cookies.get(OAUTH_STATE_COOKIE)?.value;

  if (!shop || !code || !state || !expectedState || state !== expectedState) {
    return NextResponse.json({ error: "invalid_callback" }, { status: 400 });
  }

  if (!verifyCallbackHmac(url.search.slice(1))) {
    return NextResponse.json({ error: "invalid_hmac" }, { status: 400 });
  }

  const token = await exchangeCodeForToken(shop, code);
  await saveShopifyConnection({
    shop_domain: shop,
    access_token: token.access_token,
    scope: token.scope,
  });

  const response = NextResponse.redirect(new URL("/admin/merch", request.url));
  response.cookies.delete(OAUTH_STATE_COOKIE);
  return response;
}
