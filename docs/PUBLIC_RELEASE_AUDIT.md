# Public release audit and operating gate

This is Relay’s durable release authority for security, reliability, and market readiness. A green build is necessary but not sufficient: public release also depends on production configuration and observed real sessions.

## Decision

**Current release class:** capped, invite-only Cebu beta.

Relay may move to unrestricted public signup only when every blocking row below has dated evidence. “10/10” means all objective gates pass; it does not mean the service is invulnerable or guaranteed to remain available. No internet service can promise freedom from DDoS, account compromise, provider outages, or unknown vulnerabilities.

## Rating rubric

Each pillar is scored from 0–10. A public release requires:

- no open P0 or P1 finding;
- at least 9/10 in every pillar;
- 28/30 total;
- a production verification run from the release commit;
- a tested rollback/read-only path;
- five real sessions without manual database repair.

| Pillar           | Code-complete target                                                                                                   | Production/market evidence target                                                                                |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Security         | least privilege, enforced CSP, validated and authorized writes, layered rate limits, safe uploads, dependency scanning | deployed migrations, Auth controls, managed DDoS protection, MFA, quota alerts, restore drill                    |
| Reliability      | deterministic build, tests, health endpoints, static public entry, cached directory, serial production E2E             | synthetic monitoring, authenticated production E2E, backup restore, incident drill, five real sessions           |
| Market readiness | focused positioning, guest invite loop, legal pages, SEO metadata, analytics, feedback                                 | real organizer proof, invite conversion, successful-session rate, repeat-host evidence, support response process |

## Implemented corrections

### Security

- Production dependencies have intentional semver ranges; no package uses `latest` or `*`.
- Dependabot covers npm and GitHub Actions; CodeQL analyzes JavaScript/TypeScript on pushes, pull requests, and weekly.
- Protected and authenticated routes receive a request nonce and enforced strict-dynamic CSP from `src/proxy.ts`.
- Public routes receive an enforced baseline CSP. CSP is no longer report-only.
- Existing HSTS, clickjacking, MIME-sniffing, referrer, and permissions policies remain active.
- High-frequency Play management, scoring, reactions, session management, attendance, payment management, groups, profiles, onboarding, and deletion now have distributed PostgreSQL budgets in addition to authorization.
- Public Data API restrictions, private storage, signed URLs, Turnstile, verified email, account cap, admin MFA, and emergency read-only mode remain release requirements from `docs/integrations.md`.
- `/.well-known/security.txt` gives researchers a private reporting path.

### Reliability and cost containment

- `/` is statically generated and no longer reads authentication or PostgreSQL during rendering.
- Marketing uses a small reviewed court snapshot rather than the live court table.
- The marketing map waits for explicit intent before importing MapLibre or requesting tiles.
- Current Court Finder data is cached for one hour and invalidated when an admin changes a court.
- Proxy refreshes Supabase claims only on routes that can consume a user session.
- `/api/health` is a database-free public liveness endpoint.
- `/api/health?deep=1` performs a private database readiness check and requires a 32+ character bearer secret.
- Production Playwright runs serially instead of manufacturing a firewall burst from one shared IP.
- `scripts/verify-production-release.sh` verifies the authenticated host/guest workflow, public endpoints, CSP, and ordinary shared-IP navigation.
- `scripts/backup-database.sh` selects PostgreSQL client tools new enough for the production server, creates a private custom-format dump, validates its structure, and emits a checksum outside the repository.
- Games, groups, notifications, search, and platform-admin collections load automatically in bounded batches with stable cursors and accessible fallback controls; there is no numbered-page interaction.
- Private collection APIs use `private, no-store`, refresh session claims, and deduplicate appended rows. Realtime session invalidations continue to refetch authoritative data.
- Chat now queries the newest bounded message window, orders it chronologically, and uses off-screen rendering containment instead of returning the oldest 200 messages forever.
- Profile match totals and wins are aggregated in PostgreSQL instead of loading every historical match into application memory.
- Migrations 0024 and 0025 add collection-order and aggregate-join indexes for groups, messages, notifications, group sessions, and player match history.

### Market readiness and trust

- `/robots.txt`, `/sitemap.xml`, and security contact metadata are now published.
- The privacy policy accurately states that Geoapify supplies proxied map tiles, court search uses Relay’s directory, and optional geolocation remains on-device.
- The landing page remains focused on the differentiating loop: one link, guest RSVP, courtside Play, repayment, and recap.
- The full directory remains the current source of court truth; marketing labels its embedded courts as representative.
- Mobile Court Finder filters meet Relay’s 44 px touch-target requirement.
- The published support channel is owned and has 24-hour security and two-business-day account-access acknowledgement targets in `docs/SUPPORT.md`.

