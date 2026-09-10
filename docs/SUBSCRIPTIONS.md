# Personal subscriptions and manual billing

## Product contract

Subscriptions belong to individual accounts. Groups, co-hosts and players do not buy seats. The host's plan supplies game-creation and hosted-media allowances; joining, RSVP, Play, scoring, basic recap and game repayment remain available on all plans.

| Default allowance | Free | Plus | Pro |
| --- | --- | --- | --- |
| Price per month | PHP 0 | PHP 149 | PHP 299 |
| Successfully created games per month | 5 / Philippine calendar month | 12 / monthly term | 30 / monthly term |
| Retained chat images + game photos | 100 MiB total | 500 MiB total | 2 GiB total |
| Players / courts per game | 40 / 20 | 40 / 20 | 40 / 20 |

`src/features/billing/domain.ts` supplies defaults. `billing_settings.plan_catalog` stores the admin-published catalog; `src/features/billing/catalog.ts` supplies it to pricing, account billing and enforcement. Paid tiers default to Coming soon. Monthly prices (PHP), monthly game allowances, total storage and Active/Coming soon/Paused availability are editable in `/admin/billing/plans`. Free must stay available at PHP 0. Technical player/court ceilings, per-file limits and daily upload/security safeguards are not commercial settings. Commercial plans also have a public visibility toggle; hidden plans cannot be bought through self-service, including renewals, but remain assignable by admins. Existing requests and terms are unchanged.

Each publication generates a new tier-prefixed version and audited before/after state, and rejects stale edits. Payment requests and terms retain their agreed price/allowance snapshots. Free allowance edits apply immediately without resetting actual usage. Per-account overrides retain precedence. Null catalogs use the documented defaults; source defaults are not a substitute for an operator publishing their offer.

Paid access starts after admin approval. Plus/Pro identity comes from the snapshotted tier-prefixed plan version, including legacy `pro-v1` records. Choosing a different paid plan schedules it after existing paid-through access; there is no mid-term proration. Early renewal appends a calendar-month term after the paid-through date. January 31 clamps to February's last day; subsequent terms anchor to their actual start date. Initial upgrade carries current-calendar-month creations into the first Pro term. Expiry resolves directly from the current time; a missed background task cannot preserve expired access. Free fallback counts creations in the current Philippine calendar month.

Games are charged only in the same database transaction as successful creation. A form retains an idempotency key across retries; a repeated key returns the already-created game. Deleting or cancelling never refunds creation usage. New creation still has an independent 20-attempt/minute abuse throttle.

## Admin-only Unlimited and account assignments

Unlimited is a fourth default, always hidden from public pricing and unavailable to checkout. It removes game-creation and retained-photo-storage quotas without disabling per-file, daily-upload, player/court or abuse safeguards. Actual usage and storage reservations are still recorded; provider costs are not unlimited or waived. No account receives it automatically based on admin role.

Admin account billing can assign any catalog plan to any existing account, even with paid access already active/scheduled. An assignment snapshots the selected plan and uses the existing optional override expiry. Precedence is active assignment → current paid/complimentary term → Free, followed by explicit numeric account overrides. Blank numeric values inherit; under Unlimited they remove that hosting quota. Explicit zero still blocks new usage. Assignment changes require admin authorization, reason and confirmation and generate audit/notification records.

Removing/expiring an assignment restores the currently effective underlying subscription or Free. Paid dates keep running; assignments do not pause or rewrite terms or refund/reset actual usage. Existing assignment snapshots stay fixed when only their numeric overrides or date change.

Own-account sidebar shows name with the effective plan below it; own profile and Settings show the same plan and contextual billing action. Other players' profile views omit billing details. Upgrade prompts target visible, active capacity improvements with payment collection available; Coming soon uses Explore plans, and admin-managed assignments use Plan & billing without upselling. The shell/profile summary is request-memoized and does not query full game/media usage totals. Labels resolve on server refresh; enforcement never relies on a cached label.

## Account surfaces

