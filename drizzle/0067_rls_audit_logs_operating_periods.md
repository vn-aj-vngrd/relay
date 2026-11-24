# RLS for audit logs and operating periods

Supabase flagged `rls_disabled_in_public` on the production project. Migrations
`0005_admin_operations` and `0029_structured_court_operating_hours` created
`admin_audit_logs` and `venue_operating_periods` without enabling Row-Level
Security, so the Data API (anon key) could read and write them.

Apply with `pnpm db:migrate` against production as soon as possible. This enables
RLS (no policies, so deny by default) and revokes Data API privileges from
`PUBLIC`, `anon` and `authenticated`. Relay reads and writes both tables only
through the server database connection (table owner), which is unaffected. No
data changes.

Verify: the Supabase Security Advisor shows no `rls_disabled_in_public` finding,
and `select relrowsecurity from pg_class where relname in
('admin_audit_logs','venue_operating_periods')` returns true for both.
