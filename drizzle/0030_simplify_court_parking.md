# Simplified court parking status

Court parking now has two verified states: `available` and `unavailable`.

- Existing `limited` values become `available` because parking still exists.
- Existing `none` values become `unavailable`.
- `NULL` remains “Not listed”; missing source data is not treated as proof that parking is unavailable.
- Filters and court details use the structured status directly and never parse display text.

Apply with `pnpm db:migrate` before deploying code that writes the new enum value.
