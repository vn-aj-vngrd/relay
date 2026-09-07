# Browser validation

`pnpm test:e2e` covers public browser flows. The authenticated host/guest game test requires an explicit trusted-session opt-in; it must never solve or disable production CAPTCHA.

## Trusted game-lifecycle fixture (local app only)

Use a dedicated, non-admin Supabase account whose `user_metadata.test_account` is boolean `true`. Provision that account separately with operator approval; the fixture never creates accounts, changes passwords, edits metadata, or resets rate limits. Configure its exact ID as `E2E_AUTH_USER_ID` and email as `E2E_AUTH_EMAIL` in ignored `.env.local`, alongside the existing Supabase URL, publishable key, secret key, and `ADMIN_EMAILS` configuration. Never place a real administrator's account here.

Run from the repository root:

```bash
E2E_SESSION_FIXTURE=true node --env-file=.env.local node_modules/@playwright/test/cli.js test e2e/smoke.spec.ts --project=desktop-chromium --grep 'authenticated host and guest'
```

The helper in `helpers/auth.ts` runs only in the Node test runner. It requires explicit opt-in, an exact marked account match, a normal authenticated role, no MFA factors or administrator privileges, and a loopback app URL. It reads the existing identity by ID before using the documented Supabase Admin `generateLink({ type: 'magiclink' })` API. This does not send email. Its single-use token is consumed by `verifyOtp` in Node, and the official `@supabase/ssr` `getAll`/`setAll` adapter writes the resulting cookie chunks into the isolated browser context. The service key and one-time token are never passed to page JavaScript, an app route, or a URL. No hosted Auth settings or production routes are changed.

References:
- https://supabase.com/docs/reference/javascript/auth-admin-generatelink
- https://supabase.com/docs/reference/javascript/auth-verifyotp
- https://supabase.com/docs/guides/auth/server-side/creating-a-client

The default lifecycle test reuses the account without resetting onboarding, creates one uniquely named **link-only** game, covers host and guest interactions, completes it, then deletes exactly the newly created game through the authorized UI. A failure also attempts scoped UI cleanup; cleanup failure is annotated and does not replace the original failure. Stop on rate limits: the fixture has no operational reset path. Supabase rate limits and Relay's creation/deletion quotas still apply.

`test-results/` and Playwright traces may contain authenticated session cookies and private test data. They are ignored artifacts, not material to commit or publish. Never log generated tokens or local credentials.

## Bounded diagnostics and retained artifacts

For an explicitly authorized debugging session only, `E2E_REUSE_SESSION_ID=<exact-id>` resumes a published, link-only `Relay E2E …` game after verifying its exact ID and dedicated owner in Supabase. This skips creation/settings checks and adds a **partial-diagnostic** annotation; a passing resumed run is **not** a passing full end-to-end flow. Start from a suitable clean roster; this mode deliberately does not reset roster, payment, match, or guest state.

`E2E_RETAIN_SESSION=true` explicitly retains the tracked test game and annotates its ID for operator cleanup (for example, when the normal deletion quota is exhausted). Otherwise cleanup is mandatory. Never delete by title prefix or sweep all games belonging to an account. When a quota blocks cleanup, record exact IDs privately and wait for quota expiry before using the regular owner-authorized Delete game flow.

## Password/CAPTCHA smoke remains separate

The trusted fixture validates authenticated **product behavior**, not password login, signup, SMTP, or CAPTCHA success. Run the password authentication smoke in `docs/integrations.md` manually with real Turnstile verification and the disposable password stored locally. Confirm a missing/expired challenge cannot submit or authenticate, then complete a real challenge, sign in, sign out, and verify protected routes reject the signed-out browser. Existing auth form/action unit tests verify fail-closed behavior and token forwarding; public E2E still checks login/signup entry routes. Record the manual outcome separately. A trusted-fixture pass must not be reported as CAPTCHA/password browser verification.
