# Explicit pre-Play arrangements

Adds `sessions.booking_not_required` and `sessions.payment_deferred`, both defaulting to false. These are explicit host/co-host decisions, not inferred from a missing booking or price.

## Behavior

- Starting Play requires four eligible players, a confirmed booking or no-booking-needed decision, and Free, a saved repayment split, or an explicit settle-after-Play decision.
- Arrival, court availability, selected rotation and fixed-pair requirements are validated before activating matches. The server re-reads prerequisites and organizer authority while holding the session lock.
- The new choices do not collect money, mark deferred games Free, or make an unpriced game publicly discoverable.
- Existing live games continue unchanged. Readiness is shown only before Play, never as an incomplete percentage during live play or recap.
- Existing future games with unresolved arrangements must explicitly resolve them before starting. Existing confirmed bookings, Free games, and repayment splits remain recognized.
- Booking reference, total and notes are cleared when an organizer explicitly changes the arrangement away from a confirmed booking; the UI warns before saving.

## Deployment

Apply this additive migration before deploying application code that selects the new columns. No backfill is needed and no live session, match, queue, score, payment or historical record is rewritten. Migration generation does not apply it.

Rollback the application before removing the columns. Removing the columns loses the new explicit choices, so retain them during any rollback window.
