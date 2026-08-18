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
| `DATABASE_URL`                         | Supabase Connect → Transaction pooler         | Secret, server-only       | Local, Vercel |
| `SUPABASE_PROJECT_REF`                 | Supabase project                              | Local setup metadata      | Local only    |
| `SUPABASE_REGION`                      | Provisioning decision                         | Local setup metadata      | Local only    |
| `GEOAPIFY_API_KEY`                     | Geoapify project                              | Secret, server-only       | Local, Vercel |
| `GEOAPIFY_API_URL`                     | Geoapify API origin                           | Server-only configuration | Local, Vercel |
| `ADMIN_EMAILS`                         | Relay owner                                   | Secret, server-only       | Local, Vercel |
| `CHAT_IMAGE_MAX_BYTES`                 | Relay upload policy                           | Server-only configuration | Local, Vercel |

`SUPABASE_SECRET_KEY` and `DATABASE_URL` must never use a `NEXT_PUBLIC_` prefix. Use the transaction pooler on Vercel because free deployments require an IPv4-compatible database endpoint. `postgres` is configured with prepared statements disabled for pooler compatibility. `vercel.json` pins application functions to Singapore (`sin1`) so authenticated requests stay close to the Supabase Singapore project and Philippine users.

## Authentication smoke test

Password authentication is the production baseline and does not depend on email delivery. Email confirmation is disabled in `supabase/config.toml`; accounts receive a session immediately after creation.

1. Open `/login` on localhost.
2. Create a password account, confirm it reaches the authenticated home, sign out, and sign in again.
3. When production SMTP is configured, set `NEXT_PUBLIC_MAGIC_LINK_ENABLED=true`, request a magic link, and confirm it returns through `/auth/callback`.
4. When Google is configured, continue with Google and confirm the consent screen returns to Relay.
5. In Supabase Authentication → Users, verify one identity per enabled method.
6. In the SQL editor, verify the same IDs exist in `public.users`.

**Complete when:** password authentication creates a persistent session and every enabled optional method passes its callback flow. Supabase’s built-in mailer is test-only; never enable magic links in production without custom SMTP.

## Storage contract

- Public: `avatars`, `venue-photos`.
- Private: `payment-qrs`, `payment-proofs`, `booking-screenshots`, `session-memories`.
- Avatar objects use `<user-id>/<filename>` so the baseline ownership policy can authorize them.
- Payment proof objects use `<session-id>/<payment-id>` and are replaced in place so each payment has one current proof.
- Chat photos default to a 1 MiB limit through `CHAT_IMAGE_MAX_BYTES`; increase it only after reviewing Supabase Storage usage and upload latency.
- Private media stays inaccessible through the Data API until its feature adds participant/host path policies. Server-generated signed URLs must be short-lived.

**Complete when:** anonymous users can read a public test asset, cannot read a private test asset, and an authenticated user can only mutate avatar objects under their own ID prefix.

## Realtime contract

Only these collaborative tables belong to `supabase_realtime`:

- `courts`
- `matches`
- `match_scores`
- `session_queue`
- `messages`
- `message_reactions`
- `notifications`

Initial pages render authoritative server snapshots. Clients subscribe only while a live/session-chat route is mounted and refetch the authoritative snapshot whenever a channel subscribes or reconnects. Authenticated delivery depends on the self-membership `SELECT` policy from migration `0013_realtime_participant_membership`; without it, nested participant policies silently reject chat, court, match, and queue events. Score and queue writes must compare the expected `version` to prevent silent overwrites.

## Database migration

Read [`../drizzle/0000_initial_relay_schema.md`](../drizzle/0000_initial_relay_schema.md) before applying or repairing the baseline migration. Generate later schema changes with `pnpm db:generate --name <readable_name>` and add a companion Markdown file when a migration changes authorization, deletion behavior, historical data, or platform configuration.

## Admin console

`ADMIN_EMAILS` is a comma-separated, case-insensitive allowlist for `/admin`. Keep it server-only and configure it independently in Vercel Preview and Production. Every admin page and Server Action checks the allowlist; navigation visibility is only a convenience, never the authorization boundary.

After changing the allowlist, redeploy the affected Vercel environment. Verify an allowlisted account can open `/admin`, a normal account reaches `/admin-access-denied`, and all user suspension, restoration, and game cancellation events appear in the audit log.

## Credential rotation

1. Create the replacement Supabase secret key before revoking the old key.
2. Re-run the wizard and enter the replacement when prompted.
3. Redeploy and complete all authentication smoke tests.
4. Revoke the old key only after production passes.
5. For a database password rotation, copy a fresh transaction-pooler URI and update both local and Vercel environments before removing the old credential.

**Complete when:** the production deployment passes authentication and database checks using only the replacement credentials.
