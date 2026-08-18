# Migration 0014: fixed partner Play

Adds session-scoped pair identities for **Keep pairs together** and **Team Round Robin**.

## Changes

- Adds `round_robin` to `rotation_mode`.
- Adds `session_pairs`, ordered within one session.
- Adds `session_pair_members`, requiring two distinct positions and preventing a session player from belonging to multiple pairs.
- Enables RLS on both tables. Relay accesses pair data through authorized server functions; the Data API receives no direct pair policies.

## Ownership and history

Pairs belong to a session and reference its `session_players`. Restrictive foreign keys prevent deleting a session or player while pair history still exists. Relay’s session deletion transaction removes pair records before roster records. Completed matches continue to snapshot Team A and Team B through `match_players`.

## Apply

```bash
pnpm db:migrate
```

After applying, verify the enum and tables:

```sql
select enum_range(null::rotation_mode);
select to_regclass('public.session_pairs'), to_regclass('public.session_pair_members');
```
