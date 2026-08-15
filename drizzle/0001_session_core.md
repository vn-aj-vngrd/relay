# Session core

Adds venue snapshot fields and publication time to `sessions`.

- `venue_name` is required so historical sessions remain understandable when a venue record changes or the host enters an unlisted venue.
- `venue_address` is an optional snapshot.
- `published_at` records when an invite became shareable.

Applied through `pnpm db:migrate`. Existing rows must have a venue name before this migration is applied to a database containing sessions.
