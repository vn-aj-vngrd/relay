# Public Open Games

Migration `0026_public_open_games.sql` prepared session discovery without weakening link-only or private access. Its publication-time cost constraint is superseded by `0039_foamy_firedrake.sql`, which lets public games start with payment unset while keeping them outside Open games.

## Product invariant

A public game is globally discoverable and must disclose a cost expectation before publication. Relay stores:

- `estimated_cost_cents = 0` for **Free**;
- a positive value for an estimated per-player cost;
- `NULL` for an unspecified cost, allowed only on link-only and private games.

Application Server Actions enforce the invariant on create and update. The migration also adds `session_public_cost_required`, a database check that rejects public rows with a `NULL` cost. The field remains nullable because link-only/private games may coordinate cost elsewhere and historical sessions retain their original record.

## Legacy data

The migration changes existing `public` sessions with no cost expectation to `link`. It does not guess that an unknown cost was free. Shared links continue working; the sessions simply stop appearing in Open Games and unaffiliated global search results.

## Discovery index

`sessions_public_discovery_idx` supports the authorization and lifecycle prefix used by Open Games: visibility, status, end time, start time, and stable session-ID ordering. Discovery still runs through authenticated server queries and returns a minimal result DTO.

## Authorization

The migration grants no additional Data API or RLS access. Public and link-only shared routes continue to use server-side visibility checks. Private RSVP authorization is independently enforced inside the Server Action for hosts and existing roster identities.

## Apply and verify

```bash
pnpm db:migrate
```

Then verify:

```sql
select visibility, estimated_cost_cents, count(*)
from sessions
group by visibility, estimated_cost_cents
order by visibility, estimated_cost_cents;

select indexname, indexdef
from pg_indexes
where indexname = 'sessions_public_discovery_idx';

select conname, pg_get_constraintdef(oid)
from pg_constraint
where conname = 'session_public_cost_required';

select count(*) as invalid_public_games
from sessions
where visibility = 'public' and estimated_cost_cents is null;
```

`invalid_public_games` must be zero after migration. Confirm a free public game, estimated-cost public game, link-only game, and private game through their respective application paths.
