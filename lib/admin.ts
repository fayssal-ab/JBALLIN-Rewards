import "server-only";
import { cookies } from "next/headers";
import { createHash, timingSafeEqual } from "node:crypto";

// No sessions table: the cookie IS sha256(ADMIN_PASSWORD). Any request
// presenting that exact hash is treated as admin. Simple, no expiry to
// manage server-side, and rotating ADMIN_PASSWORD invalidates every
// existing cookie for free.
export const ADMIN_COOKIE_NAME = "admin_session";

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

export function checkPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return timingSafeStringEqual(password, expected);
}

export function adminToken(): string {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) throw new Error("ADMIN_PASSWORD is not set");
  return hash(password);
}

/** For use in Server Components / Server Actions (reads the cookie jar). */
export async function isAdminSession(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return false;
  try {
    return timingSafeStringEqual(token, adminToken());
  } catch {
    return false;
  }
}

/** For use in Route Handlers (reads the raw request). */
export function isAdminRequest(request: Request): boolean {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${ADMIN_COOKIE_NAME}=`));
  if (!match) return false;
  const token = match.slice(ADMIN_COOKIE_NAME.length + 1);
  try {
    return timingSafeStringEqual(token, adminToken());
  } catch {
    return false;
  }
}