## Blocking evidence register

Use ISO dates and link to the deployment, dashboard screenshot, CI run, or field note. Never mark a row complete from memory.

| Severity | Gate                                                                                                                                     | Owner       | Evidence                                                     | Status                     |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------ | -------------------------- |
| P0       | Authenticated production E2E passes from the release commit                                                                              | Engineering | 2026-08-31: complete host/guest flow passed in 44 seconds    | Complete on candidate      |
| P0       | Five real sessions complete without manual database repair                                                                               | Product     | Session observation notes                                    | Pending field use          |
| P1       | Vercel managed mitigations allow the 8-request login navigation probe                                                                    | Engineering | 2026-08-31: 12/12 concurrent requests returned 200           | Complete                   |
| P1       | Liveness and private readiness are monitored from outside Vercel                                                                         | Operations  | GitHub Actions 10-minute external monitor configured         | Alert test after push      |
| P1       | Alerts exist for Vercel errors/usage, Supabase DB/storage/egress/Auth/realtime, and Geoapify quota                                       | Operations  | Dashboard screenshots and test alert                         | Manual setup               |
| P1       | Latest backup restores into isolated PostgreSQL 17 and integrity checks pass                                                             | Operations  | 2026-08-31: post-gate Supabase PostgreSQL 17 restore, RTO 2s | Complete                   |
| P1       | Production CSP has no unexpected browser violations on login, signup, app, shared game, Turnstile, map, realtime, uploads, and analytics | Engineering | Public plus authenticated chat/payment upload flow passed    | Complete on candidate      |
| P1       | Production migrations 0022–0025 remain applied; anonymous Data API probes fail closed                                                    | Engineering | 2026-08-31: 26 migrations; six probes returned HTTP 401      | Complete                   |
| P1       | Every administrator has verified TOTP and the allowlist contains only active operators                                                   | Owner       | 2026-08-31: one allowlisted operator; zero missing TOTP      | Complete                   |
| P1       | Support inbox has an owner and response expectation                                                                                      | Owner       | `docs/SUPPORT.md` and public privacy contact                 | Complete                   |
| P2       | Real organizer quote/screenshots replace illustrative-only proof                                                                         | Product     | Consent record and launch asset                              | After beta evidence        |
| P2       | Paid plan, entitlement, cancellation, and support boundaries are defined before charging                                                 | Product     | Pricing decision record                                      | Not required for free beta |

## Performance and freshness contract

- Public entry pages are static and must remain cacheable at the edge. The landing page must not query Auth, PostgreSQL, MapLibre, or Geoapify before user intent.
- Unbounded cross-session collections use automatic infinite loading backed by bounded database queries. A visible fallback control remains for keyboard users, disabled JavaScript observers, and transient network failures; it is not numbered pagination.
- Private and rapidly changing data is never shared-cacheable. Authenticated collection APIs return `Cache-Control: private, no-store`; session collaboration uses payload-free realtime invalidations followed by authoritative refetches.
- The Cebu court directory is the only cross-request data cache. Admin writes call `updateTag("cebu-venues")` for immediate expiration; the one-hour TTL is a provider/database resilience fallback for data changed outside Relay’s admin action.
- Session-local collections remain explicitly bounded by product rules where loading everything is necessary for correct play: the main roster capacity is 40, court quantity is 20, and the initial chat window is the newest 200 messages. Off-screen repeated rows use rendering containment.
- Stable timestamp/UUID cursors prevent duplicate or skipped records when writes occur during infinite loading. Offset pagination remains only in full-text global search, where results are relevance-ranked, capped at 10,000, and loaded automatically.
- Never add a cache to authorization decisions, private media URLs, RSVP/payment state, Play state, chat writes, or admin state merely to improve a synthetic score.

## Automated code gate

Run from a clean checkout:

```bash
pnpm release:check
```

It fails on floating dependency versions, vulnerable production dependencies, formatting, lint, TypeScript, unit/integration tests, production build, or public browser smoke tests.

## Production verification

Use a disposable account whose data may be mutated and deleted by the test:

