# Release verification — 2026-09-13

**Decision: not cleared for unrestricted public release.** The common game flow has prior staged browser evidence, but this release check found an authentication-navigation availability issue and has unresolved real-auth and fresh-game coverage.

## Verified on production

- Canonical origin: `https://relay.vanajvanguardia.tech`. The previous Vercel alias redirects here.
- `/api/health`: HTTP 200, `status: ok`, release `aceb1d33d49c`.
- Authenticated `/api/health?deep=1`: HTTP 200, `status: ok`, `database: reachable`. The secret was not printed or put in a URL.
- GitHub CI for `aceb1d33d49cecc48e740f4566f152bae3a4ab8d`: passed, run `34740968644`. Vercel deployment status: success.
- Canonical-domain metadata/health/CSP browser check passed. The old alias failed the no-redirect protected-header assertion because it returned the domain redirect before application headers.
- Full serial mobile public suite: **14 passed, 5 failed**. Landing, Court Finder, stalled-tile recovery, Quick Play rotation/scoring, several public accessibility checks, metadata/CSP, protected-route behavior and mobile layout passed.

## Blocking issue: normal authentication page views count as attempts

The five failed checks received Vercel's `429 Too Many Requests` page on login/signup navigation. Production browser traffic was stopped when identified. This was a suite workload from one IP; it is not evidence that every individual visitor fails. It does expose a shared-network risk that needs correction and a bounded rerun before clearance.

Live rule inspected through Vercel CLI:

- ID: `rule_rate_limit_authentication_NsGupC`.
- Name: Rate limit authentication; enabled.
- Match: `path equals /login` OR `path equals /signup`.
- No HTTP-method condition.
- Fixed window: 30 requests / 60 seconds, keyed by IP; action `rate_limit`.

**Proposed correction:** preserve the 30/60s per-IP limit and rate-limit action, but match `(path = /login AND method = POST) OR (path = /signup AND method = POST)`. This protects form/Server Action submissions without spending that attempt budget on ordinary GET navigation and prefetches. Keep application auth limits, Turnstile, and managed system protection enabled. This does not add a bypass or change account quotas.

Before publishing, inspect `vercel firewall diff` and ensure no unrelated draft is included. Review the exact staged conditions. After publishing, inspect live conditions and rerun the failed auth-page browser checks plus a bounded shared-IP GET probe; do not generate password-attempt bursts. Retain the old conditions above for rollback. The live rule has **not** been changed in this check.

## Local release-tool corrections

- Production defaults now point to the canonical origin in the package command, manual E2E workflow, health monitor and verifier.
- Health monitoring now checks parsed response facts, including database reachability; a successful curl exit for an empty redirect is no longer treated as health.
- Manual deployed E2E explicitly runs the public project. Removed unused password fixture variables that implied authenticated coverage.
- The production verifier no longer runs the localhost-only auth fixture and then claims a complete release pass. It reports incomplete authenticated evidence with exit code 2 after successful public checks.
- Seven regression tests passed: six monitor cases covering empty/redirect responses, HTTP failure, degradation and correct readiness facts, plus a full script execution with fake transports that verifies public-only success exits as incomplete. Repository quality check, typecheck and shell syntax checks passed.
- These corrections, the prior branch test and the journey checklist are currently local/uncommitted. They do not change the deployed product or firewall.

## Inputs still required

1. A real mailbox approved for signup and confirmation. The existing agent account uses reserved `example.com`; it cannot validate mail delivery. Complete the real Cloudflare challenge when needed; no challenge bypass or hosted Auth change was made.
2. A disposable host with a normally available game allowance for an uninterrupted create-to-completion release run. The existing account has used all five games; no quota resets, plan changes, or replacement accounts were used to evade the limit.
3. Human mobile-device confirmation of native sharing/download behavior. Browser viewport emulation and the previous actual PNG export do not prove OS share-sheet behavior.

The prior evidence remains in `GAME_JOURNEY_AUDIT.md` and `CRITICAL_USER_JOURNEYS.md`. A passing public suite, a healthy database, or green CI alone does not close these gaps.
