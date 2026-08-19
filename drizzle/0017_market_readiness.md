# 0017 Market readiness

This migration adds the minimum durable state required for lifecycle measurement, courtside attendance, optional timed rounds, and idempotent reminders.

## Changes

- `product_events` records a small allowlisted set of lifecycle events. It has no client policies; only Relay’s server and allowlisted admin paths may read or write it.
- `session_players.checked_in_at` separates “RSVP going” from “physically here.” Historical RSVP data remains unchanged when a player becomes unavailable for play.
- `sessions.round_duration_minutes` stores an optional 5–60 minute shared-round duration. The active round end is derived from persisted match start times so refresh and reconnect do not reset it.
- `notifications.dedupe_key` makes scheduled reminders safe to retry without sending duplicate in-app notifications.

## Authorization

RLS is enabled on `product_events` without Data API policies. Attendance mutations still pass through server-side session viewer/host authorization. The new session and player columns remain covered by existing table policies and Broadcast invalidation triggers.

## Historical and deletion behavior

Product events retain aggregate lifecycle evidence when a user or session is removed by setting those references to null. Event metadata is restricted in application code to non-sensitive primitives and must never contain names, chat text, payment details, addresses, or scores.

## Rollback note

Dropping these columns removes timer, check-in, reminder idempotency, and lifecycle history. No existing session, roster, score, payment, or memory data is rewritten by this migration.
