# Structured court pricing and parking

Court submissions now store parking availability and pricing as structured values instead of relying on display text.

- `parking_status` was introduced here and simplified to `available` or `unavailable` by migration `0030`. Migration `0028` removed the source text column.
- `price_amount_cents` stores PHP amounts in centavos and `price_unit` records the billing basis. Migration `0028` adds structured statuses and maximum amounts, converts existing records, then removes `price_range`.
- Operating hours moved to normalized per-day periods in migration `0029`; the former summary JSON is no longer read or stored.

Apply with `pnpm db:migrate` before deploying code that writes the new fields.