```bash
export E2E_AUTH_EMAIL='disposable-test@example.com'
export E2E_AUTH_PASSWORD='...'
export E2E_AUTH_EXISTING='true'
export HEALTHCHECK_SECRET='...'
pnpm release:verify-production
```

The workflow must run against the exact release deployment. A 429 from the bounded `GET /login` probe is a failure. Vercel Hobby exposes managed system mitigation but not the full custom Firewall/IP-bypass controls; never pause system mitigation to make a test green. If observed beta traffic produces legitimate 429s after normal human navigation, place a reviewed Cloudflare configuration in front of a custom domain or upgrade the Vercel plan before broadening traffic. The verifier includes cooldowns so it tests a shared-network burst rather than manufacturing a continuous bot signature.

## Health monitoring

- Public liveness: `GET /api/health` — confirms the deployment can execute without touching PostgreSQL.
- Private readiness: `GET /api/health?deep=1` with `Authorization: Bearer $HEALTHCHECK_SECRET` — confirms PostgreSQL is reachable.
- Never place the readiness secret in a query string, monitor title, screenshot, issue, or repository file.
- Alert after two consecutive readiness failures; avoid an aggressive interval that becomes material origin traffic.
- Route alerts to two independent destinations during launch week.

## Backup and restore drill

Create a backup outside the repository:

```bash
BACKUP_DIR="$HOME/Relay Backups" pnpm backup:database
```

Then restore into an isolated **Supabase PostgreSQL 17** target that contains no production data. Plain upstream PostgreSQL is not a valid full-restore target because it lacks Supabase roles and the `pg_cron` and `supabase_vault` extensions.

1. Verify the archive checksum.
2. Start an isolated Supabase PostgreSQL image matching production or create an isolated Supabase project.
3. Create an empty restore database. For a local Supabase stack, set `cron.database_name` to that database and restart the database container before restoring.
4. Connect as the isolated target’s super-administrator and run `pg_restore --no-owner --no-acl --dbname "$ISOLATED_DATABASE_URL" relay-*.dump`.
5. Verify migration count, public table count, signup settings, recent sessions, players, matches, payments, messages, Auth users, Storage metadata, Cron, and audit rows.
6. Record elapsed restore time as the observed RTO.
7. Force-disconnect the restore database, destroy it, and stop the isolated stack without retaining its volume.

The database dump contains sensitive Auth and Storage metadata but does not replace physical Storage object backups or provider account recovery. Record those provider procedures in the incident log. Never commit a dump, auth export, storage object, or browser state file.

## Real-session acceptance

A session counts only when it has at least four going players and one completed match. For each of five sessions, record:

- device and connection conditions;
- invite view and guest RSVP result;
- arrival/check-in behavior;
- time to first match;
- score conflict, reconnect, and correction behavior;
- repayment proof and confirmation result;
- what moved back to group chat;
- whether Play Again was used;
- any manual database or operator intervention.

Any manual database repair reopens the P0 gate.

## Market proof before unrestricted promotion

Target 10 organizers who each run two successful sessions within 30 days. Review:

- median signup-to-published-game time;
- published game to first share;
- invite view to RSVP conversion;
- sessions reaching four going players;
- Play start and first-match completion;
- mutation/upload failure rate;
- repeat session within 14 and 30 days.

Do not charge merely because the feature list is large. Validate willingness to pay and define billing support first. Keep guest RSVP, basic Play, and basic recap outside player paywalls.

## Incident controls

1. Confirm whether the problem is availability, abuse, data integrity, provider quota, or credential compromise.
2. Turn on emergency read-only mode with `scripts/set-production-read-only.sh on` when writes may worsen impact.
3. Disable signup, uploads, or map-provider access independently when that boundary is affected.
4. Preserve structured logs and timestamps without copying secrets or private game content.
5. Restore writes only after a read and blocked-write smoke test.
6. Write a short incident record with detection time, impact, correction, and prevention.

## Release record

Append one row per candidate. “Pass” requires all blocking evidence above.

| Date       | Commit/deployment                                             | Code gate                                                 | Production E2E                                                                             | Restore          | Real sessions        | Decision         |
| ---------- | ------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ---------------- | -------------------- | ---------------- |
| 2026-08-31 | `dpl_78Jd85ZgxPTtYTvBopLznyYZwy1x` plus local verifier update | Pass: 103 files, 286 tests, build, 17 local browser tests | Public production: 9/9; private readiness and 12-request burst pass; authenticated pending | Prior drill only | No evidence recorded | Invite-only beta |
