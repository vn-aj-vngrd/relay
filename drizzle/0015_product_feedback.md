# Product feedback inbox

## Intent

Adds one durable inbox for authenticated player feedback. Bug reports, feature requests, and general feedback share the same lifecycle so players have one clear submission flow and administrators have one place to triage requests.

## Data model

- `feedback_type`: `bug`, `feature`, or `general`.
- `feedback_status`: `new`, `reviewing`, `planned`, `resolved`, or `closed`.
- `feedback_submissions`: the affected product area, player’s title and description, optional originating page, contact preference, administrative note, reviewer, and lifecycle timestamps.

A submission belongs to one Relay account. Account deletion remains restricted so feedback history is not silently detached; the existing account-anonymization path can preserve the record without retaining identity. Administrative updates are recorded separately in `admin_audit_logs`.

## Authorization

Row-level security is enabled without Data API policies. Players submit and read their own records only through authenticated Server Actions and server queries. Admin pages and mutations independently enforce the server-only administrator allowlist. This prevents direct client access to other players’ feedback or private administrative notes.

## Apply

```bash
corepack pnpm db:migrate
```

## Verify

1. An authenticated player can submit each feedback type and sees only their own recent submissions.
2. Invalid or oversized content is rejected server-side.
3. A non-admin cannot open the admin feedback inbox or invoke its update action.
4. An admin can filter submissions, review one, change its status, and save a private note.
5. Every administrative update writes an audit event.
