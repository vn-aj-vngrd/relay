# Admin pagination and abuse controls

## Purpose

Replaces fixed admin record caps with indexed cursor pagination and adds a distributed fixed-window limiter for abuse-prone application boundaries.

## Pagination behavior

Admin Users, Games, Venues, Feedback, and Audit use stable keyset cursors composed of a sort timestamp and UUID. Queries request 31 rows, return 30, and encode the last returned tuple as an opaque base64url cursor. This avoids the growing scan and duplicate/skip behavior of offset pagination while records are being inserted.

Composite descending indexes support each cursor order. `pg_trgm` GIN indexes support case-insensitive partial search across admin user, session, venue, and feedback fields. Venue administration keeps pending submissions first, then orders each cursor segment by most recently updated; status remains an explicit filter.

## Rate limiting

`rate_limit_buckets` stores only SHA-256 bucket keys, counts, and expiry timestamps. Raw IP addresses, emails, guest tokens, and user IDs are not stored in the table. Atomic `INSERT ... ON CONFLICT ... count + 1` writes make limits consistent across Vercel instances.

The table has RLS enabled and all access is revoked from `anon` and `authenticated`. Application code reaches it only through the server database connection. An hourly Supabase Cron job removes expired buckets. No policy exposes rate-limit state through the Data API.

Limits are defense in depth around authentication attempts, admin pagination, search, Geoapify autocomplete and tiles, feedback, court submissions, session creation and RSVP, chat, and public analytics events. Supabase Auth and Vercel Firewall remain independent outer layers.

## Search exposure

Trigram indexes contain database index data only; they do not grant read access. Existing table grants and RLS remain authoritative. The new rate-limit table is explicitly inaccessible through PostgREST.

## Rollback

Before dropping `rate_limit_buckets`, remove the `relay-rate-limit-cleanup` Cron job and deploy code that no longer calls the limiter. Cursor and trigram indexes may be dropped independently without changing stored application data, but admin queries will become slower at scale.
