# Restrict Data API exposure

## Purpose

Closes broad Supabase Data API reads that allowed anyone holding the public publishable key to enumerate link-only games, chat messages, full profile rows, and related collaboration records without knowing a shared game URL.

Relay already reads this data through its server-only Drizzle data layer. Browser collaboration uses payload-free Realtime Broadcast invalidations, and notifications retain their separate user-scoped Postgres Changes policy.

## What changes

- Drops anonymous policies for profiles, sessions, venues, venue photos, courts, matches, queue entries, messages, and reactions.
- Removes the direct self-update profile policy because Relay profile mutations use authenticated Server Actions.
- Revokes direct Data API table privileges from `anon` and `authenticated` for the affected tables.
- Leaves Supabase Auth, public Storage asset reads, private signed URLs, Realtime Broadcast, and user-scoped notification policies unchanged.

Public pages and shared game links continue to work because their server components query PostgreSQL through `DATABASE_URL` after applying route-specific visibility and authorization checks.

## Verify

Using only the publishable key, each request below must return no rows or a permission error:

```text
/rest/v1/profiles?select=*&limit=1
/rest/v1/sessions?select=*&limit=1
/rest/v1/messages?select=*&limit=1
/rest/v1/venues?select=*&limit=1
```

Then verify:

1. `/`, `/courts`, and a known `/s/<slug>` still render.
2. A participant receives session Broadcast refreshes.
3. A signed-in user receives their notification updates.
4. Public avatars still load and private media still requires a signed URL.

## Rollback

Do not restore the former `link` policies: RLS cannot prove that a Data API caller knows a slug, so those policies make every link-only row enumerable. If direct browser reads become necessary, expose a purpose-built minimal view or RPC with an authorization design that binds each request to the shared capability, then grant only that interface.
