# Personal subscriptions

## Purpose

Adds personal Free/Pro entitlements, manually verified subscription payment requests, admin payment-method configuration, account overrides, creation usage and host-owned media accounting. Subscription payments are not session repayment collections.

Plan version `free-v1`: 5 successfully created games per Philippine calendar month and 100 MiB retained media. `pro-v1`: PHP 299 for one calendar month, 30 games per term and 2 GiB retained media. Pro terms snapshot allowances; new commercial terms require a new version. No recurring debit or provider integration is enabled.

## Deployment order

Follow `docs/CODE_QUALITY.md` before committing/deploying. Do not execute production commands without operator approval. The migration locks legacy account/session/media writes during its transaction so the backfill cannot race those writes; lock acquisition times out after 10 seconds rather than waiting indefinitely. Keep the application write pause in place until the matching application is deployed.

1. Review and back up the database. Coordinate a short write pause so old creation/upload code cannot write between backfill and the new application deployment.
2. Apply migration 0051 to the intended environment using the normal Drizzle migration process.
3. Deploy the matching application before reopening writes. The new actions require these tables and the session column.
4. Confirm the `subscription-files` bucket is private, all seven billing tables deny Data API access, and the reminder Cron is installed.
5. Inspect backfilled media byte totals and account creation usage. Existing photos remain visible; missing object metadata is conservatively charged at the historical bucket ceiling.
6. Existing accounts receive exactly one complimentary calendar month at migration time. They inherit no fabricated payment record. Notify beta accounts about the transition; operators may grant audited overrides if their existing usage exceeds the initial allowance.
7. Configure business payment methods and policies in `/admin/billing/settings`. Check the QR destination using the actual receiving application. Sales are disabled by default and require an enabled method plus support contact, review timeframe and policy.
8. Validate a disposable manual request, private proof access, approval, duplicate transaction rejection, expiry, games quota and media cleanup before enabling real collection.

## Application record — 2026-09-09

Applied to the configured remote database with operator approval after creating and structurally verifying a private PostgreSQL backup outside the repository. The first attempt did not complete; inspection confirmed no partial billing tables before retrying the normal Drizzle migration command successfully.

Post-application checks confirmed 52 journal entries, a successful replay of the reported Home query, complete existing-game and complimentary-account backfills, RLS and denied Data API reads on all seven billing tables, a private 5 MiB subscription bucket, and one active renewal Cron job. Payment sales remain disabled. This records database application, not an application deployment or payment-launch approval.

## Troubleshooting an unmigrated database

If Home or another session page fails with PostgreSQL `42703` and `column sessions.participant_images_enabled does not exist`, the application schema is ahead of the connected database. Drizzle selects this column with the other session fields, even on pages that do not display billing controls.

Follow the approved deployment order above, then run `pnpm db:migrate` against the intended database. This applies all pending migrations, so review the migration journal first. Do not add only the missing column or catch the error and return an empty game list: creation and uploads also require the billing tables and historical backfill. Restart the development server after migration and retry Home. A commit alone does not change the database.

## Security

- Billing tables have RLS enabled and all Data API privileges revoked from `anon`, `authenticated` and `service_role`. Only the server database connection reads/writes them.
- Subscription QR images and proof share a new private storage bucket but not session payment buckets. No browser write/read policy is added. Authorized pages generate five-minute signed URLs after account ownership or AAL2-admin checks.
- Every admin mutation calls `requireAdmin`; account mutations call `requireUser`. Admins cannot approve their own payment. Complimentary grants are separate audited actions.
- Payment requests retain a snapshot of provider, recipient, account, QR path, instructions, policy, support contact, price and plan version. Replacing a QR never overwrites objects referenced by old requests.
- Approval locks the account, verifies the current request state, and serializes the normalized provider/transaction reference. A unique index independently prevents double credit. One request can produce at most one paid term.
- A partial unique index permits only one open request per account. Transactions use a consistent account advisory lock shared with quota changes and creation.
- The reminder function has an empty search path and no public execution grant. It only creates deduplicated in-app notifications; it never renews or charges an account.

## Accounting and deletion

Creation usage has no foreign key to sessions: deleting a game never refunds its usage. Existing games are backfilled, but games deleted before this migration cannot be reconstructed.

A media reservation charges exact upload bytes to the original host and applies an uploader/day allowance before contacting Storage. The content record and stored marker commit together. Confirmed deletion releases bytes; uncertain deletion retains the reservation. Daily successful usage remains after deletion through `stored_at`. Interrupted reservations also count until cleaned up, avoiding an upload race that exceeds quota.

Media rows intentionally retain their session IDs after session deletion. Session deletion cleans up tracked chat and memory objects in bounded batches and releases only confirmed deletions. Failed cleanup remains visible in the host's storage manager. An admin can clean up incomplete reservations older than an hour from the account billing page. Finalization rechecks the reservation under a row lock, so a cleaned reservation cannot later become a saved upload. A lost database commit response is reconciled before deleting files.

Payment/account/term records restrict account deletion to preserve financial history. A future account-erasure workflow must implement the published retention policy rather than cascade away billing records.

## Rollback

Disable new payment requests and pause writes before rollback. Stop `relay-subscription-reminders` before removing its function. Revert the application before dropping billing tables or the session column. Do not drop tables, retained QR images or payment proof after accepting real payments without an approved export and retention plan. Removing billing code does not refund money or revoke provider payments.

## Boundaries

- No automatic payment provider, refund execution, automatic recurring renewal or external renewal email is implemented. Renewal notices are in-app (plus the Plan & usage warning).
- Ordinary avatar/group/payment-proof throttles remain existing attempt-based UTC safeguards, not billable quotas. Chat and memory successful-upload allowances use Philippine-day accounting.
- Memories now require files at most 2 MiB; automatic compression is not implemented. The UI explicitly asks users to resize larger files.
- Override amounts are bounded numbers, not unlimited flags. Changing actual usage history is not exposed; support can grant an audited allowance override.
- Policy text is operator supplied. Do not enable sales before refund, dispute and media-retention terms are approved and published in the checkout.
