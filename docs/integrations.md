# Integrations runbook

Use this runbook when provisioning Relay, rotating Supabase credentials, changing the Vercel production origin, or diagnosing authentication, storage, database, and realtime setup.

## Provision

Run the guided setup from the repository root:

```bash
./scripts/setup-integrations.sh
```

The wizard creates `relay-pickleball` in Supabase Singapore (`ap-southeast-1`), applies the initial migration, creates and deploys the Vercel project, pushes the reviewed Auth settings from `supabase/config.toml`, and walks through Google OAuth. It writes local credentials to ignored `.env.local` and sends production/preview values directly to Vercel.

The wizard is idempotent at the project and environment level. Re-running it finds the named Supabase project, keeps existing local values when you press Enter, updates Vercel environment variables, and lets Drizzle skip an applied migration.

## Environment contract

| Variable                               | Source                                        | Exposure                  | Destination   |
| -------------------------------------- | --------------------------------------------- | ------------------------- | ------------- |
| `NEXT_PUBLIC_APP_URL`                  | Localhost or Vercel project alias             | Public                    | Local, Vercel |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase project reference                    | Public                    | Local, Vercel |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase API Keys                             | Public                    | Local, Vercel |
| `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED`      | `true` after Google provider setup            | Public                    | Local, Vercel |
| `NEXT_PUBLIC_MAGIC_LINK_ENABLED`       | `true` only after production SMTP is verified | Public                    | Local, Vercel |
| `SUPABASE_SECRET_KEY`                  | Supabase API Keys                             | Secret, server-only       | Local, Vercel |
| `RESEND_API_KEY`                       | Resend API Keys                               | Secret, setup-only        | Local only    |
| `SMTP_FROM_EMAIL`                      | Verified Resend domain sender                 | Setup-only configuration  | Local only    |
| `DATABASE_URL`                         | Supabase Connect → Transaction pooler         | Secret, server-only       | Local, Vercel |
| `SUPABASE_PROJECT_REF`                 | Supabase project                              | Local setup metadata      | Local only    |
| `SUPABASE_REGION`                      | Provisioning decision                         | Local setup metadata      | Local only    |
| `GEOAPIFY_API_KEY`                     | Geoapify project                              | Secret, server-only       | Local, Vercel |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`       | Cloudflare Turnstile widget                   | Public                    | Local, Vercel |
| `TURNSTILE_SECRET_KEY`                 | Cloudflare Turnstile widget                   | Secret, setup-only        | Local only    |
| `HEALTHCHECK_SECRET`                   | `openssl rand -base64 32`                     | Secret, server-only       | Local, Vercel |
| `ADMIN_EMAILS`                         | Relay owner                                   | Secret, server-only       | Local, Vercel |
| `CHAT_IMAGE_MAX_BYTES`                 | Relay upload policy                           | Server-only configuration | Local, Vercel |

`SUPABASE_SECRET_KEY`, `RESEND_API_KEY`, and `DATABASE_URL` must never use a `NEXT_PUBLIC_` prefix. `RESEND_API_KEY` and `SMTP_FROM_EMAIL` are expanded only when `supabase config push` applies Auth SMTP settings; Relay does not need them at runtime. The production sender is `Relay <relay@vanajvanguardia.tech>`. A verified `vanajvanguardia.tech` domain covers that address, so a separately verified `relay.vanajvanguardia.tech` subdomain is unnecessary unless mail should originate from that subdomain.

Use the transaction pooler on Vercel because free deployments require an IPv4-compatible database endpoint. `postgres` is configured with prepared statements disabled for pooler compatibility. `vercel.json` pins application functions to Singapore (`sin1`) so authenticated requests stay close to the Supabase Singapore project and Philippine users.

Geoapify remains server-only and supplies Philippines-bounded map tiles. The dedicated Court Finder and landing-page Court Finder preview load their maps on entry; other compact previews remain click-to-load. Provider responses are cached for 30 days at the CDN, and a server-side global budget stops uncached tile requests after 2,500 per day—below Geoapify Free’s 3,000-credit daily allowance. Create-game court suggestions come directly from Relay’s reviewed court directory; no location-provider autocomplete runs while typing. The court directory and interactive map are restricted to the Philippines. The verified inventory begins with Cebu and grows through reviewed nationwide submissions. `/courts` is the public finder and `/court` is the signed-in finder; legacy `/venues` links redirect permanently to the signed-in route. The internal `/api/venues/tiles/[z]/[x]/[y]` endpoint retains the database-era identifier for compatibility, accepts only tile coordinates intersecting the Philippines, proxies Geoapify raster tiles, and applies CDN caching so the provider key never enters the browser. The UI must retain Geoapify/OpenMapTiles/OpenStreetMap attribution. Never move `GEOAPIFY_API_KEY` into a public variable or browser map bundle.

`pnpm venues:import-cebu` remains the reviewed, idempotent import for the initial Cebu inventory after migration `0019_cebu_court_directory`. `pnpm venues:import-ph` validates the committed nationwide SM Active Hub and Philippine Pickleball Federation snapshots as a dry run; add `-- --apply` only after reviewing its duplicate report. Current first-party SM facilities and federation records with separately reviewed exact coordinates may be verified. Federation records without precise coordinates remain unverified candidates and never appear as fabricated map pins. Both imports retain source provenance and exclude personal directory contacts, third-party photos, reviews, and editorial copy. Run them manually after reviewing every source and its robots policy; continuous scraping is intentionally absent. Community submissions from anywhere in the Philippines remain pending until an allowlisted admin verifies the source, supplies in-country coordinates, and approves them. See [`research/philippines-court-expansion-2026-09.md`](./research/philippines-court-expansion-2026-09.md) for the current source and verification audit.

## Authentication smoke test

Password authentication is the production baseline. Public signup, password login, and recovery fail closed unless Cloudflare Turnstile’s site and secret keys are configured; Relay forwards each completed widget token to Supabase Auth for one authoritative server-side verification. Email confirmation must be enabled only together with verified production SMTP, because Supabase’s built-in sender is not a public-production mail service.

Every Supabase Auth email used by Relay is source-controlled under [`../supabase/templates/`](../supabase/templates/): account confirmation, recovery, magic link, invitation, email change, reauthentication, and the password-changed security notice. Each uses the same email-safe Relay shell, typography, palette, and footer. Keep required Supabase variables such as `{{ .ConfirmationURL }}` and `{{ .Token }}` unchanged. `supabase config push` installs these templates in the hosted project and keeps local Auth aligned. An email from `noreply@mail.app.supabase.io` means custom SMTP is not active; successful production delivery must come from `Relay <relay@vanajvanguardia.tech>` through Resend.

The Supabase **Before User Created** hook enforces the singleton `public.signup_settings.account_cap` before every Auth identity is created, including Admin API accounts. The cap starts at 200 and is changed from Admin Console → Overview. The hook and admin action share a transaction advisory lock so concurrent signups cannot exceed the final place. Missing settings fail closed. Apply migration `0023_signup_account_cap` before pushing `supabase/config.toml`, or Auth will reject all account creation until the hook function exists.

1. Open `/login` on localhost.
2. Create a password account, verify the custom confirmation email arrives through Resend, follow its single-use link, confirm Relay reaches authenticated home, then sign out and sign in again.
3. With Resend SMTP configured, open `/forgot-password`, request a reset for a known account, and verify Resend logs show mail from `Relay <relay@vanajvanguardia.tech>`.
4. Follow the reset link, confirm `/update-password` accepts a new password, signs the recovery session out, and returns to `/login` with a success message. Verify the link cannot be reused.
5. Sign in with the new password, open Preferences → Change password, and confirm the current-password flow works. Confirm an incorrect current password fails without changing it.
6. When production SMTP is configured, set `NEXT_PUBLIC_MAGIC_LINK_ENABLED=true`, request a magic link, and confirm it returns through `/auth/callback`.
7. When Google is configured, continue with Google and confirm the consent screen returns to Relay.
8. In Supabase Authentication → Users, verify one identity per enabled method.
9. In the SQL editor, verify the same IDs exist in `public.users`.
10. In Admin Console → Overview, set the account limit to the current registered-user count and confirm a new signup is rejected without creating an Auth user.
11. Raise the limit by one, confirm one signup succeeds, and restore the intended launch limit.

**Complete when:** password authentication creates a persistent session, the capacity boundary fails closed, and every enabled optional method passes its callback flow. Supabase’s built-in mailer is test-only; never enable magic links in production without custom SMTP.

## Storage contract

- Public: `avatars`, `venue-photos`.
- Private: `payment-qrs`, `payment-proofs`, `booking-screenshots`, `session-memories`.
- Avatar objects use `<user-id>/<filename>` so the baseline ownership policy can authorize them.
- Payment proof objects use `<session-id>/<payment-id>` and are replaced in place so each payment has one current proof.
- Chat photos default to a 1 MiB limit through `CHAT_IMAGE_MAX_BYTES`; increase it only after reviewing Supabase Storage usage and upload latency.
- Private media stays inaccessible through the Data API until its feature adds participant/host path policies. Server-generated signed URLs must be short-lived.

**Complete when:** anonymous users can read a public test asset, cannot read a private test asset, and an authenticated user can only mutate avatar objects under their own ID prefix.

## Realtime contract

Session collaboration uses one public Broadcast topic per mounted session: `session:<session-id>`. Database triggers from migration `0016_session_recap_balanced_realtime` resolve direct and nested session records and send only `{ table, operation }` invalidations through `realtime.send()`—never row data. The shared link needs account-optional updates, so topic secrecy is not an authorization mechanism. Every client refetches authoritative server queries after subscription, reconnect, or a coalesced invalidation.

Broadcast covers roster, courts, matches, score events, queue, pair assignments, chat, payments, and memories. Score writes remain version-checked and are debounced client-side into absolute score snapshots. Presence is intentionally absent until online state improves a real session decision.

`notifications` remains in `supabase_realtime` and uses user-filtered Postgres Changes. Existing collaborative tables may remain in the publication for migration compatibility, but session clients do not open one logical-replication subscription per table.

Authenticated Data API access still depends on the self-membership `SELECT` policy from migration `0013_realtime_participant_membership`; without it, participant-scoped table reads fail even when an invalidation arrives.

## Abuse controls

Migration `0020_admin_pagination_security` adds a server-only fixed-window limiter backed by PostgreSQL. It stores SHA-256 bucket keys rather than raw IP addresses, emails, user IDs, or guest tokens. `anon` and `authenticated` have no table access; server code uses `DATABASE_URL`. Supabase Cron removes expired buckets hourly.

Application limits protect authentication attempts, admin pagination, search, Geoapify tiles, feedback and court submissions, session creation and RSVP, chat, storage uploads and public analytics. Supabase Auth permits up to 30 authentication emails per hour through custom SMTP. Relay permits 10 signup attempts per account and 30 per IP per hour; tighter password-reset limits remain 3 requests per account and 8 per IP per hour. Vercel Firewall and Supabase Auth rate limits remain independent outer controls. A 429 response includes `Retry-After`; do not retry it in a tight loop.

**Complete when:** anonymous PostgREST access to `rate_limit_buckets` is denied, a test identity exceeds a low test limit atomically, and the cleanup Cron appears in Supabase Cron.

## Scheduled reminders

Supabase Cron runs `public.create_session_reminders()` every 15 minutes through the `relay-session-reminders` job. It creates account-only in-app notifications for tomorrow’s games and games starting in roughly one hour. `notifications.dedupe_key` makes overlapping windows and retries idempotent. Inspect runs in Supabase Dashboard → Integrations → Cron.

**Complete when:** calling the function once creates reminders for eligible going players, calling it again creates none, and the Cron history shows successful 15-minute runs.

## Database migration

Read [`../drizzle/0000_initial_relay_schema.md`](../drizzle/0000_initial_relay_schema.md) before applying or repairing the baseline migration. Generate later schema changes with `pnpm db:generate --name <readable_name>` and add a companion Markdown file when a migration changes authorization, deletion behavior, historical data, or platform configuration.

## Progressive Web App

Relay publishes `/manifest.webmanifest`, standard and maskable PNG icons, and a root-scoped `/sw.js`. The service worker caches only the offline document, app icons, the manifest, and immutable `/_next/static/` assets. It never caches authenticated HTML, API responses, RSC payloads, payment proof images, chat images, map tiles, or third-party requests. Navigation remains network-first and falls back to `/offline` only when the network fails.

`experimental.useOffline` keeps supported Next.js navigations and Server Actions pending until connectivity returns. The global offline indicator communicates that state; direct client `fetch()` calls retain their own error behavior. Test offline behavior with `pnpm build && pnpm start`, not `next dev`. Development unregisters any production worker left on the localhost origin and clears Relay’s service-worker caches before hydration; this prevents cached development chunks from causing hydration mismatches.

When changing service-worker caching behavior, bump `VERSION` in `public/sw.js`, deploy, and verify the old cache is removed during activation. Keep `/sw.js` on `no-cache, no-store` and never add private application routes to `PRECACHE`.

## Admin console

`ADMIN_EMAILS` is a comma-separated, case-insensitive allowlist for `/admin`. Keep it server-only and configure it independently in Vercel Preview and Production. Every admin page and Server Action checks the allowlist; navigation visibility is only a convenience, never the authorization boundary.

The admin directory uses **Courts** as its product label and `/admin/courts` as its canonical route; database, audit, and API identifiers remain `venues` for compatibility. Legacy `/admin/venues` links redirect to Courts.

After changing the allowlist, redeploy the affected Vercel environment. Every allowlisted administrator must enroll and verify a TOTP authenticator at `/admin-security`; admin pages, actions, and APIs require an `aal2` session and redirect an `aal1` session to that setup/challenge route. Verify an allowlisted account can complete MFA and open `/admin`, a normal account reaches `/admin-access-denied`, and all user suspension, restoration, and game cancellation events appear in the audit log.

## Health monitoring

`GET /api/health` is a database-free public liveness check. `GET /api/health?deep=1` checks PostgreSQL and requires `Authorization: Bearer $HEALTHCHECK_SECRET`. Keep the secret out of URLs and screenshots. `.github/workflows/health-monitor.yml` checks both paths from outside Vercel every ten minutes using the GitHub `HEALTHCHECK_SECRET` secret. Enable Actions failure notifications, run it manually after each release, and add a second independent alert destination for launch week.

The complete production gate, quota alerts, backup drill, and field acceptance criteria live in [`PUBLIC_RELEASE_AUDIT.md`](./PUBLIC_RELEASE_AUDIT.md).

## Emergency read-only mode

Pause all product writes while retaining reads and authentication:

```bash
./scripts/set-production-read-only.sh on
```

The command updates the production Vercel environment and deploys it. Server Actions redirect to `/read-only`; mutating Route Handlers return `503` with `Retry-After`. Login, signup, MFA, callback, and temporary-password routes remain available. Restore writes with:

```bash
./scripts/set-production-read-only.sh off
```

Smoke-test a read and a blocked write after either command. The mode is an availability control, not a substitute for a database backup.

## Credential rotation

1. Create the replacement Supabase secret key before revoking the old key.
2. Re-run the wizard and enter the replacement when prompted.
3. Redeploy and complete all authentication smoke tests.
4. Revoke the old key only after production passes.
5. For a database password rotation, copy a fresh transaction-pooler URI and update both local and Vercel environments before removing the old credential.

**Complete when:** the production deployment passes authentication and database checks using only the replacement credentials.
