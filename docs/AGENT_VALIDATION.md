# Dedicated agent validation account

Use this account when validating Relay locally as a host. The user authorized its creation and disposable game use on 2026-09-13. It is a normal, non-admin account marked `user_metadata.test_account = true`.

The app runs at `http://localhost:3002`; `.env.local` currently connects it to hosted Supabase. Test accounts and games therefore persist in that backend. This is not an isolated local database.

## Local account record

- Account identity and password: `dogfood-output/agent-account/account.json`.
- Browser session: `dogfood-output/agent-account/state.json` (expires; refresh through the trusted fixture).
- Human-readable local record: `dogfood-output/agent-account/ACCOUNT.md`.

These are ignored local files. Do not print their credentials, copy them into tracked documents, or commit browser state. If the files are unavailable on another checkout, do not guess an account or use a real person's identity.

## Workflow

Read `e2e/README.md` and use its existing `establishTestSession` helper with the exact local account ID and email. Keep the helper's non-admin, test-account, and loopback-origin guards. The account was provisioned through the authorized Admin API; this does not establish signup, password, CAPTCHA, or email-delivery coverage.

The local `dogfood-output/agent-account/run-lifecycle.mjs` runner loads this identity and runs the existing host-and-guest scenario. Check `ACCOUNT.md` first: the initial audit used the Free plan’s five-game allowance. Use an eligible exact retained game with `E2E_REUSE_SESSION_ID` for partial diagnostics; do not reset limits.

```sh
node --env-file=.env.local dogfood-output/agent-account/run-lifecycle.mjs
```

It retains its exact test game for manual UX inspection; retained scenarios also save guest state under ignored `test-results/`. Record retained game IDs in the local account record. Use link-only games with clear `Relay E2E` or `Relay Agent QA` names, synthetic guest names, and test payment images. Perform game creation, configuration, RSVP, attendance, play, and payment review through normal user controls. Do not send invitations to real people or transfer money. Delete only explicitly tracked test games through the owner's UI when cleanup is desired; never sweep by title prefix.

For browser inspection, use an isolated Agent Browser session with the saved state. Check host and signed-out guest routes at 390px and 1440px, light and dark, and inspect Story PNG exports as well as the preview. Record skipped or failed phases explicitly. A test account or successful page load alone is not a completed product walkthrough.
