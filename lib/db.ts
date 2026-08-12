import "server-only";
import { readFileSync } from "node:fs";
import mysql, { type Pool } from "mysql2/promise";

// Connection pool. Never import this from a client component — the
// credentials must never reach the browser.
//
// Built lazily (not at module scope) so importing this file doesn't require
// the env vars to be set — Next.js evaluates route modules while collecting
// build metadata, before runtime env vars are available.
let pool: Pool | null = null;

export function getPool(): Pool {
  if (pool) return pool;

  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME;

  if (!host || !user || !password || !database) {
    throw new Error("DB_HOST, DB_USER, DB_PASSWORD, and DB_NAME must be set");
  }

  pool = mysql.createPool({
    host,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user,
    password,
    database,
    // Return DECIMAL columns (wagered_amount, prize_pool, prize) as strings,
    // not JS numbers — money must never round-trip through a float.
    decimalNumbers: false,
    // Return DATE/DATETIME columns as "YYYY-MM-DD" strings, not JS Date
    // objects — periods.start_at/end_at go straight into Rainbet API query
    // params, which require that exact format (and a Date's timezone-shifted
    // toString() silently breaks it: er_invalid_date_format).
    dateStrings: true,
    // Set for managed hosts that require TLS (e.g. Aiven's "SSL mode:
    // REQUIRED"). Unset for local dev — plain local MySQL has no cert to
    // point at.
    //
    // DB_SSL_CA_BASE64 is the one to use on a hosting platform: a PEM cert
    // is many lines, and bulk/.env-style import UIs (Netlify's included)
    // reliably mangle multi-line env var values — that's what caused
    // "self-signed certificate in certificate chain" here. Base64 collapses
    // it to a single line with no newlines left to lose, so there's nothing
    // for the UI to mangle.
    ssl: process.env.DB_SSL_CA_BASE64
      ? { ca: Buffer.from(process.env.DB_SSL_CA_BASE64, "base64").toString("utf8") }
      : process.env.DB_SSL_CA
        ? { ca: process.env.DB_SSL_CA }
        : process.env.DB_SSL_CA_PATH
          ? { ca: readFileSync(process.env.DB_SSL_CA_PATH, "utf8") }
          : undefined,
  });

  return pool;
}
