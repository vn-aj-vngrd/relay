# Reliability

## Maintain coverage when changing the product

1. Map changed behavior to [critical user journeys](CRITICAL_USER_JOURNEYS.md). Add a journey row for new behavior outside that matrix. Record its acceptance condition and test location; distinguish browser coverage from unit-only coverage.
2. Add a regression test at the lowest useful layer. For bug fixes, exercise the failing input/state and assert the user-visible outcome. For changed critical journeys, update the existing browser scenario or add the missing branch using the trusted fixture. Reuse `e2e/smoke.spec.ts` and `e2e/helpers`; keep tests independent of real users.
3. Put critical unit regressions in `scripts/reliability-essential.json` when the existing selected tests do not cover the risk. Keep this profile focused on creation, sharing/RSVP, roster, play, payments, Story and permissions. The full unit suite automatically discovers other test files.
4. Follow [code quality validation timing](CODE_QUALITY.md). Execute or dispatch browser tests when requested. At handoff, name affected journeys, test evidence and remaining gaps. Fix failures with meaningful assertions; weakening assertions or skipping a failing journey does not establish readiness.

**Complete when:** every changed behavior has a mapped acceptance condition and regression coverage, the selected tests exercise that condition, and the handoff distinguishes passed, failed and unverified checks with the tested commit/environment. A green unit run alone does not prove a browser journey.

## Run manual CI

After the workflow is merged, open GitHub Actions → **Manual reliability** → **Run workflow**, select a trusted ref and profile:

| Profile | Scope | Use |
| --- | --- | --- |
| Essential (default) | Selected critical unit/component regressions, mobile entry/auth screens and Quick Play, one fresh authenticated host/guest lifecycle | Routine journey confidence |
| Full | All discovered unit/component tests with V8 coverage, existing public/visual browser suite on mobile Chromium, the same fresh host/guest lifecycle | Broader release or cross-cutting changes |

Existing push/PR CI stays enabled. These heavier browser runs are manual; they build and serve the production app on the runner's loopback interface. They neither deploy nor gate the existing Vercel Git deployment. Runs serialize to protect the shared test account and do not retry state-changing journeys. Any selected skipped browser test fails the run.

Full means **all tests in the automated profile**, not every feature proven bug-free. The [journey matrix](CRITICAL_USER_JOURNEYS.md) remains the coverage gap inventory. The retained-game branch diagnostic needs an explicitly inspected game and remains a separate run described in [browser validation](../e2e/README.md). Password/signup/CAPTCHA, email delivery and hosted production firewall behavior require their separate checks. Browser coverage percentages are not inferred from unit coverage.

The full profile uploads unit coverage (HTML, LCOV and JSON summary) for seven days. Inspect uncovered branches in changed critical features and add useful cases. The initial local baseline on 2026-09-13 is 2,047 passing tests across 283 files: 59.46% statements, 55.06% branches, 62.05% functions and 60.69% lines. This measured the current working tree, not a deployed commit. Prioritize uncovered critical branches; no arbitrary percentage is claimed as release proof. Browser results appear in job logs; authenticated screenshots/traces are disabled and are not uploaded to this public repository.

## One-time test environment setup

Create the GitHub environment **reliability**, restrict deployment refs to trusted branches, and require reviewer approval before giving a run backend secrets. Configure these environment secrets:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` and `DATABASE_URL` for the **same dedicated non-production backend**, with the application's migrations applied.
- `E2E_AUTH_USER_ID` and `E2E_AUTH_EMAIL` for its dedicated non-admin account marked `user_metadata.test_account: true` (see the trusted fixture in the browser runbook).
- `GEOAPIFY_API_KEY` for the test environment.

Use [integrations](integrations.md) for provisioning. The workflow fails when required configuration is missing. The fixture verifies account identity, role, marker and loopback origin. Ensure sufficient game-creation/deletion allowance before running; on quota or cleanup failure, inspect the exact test artifact and wait for allowance recovery. Never reset production quotas or substitute production credentials to make CI pass.

Local equivalents, with the test environment already loaded:

```sh
pnpm test:reliability essential
pnpm test:reliability full
pnpm build
E2E_SESSION_FIXTURE=true RELIABILITY_PROFILE=essential pnpm test:e2e:reliability
```

References: [Vitest coverage configuration](https://vitest.dev/config/coverage), [Playwright reporter completion status](https://playwright.dev/docs/api/class-reporter).
