# Remove legacy court fields

This migration completes the court-directory move from free-text pricing and parking to structured data.

- Every recognized price is converted to a status, starting amount in centavos, optional maximum amount, and billing unit. Free, contact-only, donation, members-only, and invitation-only listings retain their meaning as explicit statuses.
- Bare numeric community fees are treated as per-player amounts; hourly, court-hour, session, and player wording select the corresponding unit.
- `price_range` and `parking` are dropped after conversion. Application reads and writes no longer contain fallback text paths.
- Court import commands now structure source pricing and parking before writing to PostgreSQL.

The migration intentionally leaves unrecognized values as `unknown` rather than preserving ambiguous display text or inventing an amount.
