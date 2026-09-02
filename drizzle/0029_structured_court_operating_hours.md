# Structured court operating hours

Court availability now uses normalized operating periods rather than display-text JSON.

- `venue_operating_periods` stores ISO weekday (`1` Monday through `7` Sunday), sequence, opening time, and closing time.
- Equal opening and closing times represent a 24-hour day. A closing time earlier than its opening time represents an overnight period.
- Multiple periods may be stored for one day by increasing `sequence`.
- The migration converts existing structured weekday/weekend JSON, explicit 24-hour schedules, and unambiguous single-range daily schedules.
- Ambiguous source text such as “call for schedule,” incomplete ranges, and irregular club-day prose is intentionally not guessed. Those courts have no operating periods until an admin verifies them.
- The legacy `venues.hours` JSON column is dropped after conversion. Runtime filtering never parses display text.

Apply with `pnpm db:migrate` before deploying code that reads `venue_operating_periods`.
