# Signup account cap

## Purpose

Adds a hard, administrator-managed ceiling for Relay Auth accounts. The initial cap is 200 accounts. The check runs inside Supabase Auth before an identity is created, so direct calls to the public Auth API cannot bypass the application UI.

## What changes

- Creates the singleton `public.signup_settings` row with an `account_cap` between 1 and 50,000.
- Keeps the settings table closed to `anon`, `authenticated`, and `service_role` Data API roles.
- Grants `supabase_auth_admin` read access only to the singleton setting.
- Adds `public.hook_enforce_signup_account_cap(jsonb)` for the Supabase **Before User Created** hook.
- Uses a transaction-scoped advisory lock shared with the admin update action. Concurrent signup transactions serialize through the capacity check, preventing multiple requests from claiming the final place.
- Counts all `auth.users`, including accounts created through the Supabase Admin API.
- Fails closed with HTTP 503 if the setting is missing or cannot be read.
- Returns HTTP 403 with a stable beta-full message when the cap is reached.

The hook is enabled in `supabase/config.toml`. Apply this migration before pushing that Auth configuration.

## Apply

Use the integration runbook so migrations are applied before Auth configuration is pushed:

```bash
./scripts/setup-integrations.sh
```

For a local database-level verification with PostgreSQL installed:

```bash
./scripts/test-signup-cap.sh
```

The test executes this migration against an isolated temporary PostgreSQL cluster and verifies below-cap access, at-cap rejection, missing-setting fail-closed behavior, and a 20-request concurrent burst against a five-account cap.

## Verify in production

1. Open Admin Console → Overview and confirm **Signup capacity** shows 200.
2. Save a different cap and confirm `signup.capacity_updated` appears in the audit log.
3. Set the cap equal to the current registered-user count.
4. Attempt password signup with a new test email; it must show that the beta is full and create no `auth.users` row.
5. Raise the cap by one and repeat; exactly one new account may be created.
6. Restore the intended launch cap.

## Rollback

First disable `[auth.hook.before_user_created]` in `supabase/config.toml` and push the Auth configuration. Only then drop the function and table. Dropping the settings while the hook remains enabled intentionally causes all account creation to fail closed.
