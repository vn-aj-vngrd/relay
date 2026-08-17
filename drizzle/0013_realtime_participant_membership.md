# Realtime participant membership

## Purpose

Restore authenticated session updates for chat, courts, matches, and the player queue. Their existing Realtime `SELECT` policies verify participation through `public.session_players`; with RLS enabled on that table and no readable membership policy, the nested authorization check sees no rows and silently drops every event.

## Changes

- Lets an authenticated user read only their own `session_players` rows.
- Sets courts, matches, session queue, and messages to `REPLICA IDENTITY FULL` so filtered subscriptions have complete row identity for updates and removals.

## Authorization

The membership policy exposes only rows whose `user_id` equals `auth.uid()`. Guest players remain token-authorized through Server Actions and receive shared-link Realtime events through the existing anonymous policies. Session mutations remain server-authorized.

## Operations

Apply with `pnpm db:migrate`. Verify an authenticated going player receives a newly inserted session message without refreshing, then verify a user outside that session receives no event.

Rollback by dropping `Players read own session membership`. Replica identity may return to `DEFAULT`, though doing so reduces filtered update/delete reliability.
