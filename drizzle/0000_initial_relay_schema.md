# Initial Relay schema

Companion to [`0000_initial_relay_schema.sql`](./0000_initial_relay_schema.sql).

## Purpose

Creates Relay’s complete V1 relational model and the minimum Supabase platform configuration needed before application data is connected.

## What it changes

- Creates 10 domain enums and 24 public tables.
- Adds primary keys, foreign keys, uniqueness rules, checks, and live-state version columns.
- Mirrors new or updated `auth.users` identities into `public.users` through `public.sync_auth_user()`.
- Creates public `avatars` and `venue-photos` storage buckets.
- Creates private `payment-qrs`, `booking-screenshots`, and `session-memories` buckets.
- Enables row-level security on every application table. Direct Data API access is deny-by-default unless the migration defines a policy.
- Adds narrow read/self-service policies for profiles, public sessions, venues, venue photos, and notifications.
- Adds courts, matches, score events, queue entries, messages, and message reactions to `supabase_realtime`.

Private media policies remain intentionally closed until their object paths and participant authorization are implemented in the corresponding vertical slice. Server-side Drizzle mutations must still authorize every action; RLS is defense in depth.

## Apply

The integration wizard exports `DATABASE_URL` and runs the migration after explicit confirmation:

```bash
ENV_FILE=.env.local ./scripts/setup-integrations.sh
```

To apply it directly:

```bash
set -a
source .env.local
set +a
corepack pnpm db:migrate
```

**Complete when:** `drizzle.__drizzle_migrations` contains one applied migration, all 24 public tables exist, the five storage buckets exist, and the six collaborative tables appear in `pg_publication_tables` for `supabase_realtime`.

## Verify

Run in the Supabase SQL editor:

```sql
select count(*) as public_table_count
from information_schema.tables
where table_schema = 'public' and table_type = 'BASE TABLE';

select id, public from storage.buckets order by id;

select tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
order by tablename;
```

Expected application table count: `24`. Supabase may add unrelated public tables later; treat a count above 24 as informational.

## Rollback

This is the baseline migration. Rollback destroys session history and storage metadata, so use a Supabase project reset before production data exists rather than maintaining a destructive down migration.

For a disposable project, delete and recreate the Supabase project. For any project containing user data, restore a database backup or write a reviewed forward migration.
