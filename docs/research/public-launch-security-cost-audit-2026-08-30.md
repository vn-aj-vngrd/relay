# Public-launch security and cost audit — 2026-08-30

## Release decision

**Do not open unrestricted signup yet.** Relay has a solid server-side authorization baseline, parameterized Drizzle queries, Zod validation at most mutation boundaries, private storage buckets, distributed application limits, security headers, and no known production dependency vulnerabilities. However, production currently exposes link-only game and chat data through Supabase PostgREST, signup is open without CAPTCHA or verified email, and an origin-database limiter cannot absorb a volumetric attack before Supabase is touched.

No application can be declared “free from threats,” and a Supabase Free project cannot provide a contractual high-availability guarantee. The practical launch target is: **invite-only beta, hard usage ceilings, minimal public data, edge-layer abuse rejection, monitoring, and a tested shutdown switch.**

## P0 — fix before public traffic

### 1. Link-only games and chat are enumerable through the public Data API

Production checks using only the browser-safe publishable key returned rows from `profiles`, `sessions`, and `messages`. The returned session was `visibility=link`; no shared slug was supplied to authorize the request. Full table policies also make fields not intended as public DTOs selectable, including profile setup metadata and session booking fields.

Root cause:

- `drizzle/0000_initial_relay_schema.sql` grants `public` reads to complete profile and link-session rows.
- `drizzle/0007_public_session_workspace.sql` grants `anon` reads to collaborative tables whenever the parent session is public **or link-only**.
- RLS can test row fields, but it cannot prove that a generic PostgREST caller arrived with or knows the shared slug.

Correction prepared in `drizzle/0022_restrict_data_api_exposure.sql`: broad Data API policies and grants are removed. Relay’s current code reads this data through the server-only Drizzle layer, so shared pages remain available by slug without making every link game globally queryable.

**Important:** this is not fixed in production until migration `0022` is applied and the four verification requests in its companion Markdown file fail closed.

### 2. Open signup has weak bot friction

`supabase/config.toml` currently has all of the following:

- `enable_signup = true`
- CAPTCHA disabled
- email confirmation disabled
- password accounts receive a session immediately

The application adds IP/account limits, and Supabase Auth has its own limits, but each application limit writes to the origin database. A botnet can create many identities and multiply every per-user quota. Unverified email also permits accounts using addresses the user does not control.

Migration `0023_signup_account_cap` adds a Supabase Before User Created hook with an administrator-managed global cap, initially 200 accounts. The hook serializes concurrent capacity checks, includes Admin API accounts, and fails closed. This bounds account-driven growth but does not stop attempts or prevent attackers from consuming available places.

**Recommended limited launch:** keep the 200-account cap and enable Cloudflare Turnstile for signup, password sign-in, and recovery. Before expanding beyond a small beta, enable verified email through production SMTP, enable leaked-password protection, and test account enumeration behavior.

### 3. Edge controls must reject abuse before application code

The PostgreSQL limiter is useful for business abuse across serverless instances, but every check consumes a database operation and connection. It is not a DDoS boundary.

Before launch, configure Vercel Firewall controls for at least:

- `/signup`, `/login`, and `/auth/*`
- Server Action POST traffic
- `/api/venues/tiles/*`
- `/api/search`, `/api/games`, and `/api/admin/*`

Start with rate limiting/challenges rather than broad IP blocks. Keep Vercel’s managed DDoS protection enabled. Validate rules from a preview deployment before production.

## P1 — high priority

### 4. Public pages repeatedly reach origin services

The production landing page returned `Cache-Control: private, no-cache, no-store` and `x-vercel-cache: MISS`. It renders a live court directory and map; cold tile requests can invoke Relay, write a rate-limit bucket, and call Geoapify. This turns anonymous marketing traffic into Vercel, PostgreSQL, and provider work.

Recommended launch mode:

1. Render the marketing court showcase from a cached/static reviewed snapshot.
2. Load the interactive map only after explicit user intent, not on landing-page load.
3. Cache public court DTOs with a long revalidation period.
4. Restrict `proxy.ts` token refresh to routes that actually need session refresh; it currently matches almost every dynamic request.
5. Add provider-side Geoapify quota alerts and the smallest daily quota that still supports beta traffic.

