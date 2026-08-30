# Performance query indexes

## Purpose

Keeps the authenticated collection paths bounded as Relay history grows. These indexes support notification keyset pagination, recent-first session chat, group membership lookup, and group session history without changing authorization or data semantics.

## What changes

- `group_members_user_joined_idx` supports a player’s group directory in stable join order.
- `messages_session_created_id_idx` supports the newest bounded chat window and a stable older-message cursor.
- `notifications_user_created_id_idx` supports newest-first notification keyset pagination.
- `sessions_group_starts_id_idx` supports a group’s upcoming and completed game queries.

The `id` tie-breakers prevent duplicate or skipped rows when timestamps are equal. No cache is introduced for private data; reads remain authoritative.

## Verify

After applying the migration:

1. Confirm all four indexes exist in `pg_indexes`.
2. Run `EXPLAIN (ANALYZE, BUFFERS)` for a user notification page ordered by `created_at DESC, id DESC` and a session message page ordered the same way.
3. Confirm `/notifications` loads older pages without duplicates and chat displays the newest messages in chronological order.
4. Run the authenticated production E2E workflow.

Small beta datasets may still use a sequential scan because PostgreSQL correctly estimates it as cheaper. The plan should switch to the indexes as the tables grow.

## Rollback

Drop the four indexes by name. Rollback affects performance only; it does not remove data or restore the former unbounded notification query.
