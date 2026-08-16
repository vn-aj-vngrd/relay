# Admin operations

## Intent

Adds the minimum durable state needed for Relay’s production admin console while keeping authentication in Supabase Auth.

## Data changes

- `users.suspended_at`: marks a Relay account unavailable.
- `users.suspension_reason`: private operator context shown only in the admin console and suspension notice.
- `users.suspended_by_id`: identifies the responsible administrator.
- `admin_audit_logs`: append-only records for privileged actions, with actor, action, target, reason, timestamp, and non-sensitive metadata.

## Safety model

Admin access is independently authorized on every page and Server Action through the server-only `ADMIN_EMAILS` allowlist. Suspension and restoration are reversible. Session moderation changes a game to `cancelled` rather than deleting historical records.

## Apply

```bash
corepack pnpm db:migrate
```

## Verify

1. A non-allowlisted account cannot open `/admin` or invoke an admin action.
2. An allowlisted account can search users and sessions.
3. Suspending a different user blocks their authenticated app access and writes one audit event.
4. Restoring that user returns access and writes one audit event.
5. Cancelling a session preserves its records, changes its status, and writes one audit event.
