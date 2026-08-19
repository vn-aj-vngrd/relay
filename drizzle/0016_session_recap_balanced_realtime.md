# Session recap, balanced play, and realtime invalidation

## Intent

Adds the durable participation context and efficient session-wide invalidation needed for Balanced Mix, multi-court scoring, and completed-session recaps.

## Data changes

- Adds `balanced` to `rotation_mode`.
- Adds `session_players.skill_level` as a session snapshot of self-described playing experience.
- Backfills account participants from `profiles.skill_level`; guests and future RSVPs set the snapshot directly.

Playing experience is recreational context, not a rating. Historical session values do not change when an account later edits its profile.

## Realtime model

`relay_broadcast_session_change()` resolves the owning session for direct and nested collaborative records. Row triggers send a public Broadcast invalidation to `session:<session-id>` with only table name and operation. No row values or private payment/message content enter the payload.

The shared link requires account-optional updates, so the invalidation topic is public. Authoritative reads remain in server queries with their existing visibility and participant checks. Notifications remain on their user-filtered Postgres Changes subscription.

Covered state:

- session plan and roster
- courts, matches, score events, pair assignments, and queue
- chat messages and reactions
- expenses and player repayment state
- memory media, comments, and reactions

## Concurrency

Score writes continue to compare a match version. The client may optimistically batch points, but the database accepts one absolute score only when the expected version matches and records the resulting score event.

## Apply

```bash
corepack pnpm db:migrate
```

## Verify

1. Existing account participants inherit their profile playing experience.
2. A database mutation emits one `changed` event on the owning session topic without row data.
3. Nested payment, match-score, reaction, and memory changes resolve the correct session.
4. An anonymous shared-link viewer receives invalidations but still cannot read unauthorized records.
5. Balanced Mix persists as a valid session rotation mode.
