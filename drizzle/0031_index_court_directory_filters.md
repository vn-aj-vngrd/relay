# Court directory filter indexes

Adds composite indexes for the structured fields used by current client filtering and future server-side directory filtering:

- listing status + environment
- listing status + parking status
- listing status + price status + starting amount

Operating-period lookups already use `venue_operating_periods_venue_day_idx`.
