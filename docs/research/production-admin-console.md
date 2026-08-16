# Production admin console research

Researched: August 16, 2026

## Primary-source findings

### Keep privileged APIs server-only

Supabase’s Auth Admin methods require the project’s `service_role`/secret credential and must run only on a trusted server. User listing is paginated, and account changes such as a temporary ban are made with `updateUserById`. Relay should therefore keep every administration query and mutation in Server Components or Server Actions; no admin credential or broad user record is serialized to the browser.

Sources: [Supabase `listUsers`](https://supabase.com/docs/reference/javascript/auth-admin-listusers), [Supabase `updateUserById`](https://supabase.com/docs/reference/javascript/auth-admin-updateuserbyid)

### Treat every Server Action as a public mutation boundary

Next.js recommends centralizing authorization in a data-access layer and re-checking authorization inside every Server Action. Hiding an action or protecting a layout is not sufficient because actions can be invoked directly.

Sources: [Next.js authentication guide](https://nextjs.org/docs/app/guides/authentication), [Next.js mutating data](https://nextjs.org/docs/app/getting-started/mutating-data)

### Keep an attributable audit trail

OWASP recommends logging use of administrative privileges, user administration, permission changes, and other high-risk operations. Logs should capture who, what, when, and the affected object, while excluding credentials, access tokens, and sensitive personal data. Audit records should be append-only through the product interface.

Source: [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)

### Use a resource-index pattern

Established admin systems organize large resource sets around an index: clear page title, search/filter controls, a scan-friendly table or list, status indicators, and row-level detail. Bulk actions are useful only when a real repeated workflow exists. Relay V1 should use searchable user and session indexes and avoid speculative bulk operations.

Source: [Shopify Polaris resource index layout](https://polaris.shopify.com/patterns/resource-index-layout)

## Relay decisions

1. `/admin` is a separate, responsive operations surface rather than another item in the consumer navigation.
2. Access is an explicit server-only email allowlist (`ADMIN_EMAILS`) for V1. This is easy to audit and avoids exposing a role editor before it is needed.
3. Every admin page and every mutation independently calls `requireAdmin`.
4. V1 supports the operational jobs that matter now: overview health, user lookup, managed account creation, recreational profile editing, user suspension/restoration, session lookup/cancellation, and an audit trail.
5. Admin-created accounts receive a one-time temporary password and must replace it before entering the app. The temporary credential is never stored in Relay’s database or audit log.
6. Hard account deletion, user impersonation, arbitrary database editing, bulk actions, and analytics dashboards remain out of scope. Relay preserves hosts and players in historical sessions; suspension provides the safe operational off-switch.
6. Suspension is reversible and requires a reason. Session moderation changes status to `cancelled`; it does not hard-delete history.
