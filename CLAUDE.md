# CLAUDE.md

## Project

Wager leaderboard site for a Kick streamer who plays on Rainbet (crypto casino).
Viewers sign up under the streamer's referral code, wager, and compete on a
leaderboard for a prize pool.

Reference / benchmark: `baschinrewards.com` — 5 pages (Home, Leaderboard,
Milestones, Referral Program, Instructions). We are matching its scope and
beating it on two specific points: server-side rendering of the leaderboard,
and a self-lookup search box.

---

## Stack — DECIDED. Do not propose alternatives.

- **Next.js (App Router, TypeScript)**
- **MySQL 8** (existing local/shared instance, `mysql2` connection pool —
  switched from the originally planned Supabase/Postgres; schema lives in
  `db/migrations/`, applied by hand via the `mysql` CLI, database name
  `wager_leaderboard`)
- **Vercel** hosting
- **Cron**: GitHub Actions (or cron-job.org) hitting a protected route.
  Vercel's free tier limits cron frequency — do not rely on `vercel.json` cron
  without confirming current limits.

---

## 🔴 GOLDEN RULES — never violate these

1. **The frontend NEVER calls the Rainbet API.** Only server-side code (the cron
   route) touches it. The frontend reads our own database.
2. **`RAINBET_API_KEY` is server-only.** Never in a client component, never in a
   `NEXT_PUBLIC_*` var, never in a URL the browser constructs. The API takes the
   key as a **query parameter**, so any client-side fetch leaks it in DevTools.
3. **Username masking happens on the server.** Full usernames must never appear
   in any JSON payload sent to the browser. Not hidden with CSS. Not masked
   inside a client component. Masked before it leaves the server.
4. **Never delete existing leaderboard rows on a failed sync.** Log the error and
   keep the last good data. A stale leaderboard beats an empty one.
5. **`final_results` is immutable once frozen.** Never recompute it from the API.

---

## Rainbet Affiliate API — exact spec

Base URL: `https://services.rainbet.com`
Docs: `https://services.rainbet.com/external-documentation`

### `GET /v1/external/affiliates` — the leaderboard endpoint

Query parameters (all required):

| param | format | notes |
|---|---|---|
| `key` | string, max 32 chars | API key |
| `start_at` | `YYYY-MM-DD` | start of window |
| `end_at` | `YYYY-MM-DD` | **inclusive** |

Success response (200):

```json
{
  "affiliates": [
    { "username": "player123", "id": "abc123def456", "wagered_amount": "100000" }
  ],
  "cache_updated_at": "2025-03-09 06:34:03"
}
```

Critical details:

- `wagered_amount` is a **decimal string at full precision**. Parse it with a
  decimal-safe method. Never use JS floats for money arithmetic. Store as
  `DECIMAL` in MySQL.
- If the key has **`target_edge`** configured, `wagered_amount` is a *weighted*
  wager, not the raw amount:
  `wagered_amount = total_ev / (target_edge / 100)`
  Example: with `target_edge = 4`, a user wagering $100k on blackjack (0.5% edge
  → $500 EV) is reported as `"12500"`.
- Maximum date range: **123 days** (~4 months).
- Responses are **cached up to 10 minutes**. Never poll more often than every
  10 minutes — you will just get the same payload. Read `cache_updated_at` and
  surface it in the UI.

Error responses:

- 400 — `{ "error": "er_..." }` where the code is one of:
  `er_missing_parameters`, `er_invalid_date_format`,
  `er_start_at_parameter_invalid`, `er_end_at_parameter_invalid`,
  `er_end_at_parameter_within_4_month`, `er_invalid_key`
- 500 — `er_invalid_target_edge_configuration` (weighting misconfigured on the key)

Handle each explicitly. Do not collapse them into a generic catch.

### `GET /v1/external/affiliates/users`

Returns information about referred users. **Not needed for the leaderboard.**
It exposes more personal data than we need — do not call it without a reason.

---

## Known constraints and traps

**Date granularity is days only.** There is no time-of-day parameter. Leaderboard
periods must be whole days: monthly, weekly (Mon–Sun), or 1–15 / 16–EOM. A
leaderboard that "resets Friday at 6pm" is not buildable against this API.

**Timezone of `start_at` / `end_at` is UNCONFIRMED.** Assume UTC for now, store
the assumption explicitly in `periods.timezone`, and show the countdown in the
visitor's local time with the reset time labelled.

**`id` is stable, `username` is not.** Primary key on `rainbet_id`. Refresh
`username` on every sync. Building on username will split or lose users when
someone renames.

**`target_edge` is a UX trap.** The player sees $100,000 in their Rainbet account
and $12,500 on our site. This generates angry Discord messages. The rules page
must explain it with a worked example, and the leaderboard table should show
both a raw and a weighted column if two keys are available.

