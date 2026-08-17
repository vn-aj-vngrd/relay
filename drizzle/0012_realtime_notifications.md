# Realtime notifications

## Purpose

Deliver new in-app notifications to a signed-in user without requiring page refreshes.

## Changes

- Sets `public.notifications` to `REPLICA IDENTITY FULL` so update and delete events retain enough row identity for filtered subscriptions.
- Adds `public.notifications` to the existing `supabase_realtime` publication.

## Authorization

Realtime delivery continues to use the existing row-level `SELECT` policy: authenticated users can receive only rows where `user_id = auth.uid()`. Application mutations remain server-authorized.

## Operations

Apply with `pnpm db:migrate`. Verify `public.notifications` appears in `pg_publication_tables` for `supabase_realtime`, then create a notification for one test user and confirm no other user receives it.

Rollback requires removing `public.notifications` from the publication. Restoring the previous replica identity is optional and does not affect row data.
