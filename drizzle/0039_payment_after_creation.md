# Payment after game creation

Migration `0039_foamy_firedrake.sql` lets every new game start without payment details.

## Product invariant

- `estimated_cost_cents = NULL` means payment is not set up yet.
- `estimated_cost_cents = 0` means the host explicitly marked the game Free.
- A positive value is the host-provided per-player amount.
- Public games with `NULL` remain shareable by their canonical link but are excluded from Open games and unaffiliated authenticated discovery.

The migration drops `session_public_cost_required`; application discovery queries continue to require a non-null value.

## Apply and verify

```bash
pnpm db:migrate
```

Then confirm that a newly published public game can retain `NULL`, does not appear in Open games, and becomes discoverable after the host marks it Free or adds an amount.