### 5. Missing Content Security Policy

Production has HSTS, clickjacking denial, `nosniff`, referrer, and permissions headers, but no CSP. React escapes ordinary text and the reviewed JSON-LD replacement protects `<`, which lowers injection risk, but CSP is still an important final XSS/injection boundary.

Implement CSP in report-only mode first. Account for Next.js scripts, the inline theme/service-worker bootstrap, Supabase, MapLibre workers, map images, and Vercel Analytics. A nonce CSP forces dynamic rendering and can increase origin cost; evaluate Next.js’s current hash/SRI option or a carefully tested static policy before choosing.

### 6. Authenticated mutation quotas are incomplete

Existing limits cover auth, session creation, RSVP, chat messages, uploads, search, feedback, courts, tiles, analytics, and admin pagination. High-frequency toggles and live-play mutations are authorized but not consistently rate-limited. A compromised legitimate account could generate sustained database/realtime writes.

This audit tightens the beta limits for game creation, payment-request creation, and chat image uploads. Add coarse per-user mutation budgets to reactions, roster toggles, play/score actions, group creation/membership, and profile changes. Prefer one shared mutation-budget helper so future Server Actions are deny-by-default rather than relying on reviewers to remember each call site.

### 7. Upload limits were too generous for a 1 GB storage tier

Memory uploads allow up to 10 MB and previously allowed 20 per user per day. Chat could upload up to 30 images per minute per player without a daily image budget. Payment QR and receipt MIME types were accepted without checking file signatures.

Prepared corrections add a 10-image/day chat budget, limit payment-request creation to five/day, and verify QR/receipt signatures. Still recommended:

- reduce memories to 5 MB and 5 uploads/day during beta;
- enforce total object count/bytes per user and per game, not only attempt rate;
- add lifecycle cleanup for abandoned upload objects;
- retain private buckets and short-lived signed URLs;
- never enable video memory upload on Free without a separate budget.

### 8. Connection fan-out threatened free database availability

`src/db/client.ts` previously allowed ten PostgreSQL clients per Vercel instance. Under serverless concurrency, many instances could multiply that number and exhaust the pooler before request limits helped.

Prepared correction limits each serverless instance to one database client with short idle/connect timeouts. The admin overview also consolidates seven independent count requests into one aggregate query. The transaction pooler remains the cross-instance concurrency boundary.

## P2 — defense in depth and operations

### 9. Admin assurance

Admin authorization is rechecked server-side against `ADMIN_EMAILS`, and sensitive actions are audited. Before adding another admin:

- require TOTP MFA and recent re-authentication for destructive actions;
- keep the allowlist to one owner during beta;
- alert on admin account email/password/MFA changes;
- rotate the Supabase secret key and database password after any accidental exposure.

### 10. Database and Data API posture

- Run Supabase Security Advisor after every migration.
- Verify every exposed table has RLS and least-privilege grants.
- Keep `rate_limit_buckets` inaccessible to Data API roles.
- Consider exposing no `public` tables through PostgREST unless the browser demonstrably needs them; use minimal views/RPCs rather than whole-table policies.
- If practical with the chosen Vercel networking plan, restrict direct PostgreSQL network access. Network restrictions do not protect Auth, Storage, or PostgREST HTTPS endpoints.

### 11. Monitoring, response, and hard stops

Create alerts at 50%, 75%, and 90% of database size, storage, egress, realtime messages/connections, Auth MAU, Vercel function invocations, data transfer, and Geoapify requests. Review daily during launch week.

Maintain tested switches for:

1. disabling signup;
2. disabling uploads;
3. disabling map tiles/third-party provider calls;
4. making shared games read-only;
5. temporarily blocking all non-admin mutation POSTs.

Back up data before launch and test restoration. Free-tier quota caps may prevent surprise Supabase overage billing, but quota restriction is an availability failure, not protection from downtime.

## Positive findings

- Secrets are untracked and server-only; no credential pattern was found in tracked files.
- Drizzle’s parameterized query builder is used; no unsafe raw SQL construction was found.
- React renders user text rather than injecting it as HTML. The intentional JSON-LD insertion escapes `<`.
- Server Actions generally re-authenticate and authorize ownership/host/admin access inside the action.
- Uploads use private buckets where appropriate, server-generated random paths, size/MIME checks, and signed URLs.
- Guest tokens are random, stored as hashes, and held in secure HTTP-only cookies.
- Security headers are present in production.
- `pnpm audit --prod --audit-level moderate` reported no known vulnerabilities on 2026-08-30.