**Past-period amounts can change retroactively** (refunds, bonus abuse). This is
precisely why we freeze snapshots rather than re-querying.

---

## Data model

| table | purpose |
|---|---|
| `periods` | `start_at`, `end_at`, `timezone`, `prize_pool`, `prize_distribution` (JSON), `status` (`upcoming` / `live` / `closed`) |
| `live_entries` | `period_id`, `rainbet_id`, `username`, `wagered_amount`, `rank` — replaced each sync |
| `final_results` | same fields + `prize`, `frozen_at` — **write once, never update** |
| `sync_log` | `fetched_at`, `cache_updated_at`, `status`, `error_code` |
| `merch_items` | `name`, `price`, `image_url`, `buy_url`, `position`, `active` — public `/store` page (brand: TypeShit, Printful-fulfilled via Shopify), managed from `/admin/merch`; placeholder rows until real Shopify data is wired in |

Also needed: a `blacklist` of `rainbet_id`s (the streamer's own accounts,
disqualified users) filtered out before ranking.

Beyond Phase 1's core tables, `tournament_slots`, `tournament`, `bonus_hunt`,
and `bonus_hunt_entries` back the admin-only `/admin/tournaments` and
`/admin/bonus-hunt` tools (see `db/migrations/0003_dynamic_features.sql` and
`0004_tournament_prize.sql`).

---

## Cron logic

```
1. fetch the active period
2. call the API with its start_at / end_at
3. on success  → upsert live_entries, write sync_log with cache_updated_at
   on failure  → write sync_log with the error code, LEAVE DATA UNTOUCHED
4. if end_at has passed →
      copy live_entries → final_results
      apply prize_distribution
      set status = closed
5. activate the next period
```

Step 3's failure branch is what separates a professional site from one showing
`$0.00`. Do not skip it.

---

## Build phases

- **Phase 0** — obtain a personal Rainbet affiliate API key. It returns
  `{"affiliates": [], "cache_updated_at": "..."}` (empty, no referrals) which is
  enough to verify auth, response shape, and every error code.
- **Phase 1 — CURRENT.** Schema + `lib/rainbet.ts` + `lib/mask.ts` + cron route.
  **No UI whatsoever.** Verify the pipeline in the console first.
- **Phase 2** — leaderboard page: SSR, podium, table, countdown, search box.
- **Phase 3** — home, milestones, rules, instructions, Kick embed, socials.
- **Phase 4** — visual design and mobile.
- **Phase 5** — dry run across one complete real period before announcing.
- **Phase 6** — launch.
- **Phase 7** — `/admin`: password from an env var, not a full auth system.
  Shows sync status, a manual sync button, period editing, blacklist, error log.

Do not jump ahead a phase unless asked.

---

## File layout

```
app/
  page.tsx                    home (server component)
  leaderboard/page.tsx        SSR from our DB
  milestones/page.tsx         static
  rules/page.tsx              NOT optional
  api/
    cron/sync/route.ts        protected by CRON_SECRET
    search/route.ts           accepts full username, returns masked row only
lib/
  rainbet.ts                  server-only API client
  mask.ts                     server-only masking
  periods.ts                  active period + rollover logic
  db.ts
components/
  Countdown.tsx               "use client"
  SearchBox.tsx               "use client"
  Podium.tsx, Table.tsx       server components
```

---

## Masking rule

```
length > 4   → first 2 + '*' × (length - 4) + last 2
length 3–4   → first 1 + '*' × (length - 2) + last 1
length ≤ 2   → '*' × length          (reveal nothing)
```

The 2–3 character case is the one that gets forgotten and leaks a near-complete
username. Write it in from the start.

---

## Working style

- Work **file by file**, within the current phase. Do not scaffold the entire
  project in one pass.
- **Seed 12 periods ahead** so the streamer needs no admin access for a year.
- The rules page is a deliverable, not a nice-to-have.
- The footer must carry: 18+, a responsible-gambling link, and an affiliate
  disclosure.
- Rate-limit `/api/search` so nobody can brute-force the username list.

---

## Open questions — awaiting the Rainbet affiliate manager

1. What timezone are `start_at` / `end_at` evaluated in?
2. Is `target_edge` configured on our key? Can we have two keys, one weighted and
   one raw?
3. Are there rate limits on the endpoint?
4. Is there pagination if the referral count grows large?
5. Can `wagered_amount` for a closed period change retroactively?

Until #1 is answered, treat the reset time as an assumption, not a fact.

---

## Environment variables

```
RAINBET_API_KEY               server-only, never NEXT_PUBLIC_
CRON_SECRET                   bearer token checked by /api/cron/sync
DB_HOST
DB_PORT                       default 3306
DB_USER
DB_PASSWORD                   server-only
DB_NAME                       wager_leaderboard
ADMIN_PASSWORD                phase 7
```

`.env.local` must be in `.gitignore` before the first commit.
