# Personal subscriptions and manual billing

## Product contract

Subscriptions belong to individual accounts. Groups, co-hosts and players do not buy seats. The host's plan supplies game-creation and hosted-media allowances; joining, RSVP, Play, scoring, basic recap and game repayment remain available on both plans.

| Allowance | Free | Pro |
| --- | --- | --- |
| Price | PHP 0 | PHP 299 per manually renewed calendar month |
| Successfully created games | 5 / Philippine calendar month | 30 / subscription term |
| Retained chat images + game photos | 100 MiB total | 2 GiB total |
| Players / courts per game | 40 / 20 | 40 / 20 |

`src/features/billing/domain.ts` is the versioned policy catalog. An approved term snapshots its plan version and allowances. Do not mutate a published plan version in place; introduce a version and intentionally decide existing-customer treatment. This first release does not provide an arbitrary plan/price editor.

Pro starts after admin approval. Early renewal appends a calendar-month term after the paid-through date. January 31 clamps to February's last day; subsequent terms anchor to their actual start date. Initial upgrade carries current-calendar-month creations into the first Pro term. Expiry resolves directly from the current time; a missed background task cannot preserve expired access. Free fallback counts creations in the current Philippine calendar month.

Games are charged only in the same database transaction as successful creation. A form retains an idempotency key across retries; a repeated key returns the already-created game. Deleting or cancelling never refunds creation usage. New creation still has an independent 20-attempt/minute abuse throttle.

## Account surfaces

- `/settings/plan`: effective plan, games, retained/reserved storage, reset/expiry dates, manual upgrade/renewal and cursor-paged payment history.
- `/settings/plan/requests/[id]`: owner-only snapshot of payment instructions, QR, amount, account details, policies, transaction-reference submission, optional private proof and review state.
- `/settings/plan/media`: host-owned photo management and storage release; game settings → Invite also exposes participant image permissions to the original host.

Both authenticated and shared-link chat/memory actions use the same reservation service. A photo spends the uploader's daily allowance and the host's storage. The participant is never asked to upgrade their own account to fix a host-storage limit.

Chat: one JPEG/PNG/WebP per message, at most 1 MiB, 10 uploads/day/account across games (session-scoped for guests). Memory photos: at most 2 MiB, 20/day/account across games. These counts reserve in-flight uploads and retain successful usage after deletion. Day boundaries are midnight Philippine time. The smaller-file requirement is explicit; no automatic compression is claimed.

Other avatar/group/payment-proof limits remain operational, attempt-based UTC throttles. Payment files do not spend the host's billable media storage. The old five-collections/day restriction is removed; payment management keeps its existing per-minute safeguard. The obsolete `CHAT_IMAGE_MAX_BYTES` environment override is retired so upload validation and plan copy share one 1 MiB policy.

## Admin surfaces

- `/admin/billing`: existing `AdminInfiniteRecords` pattern, stable 30-row cursors, shared admin-pagination API authorization/rate limit, no payment proof or recipient details in list payloads.
- `/admin/billing/settings`: multiple payment methods, recipient/account details, optional QR upload/replacement, enabled state, instructions, sales pause, verification timeframe, support contact and operator-approved refund/dispute/retention policy.
- `/admin/billing/requests/[id]`: private proof and transaction reference, request clarification, reject or approve received funds. Another administrator must verify an admin's own payment.
- `/admin/users/[id]/billing`: effective usage, overrides with reason/optional date expiry, complimentary one-month grants and recovery of old incomplete media uploads.

An allowance left blank inherits the current plan. Zero blocks new usage. Overrides do not bypass technical/security constraints. Expiry is the end of the selected Philippine date. Use an override to provide extra capacity rather than erasing real usage or inventing a payment. Complimentary grants cannot be repeatedly submitted while any Pro term remains active/scheduled.

## Manual payment workflow

1. Operator configures a business payment method, verifies the QR destination and publishes policies. Sales start disabled.
2. Account creates an upgrade request. Server snapshots price, allowances and destination information; no client-submitted price is trusted.
3. Checkout shows QR, recipient name, copyable account details, exact amount and unique Relay request reference. QR download supports same-phone payment. It explicitly says manual renewal and no automatic charge.
4. User pays externally and supplies the provider transaction reference. Screenshot is optional and never sufficient evidence on its own.
5. Admin checks actual received funds and enters the received transaction reference before approval. Providers use fixed GCash/Maya/Bank transfer/Other categories; the server deduplicates the category/reference and the database enforces uniqueness. Describe the institution in instructions rather than inventing provider aliases.
6. Approval atomically records review, one term, audit event and an in-app notification. A retry cannot create another term.
7. Hourly Supabase Cron adds a deduplicated in-app reminder when the last scheduled term ends within three days. The Plan page also warns within seven days. No external email or automatic debit is configured.

Unpaid requests can be cancelled only before proof submission and with explicit confirmation that payment was not sent. Submitted requests require review; rejection/clarification notes are visible to the owner. Payment collection and refunds occur outside Relay; approved terms do not pretend to issue provider refunds.

## Operations and financial assumptions

The early planning model was PHP 3,500/month for one Supabase Micro production project, one Vercel Pro developer seat and small ancillary costs, using an illustrative PHP 58/USD rate. At PHP 299 and an illustrative 5% collection deduction, about 13 paying accounts cover that baseline. This is not a measured bill or profit promise; review actual fees, image egress, Realtime fan-out, compute, free-account activity, taxes and support work after launch.

Use provider usage alerts. Never assume per-account storage allowances are free reserved Supabase capacity. Keep private media out of service-worker caches, and do not publish payment files or log submitted references/screenshots. Stored historical QR versions are intentional snapshots, not replace-in-place assets.

Deployment/backfill/rollback instructions: `drizzle/0051_personal_subscriptions.md`. No production migration or payment configuration is applied by source edits. The migration grants existing beta accounts a complimentary month; communicate that transition before rollout.

## Deferred capabilities

Automatic recurring billing/provider webhooks, automatic image compression, a plan-price editor, refunds, raw usage corrections and email renewal delivery are not part of this initial manual-billing implementation. Broader operational upload throttles are not converted to successful-upload quotas in this change.

## UI direction contract

THESIS: let an organizer understand remaining hosting capacity and complete a payment without confusing it with game repayments.
OWN-WORLD: inherit Relay Settings and Admin forms, semantic tokens, flat rows and shared feedback controls.
STORY: inspect allowance, choose Pro, pay the snapshotted destination, submit a reference, follow verification status.
FIRST VIEWPORT: compact heading then factual usage rows; payment screens place recipient/account details beside a bounded QR.
FORM: extend the established Settings/Admin workflow; no visual-world replacement or concept roll.
FINISH: the automated pre-commit gate covers formatting/lint, strict types, the full unit suite and a production build. Rendered visual review and E2E have not been performed; passing the automated gate is not a visual acceptance claim.