## Free-tier launch envelope

Recommended initial policy:

| Resource         |                                        Beta ceiling |
| ---------------- | --------------------------------------------------: |
| Accounts         |                       Invite-only; 100–250 accounts |
| Admins           |                                                   1 |
| Games created    |              5/user/day; add a global daily ceiling |
| Chat text        |          30/player/minute plus a daily write budget |
| Chat images      |                           1 MiB each; 10/player/day |
| Memory images    |                              5 MiB each; 5/user/day |
| Payment requests |                                          5/host/day |
| Realtime         | One Broadcast channel per mounted game; no Presence |
| Public map       |   Click-to-load; cached tiles; provider daily quota |

These are operational starting points, not security guarantees. Tighten them using observed legitimate usage and increase only one dimension at a time.

## Required pre-launch checklist

- [x] Apply migration `0022` and verify anonymous Data API access fails closed.
- [x] Apply migration `0023`, push the Auth hook configuration, and verify the admin-managed account cap.
- [ ] Enable CAPTCHA and verified email before expanding open signup beyond the capped beta.
- [x] Confirm production Supabase Auth rate limits match reviewed values.
- [x] Configure and test a Vercel authentication rate-limit rule.
- [x] Confirm Supabase and Vercel free plans cannot bill overages; add a 2,500-tile/day server budget below Geoapify Free’s provider allowance.
- [x] Make the public map click-to-load and cache public court data.
- [x] Ship CSP report-only; monitor violations before enforcement.
- [x] Require MFA for every admin.
- [x] Run formatting, lint, typecheck, tests, and the production build. Authenticated E2E remains manual.
- [x] Create and validate a private logical database backup, then restore it into an isolated PostgreSQL 17 instance and verify tables, migrations, signup capacity, and Auth users.
- [x] Document and implement a one-command emergency read-only mode.

## Verification performed

- `pnpm format:check`: passed.
- `pnpm lint`: passed.
- `pnpm typecheck`: passed.
- `pnpm test`: 96 files and 271 tests passed.
- `pnpm audit --prod --audit-level moderate`: no known vulnerabilities.
- `pnpm build`: passed locally and on Vercel after admin data queries were made request-only. The production admin overview reduced seven count requests to one aggregate query and runs with one database client per serverless instance.
- Anonymous production PostgREST probes confirmed the profile/session/message exposure; `rate_limit_buckets` correctly returned an authorization failure.
- Production browser smoke check found no console errors on the landing page and confirmed security headers plus CSP report-only.
- Five consecutive production `/admin` requests completed without runtime errors after the database timeout correction.
- The only allowlisted production administrator has a verified TOTP factor.
- The private custom-format backup restored into an isolated PostgreSQL 17 instance: 31 public tables, 24 migration records, account cap 200, and 2 Auth users. Supabase-only `pg_cron` and Vault extensions were excluded from the local drill.
- Public court maps now require an explicit click, retain 30-day CDN caching, and stop at a global 2,500 tile requests per day.

## Primary sources

- [Supabase pricing and included Free quotas](https://supabase.com/pricing)
- [Supabase billing and cost controls](https://supabase.com/docs/guides/platform/billing-on-supabase)
- [Supabase Auth rate limits](https://supabase.com/docs/guides/auth/rate-limits)
- [Supabase CAPTCHA protection](https://supabase.com/docs/guides/auth/auth-captcha)
- [Supabase API security and RLS](https://supabase.com/docs/guides/api/securing-your-api)
- [Supabase database security](https://supabase.com/docs/guides/database/secure-data)
- [Vercel Hobby plan limits](https://vercel.com/docs/plans/hobby)
- [Vercel DDoS mitigation](https://vercel.com/docs/vercel-firewall/ddos-mitigation)
- [Vercel WAF rate limiting](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting)
- Local installed Next.js guides: `node_modules/next/dist/docs/01-app/02-guides/data-security.md`, `server-actions.md`, and `content-security-policy.md`