- `/pricing`: public monthly plan cards first, then a grouped comparison table and FAQs, with prices/allowances from the published catalog. Landing uses the same cards. Coming soon has no purchase action; Paused is distinct. Purchases require both an Active plan and enabled collection with an enabled payment method.
- `/settings/plan` (Plan & billing) reuses the Settings underline navigation with three URL-backed tabs: **My plan** (default: effective plan, usage, photo management and pending payment), **Plans** (summary pricing cards, one `/pricing` details link and selected-plan payment setup), and **History** (plan and payment records). Each tab only queries its relevant data. The full comparison and FAQs live only on `/pricing`. Selecting an available card uses `?section=plans&plan=plus|pro`; legacy `?plan=` links still work. Unavailable/hidden selections never expose a form. Admin-managed accounts can browse summaries but are not offered an ineffective upgrade action. Submitted plan versions are checked again server-side before creating a request. Contextual Upgrade/Explore links open Plans; generic billing management links open My plan.
- Plan history lists snapshotted paid/complimentary terms and the latest admin assignment, without exposing private audit notes or claiming to include earlier assignment changes. Active underlying terms are distinguished from admin-assigned access. Term history and payment history have independent stable five-record cursors. Both histories are visible in the dedicated History tab, without nested disclosure controls. Legacy payment/term cursor links and `?payments=1` open History; explicit tab selection takes precedence.
- `/settings/plan/requests/[id]`: owner-only snapshot of payment instructions, QR, amount, account details, policies, transaction-reference submission, optional private proof and review state.
- `/settings/plan/media`: host-owned photo management and storage release; game settings → Invite also exposes participant image permissions to the original host.

Both authenticated and shared-link chat/memory actions use the same reservation service. A photo spends the uploader's daily allowance and the host's storage. The participant is never asked to upgrade their own account to fix a host-storage limit.

Chat: one JPEG/PNG/WebP per message, at most 1 MiB, 10 uploads/day/account across games (session-scoped for guests). Memory photos: at most 2 MiB, 20/day/account across games. These counts reserve in-flight uploads and retain successful usage after deletion. Day boundaries are midnight Philippine time. The smaller-file requirement is explicit; no automatic compression is claimed.

Other avatar/group/payment-proof limits remain operational, attempt-based UTC throttles. Payment files do not spend the host's billable media storage. The old five-collections/day restriction is removed; payment management keeps its existing per-minute safeguard. The obsolete `CHAT_IMAGE_MAX_BYTES` environment override is retired so upload validation and plan copy share one 1 MiB policy.

## Admin surfaces

- `/admin/billing`: existing `AdminInfiniteRecords` pattern, stable 30-row cursors, shared admin-pagination API authorization/rate limit, no payment proof or recipient details in list payloads.
- `/admin/billing/plans`: versioned price and allowance publication, per-tier launch/paused controls, links to account management and public pricing. Active paid tiers require payment configuration first. Changing sales availability never revokes terms or prevents review of existing requests.
- `/admin/billing/settings`: multiple payment methods, recipient/account details, optional QR upload/replacement, enabled state, instructions, sales pause, verification timeframe, support contact and operator-approved refund/dispute/retention policy.
- `/admin/billing/requests/[id]`: private proof and transaction reference, request clarification, reject or approve received funds. Another administrator must verify an admin's own payment.
- `/admin/users/[id]/billing`: effective usage, overrides with reason/optional date expiry, complimentary Plus/Pro grants (one calendar month by default, optional custom expiry) and recovery of old incomplete media uploads.

An allowance left blank inherits the current plan. Zero blocks new usage. Overrides do not bypass technical/security constraints. Expiry is the end of the selected Philippine date. Use an override to provide extra capacity rather than erasing real usage or inventing a payment. Complimentary grants cannot be repeatedly submitted while any paid-plan term remains active/scheduled. Custom grant expiry overrides the term end, not the allowance: the selected game's quota covers the whole custom term without intermediate monthly resets. It never creates revenue or replaces an existing paid term.

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

Deployment/backfill/rollback instructions: `drizzle/0051_personal_subscriptions.md` and `drizzle/0052_dynamic_billing_catalog.md`, followed by `drizzle/0053_admin_plan_assignments.md`. No production migration or payment configuration is applied by source edits. The migration grants existing beta accounts a complimentary month; communicate that transition before rollout.

## Deferred capabilities

Automatic recurring billing/provider webhooks, automatic image compression, annual plans, mid-term prorations, arbitrary feature/technical-limit editors, refunds, raw usage corrections and email renewal delivery are not part of this initial manual-billing implementation. Broader operational upload throttles are not converted to successful-upload quotas in this change.

## UI direction contract

THESIS: let an organizer understand remaining hosting capacity and complete a payment without confusing it with game repayments.
OWN-WORLD: inherit Relay Settings and Admin forms, semantic tokens, flat rows and shared feedback controls.
STORY: inspect allowance, choose Pro, pay the snapshotted destination, submit a reference, follow verification status.
FIRST VIEWPORT: compact heading then factual usage rows; payment screens place recipient/account details beside a bounded QR.
FORM: extend the established Settings/Admin workflow; no visual-world replacement or concept roll.
FINISH: the automated pre-commit gate covers formatting/lint, strict types, the full unit suite and a production build. Rendered visual review and E2E have not been performed; passing the automated gate is not a visual acceptance claim.
