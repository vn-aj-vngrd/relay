# Court suggestion guardrails

Adds an optional normalized fingerprint to private court change requests and a partial unique index covering unresolved requests. New submissions use the fingerprint to prevent duplicate missing-court reports and repeated updates from the same player for the same court, including concurrent submissions.

Existing requests remain valid with a null fingerprint. The table remains private and server-only under the row-level security and revoked Data API grants established by migration `0035_court_change_requests`.
