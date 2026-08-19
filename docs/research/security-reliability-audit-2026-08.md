# Security and reliability audit — August 2026

## Scope

Reviewed admin collection scaling, privileged data access, authentication abuse, public and authenticated high-frequency boundaries, provider quota protection, response headers, and Supabase Data API exposure.

## Primary-source guidance

- Next.js says exported Server Actions are reachable by direct POST requests and must authenticate, authorize the specific resource, validate client input, and return only the data required by the UI. It recommends a server-only data access layer that returns minimal DTOs. [Next.js Data Security](https://nextjs.org/docs/app/guides/data-security)
- Supabase documents grants and RLS as separate controls and warns that new public-schema objects may receive Data API grants by default. It explicitly recommends pre-request or application checks for per-IP and per-user limits. [Supabase — Securing your API](https://supabase.com/docs/guides/api/securing-your-api)
- Supabase Auth already enforces endpoint limits and returns HTTP 429 when exceeded. Application limits should supplement rather than replace these controls. [Supabase Auth rate limits](https://supabase.com/docs/guides/auth/rate-limits)
- Vercel Firewall applies platform DDoS mitigation before WAF rules. Application limits remain useful for authenticated identities, business actions, and third-party quota protection. [Vercel Firewall](https://vercel.com/docs/vercel-firewall)
- OWASP recommends layered credential-stuffing defenses and warns that IP blocking alone is insufficient against distributed attacks. [OWASP Credential Stuffing Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Credential_Stuffing_Prevention_Cheat_Sheet.html)

## Findings and corrections

### P1 — Admin collections silently stopped at fixed limits

Users stopped at 50, Games at 75, and Venues, Feedback, and Audit at 100. Administrators could incorrectly conclude that older records did not exist.

**Correction:** all five collections now use 30-record keyset pages and load the next cursor as the sentinel approaches. Invalid cursors fail closed. Each incremental request re-checks the authenticated account against the server-only admin allowlist. Responses contain only list DTOs, never authentication credentials, payment proof paths, private admin notes, or full audit metadata.

### P1 — Provider and mutation boundaries lacked distributed application limits

Geoapify proxy calls, application search, feedback, court submissions, guest RSVP, session chat, uploads, public event tracking, and account actions could be invoked repeatedly across serverless instances.

**Correction:** an atomic Postgres fixed-window limiter now protects selected boundaries by authenticated user, session player, guest token hash, account identifier, or forwarded client IP. Bucket keys are SHA-256 digests and expire automatically. APIs return 429 and `Retry-After`; form actions return actionable errors.

### P1 — New internal security state could inherit Data API grants

Supabase warns that public-schema tables may receive grants by default.

**Correction:** the rate-limit table has RLS enabled and explicit revokes for `anon`, `authenticated`, and `service_role`. There are no Data API policies. Cleanup execution is revoked from Data API and public roles; only the direct database owner and scheduled database job use this state.

### P2 — Partial-text admin search would degrade into sequential scans

Admin filters use `%term%` searches, which ordinary B-tree indexes cannot accelerate.

**Correction:** `pg_trgm` GIN indexes cover the searched user, profile, session, venue, and feedback fields. Composite timestamp/UUID indexes support cursor traversal.

### P2 — Baseline browser security headers were absent

**Correction:** every route now sends `nosniff`, clickjacking denial, strict referrer policy, a restrictive camera/microphone policy with same-origin geolocation, and HSTS.

## Residual risks

- Content Security Policy requires nonce integration for the existing inline theme bootstrap and MapLibre worker behavior. Shipping an incorrect CSP would break authentication or maps; implement and test a nonce-based policy as a separate deployment.
- Rate limiting is intentionally fixed-window and prioritizes deterministic low-cost enforcement. Vercel WAF rules and Supabase Auth limits should be tuned from production metrics for volumetric attacks.
- Administrator MFA is not yet enforced. OWASP identifies MFA as the strongest credential-stuffing defense; require it before expanding admin access beyond the single owner allowlist.
- Search indexes improve query plans but should be checked with production `EXPLAIN (ANALYZE, BUFFERS)` after data volume becomes representative.
- Provider-derived IP headers are useful on Vercel but are not identity. Authenticated user and player limits are preferred wherever available.

## Verification checklist

- Non-admin `/api/admin/*` request returns 403.
- Invalid admin cursor returns 400.
- Cursor pages have no duplicate IDs and eventually exhaust.
- Rate-limit overflow returns 429 without storing raw identity data.
- Anonymous Data API requests cannot read `rate_limit_buckets`.
- Security headers appear on production HTML and route responses.
- Production dependency audit reports no known vulnerabilities.
- Admin search uses trigram indexes at representative scale.
