# Three-tier billing consolidation: research and proposed scope

Status: original research proposal, retained as decision context. The user subsequently requested implementation with cards first, a detailed comparison table and admin-managed prices/limits/availability. The implemented source contract is now `docs/SUBSCRIPTIONS.md`; design references and remaining acceptance work are in `docs/research/pricing-page-design.md`. Proposed queue filters, a new account listing and a general override-precedence redesign below are not claimed implemented. No sales activation or production migration is authorized by this document.

## Request

Establish Free, Plus and Pro; release paid plans as Coming soon; enable later from Admin Console. Consolidate landing pricing, a public pricing page, account billing and admin management. Offer monthly terms only, with administrative account assignments and overrides.

## Primary-source findings

1. **Version commercial prices rather than rewriting purchases.** Stripe recommends creating a new price for a changed amount; used prices retain history. Its lookup-key pattern lets public pricing and checkout use the same selected price. Relay recommendation: one versioned catalog supplies every surface and server-side purchase validation; requests and terms retain snapshots. Source: https://docs.stripe.com/products-prices/manage-prices (Create a price, Lookup keys, Edit a price).
2. **Stopping new sales must not revoke existing access.** Stripe explicitly says archiving a price prevents new subscriptions while existing subscriptions remain active. Relay recommendation: separate sales availability from account entitlements and existing-request review. Source: https://docs.stripe.com/products-prices/manage-prices (Archive a price).
3. **One account billing destination is an established self-service pattern.** Stripe's customer portal groups subscription management, billing information and invoice history. Relay should adapt the information architecture, not copy unsupported card, invoice or automatic-renewal features. Source: https://docs.stripe.com/customer-management.
4. **Sensitive transactions require server-controlled authorization and state transitions.** OWASP recommends showing significant transaction data, enforcing authorization on the server, and preventing transaction details from changing after authorization. Relay recommendation: confirmation previews, server rechecks, concurrency protection and idempotency for approvals, assignments and activation. Source: https://cheatsheetseries.owasp.org/cheatsheets/Transaction_Authorization_Cheat_Sheet.html.
5. **Administrative changes need attributable audit records without leaking secrets.** OWASP includes user administration and higher-risk actions in logging guidance and distinguishes audit/transaction trails from security logging. Relay recommendation: record actor, target, reason, timestamp and before/after state; exclude private proofs and full financial references from general logs. Source: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html.

These sources support operational patterns, not proof that three tiers or PHP 149/299 are optimal. No local willingness-to-pay study, production cost measurement, tax determination or payment-provider selection was performed. Retain manual collection for this scope; Stripe is a reference, not a proposed dependency.

## Existing implementation to extend

- `src/features/billing/domain.ts`: immutable Free/Pro catalog, Philippine date boundaries, monthly term calculation and allowance resolution. Currently every active term resolves to Pro: adding Plus requires explicit tier identity, not just another pricing column.
- `src/app/(app)/settings/plan/page.tsx`: usage, comparison, upgrade/renewal, open request and paginated history. The headings and upgrade condition currently assume Pro.
- `src/app/(admin)/admin/billing/page.tsx`: `AdminPageHeading`, `AdminInfiniteRecords`, payment-settings link and request queue.
- `docs/SUBSCRIPTIONS.md`: existing payment snapshots, actual-funds approval, private proof access, AAL2 administration, complimentary grants, allowance overrides, transactional usage and media reservations.
- `DESIGN.md` and `docs/UI_QUALITY.md`: shared Settings/Admin visual language, flat rows, stable pagination, semantic controls and data-only loading boundaries.

Reuse these foundations. Intentional additions are Plus identity, public comparison, explicit launch states and better admin navigation. Do not create parallel billing or media-accounting systems.

## Proposed commercial catalog

| Plan | PHP price | Successfully created games | Retained photo storage |
| --- | --- | --- | --- |
| Free | 0 | 5 / Philippine calendar month | 100 MiB |
| Plus | 149 / monthly term | 12 / term | 500 MiB |
| Pro | 299 / monthly term | 30 / term | 2 GiB |

Plus price and limits require confirmation. Preserve existing Free/Pro versions and historical snapshots. No annual switch, per-seat charge, unlimited promise or credit packs.

Monthly means one calendar-month term calculated in Philippine time, not 30 days. Renewal is manual; activation follows payment approval. Display the exact start/end dates. Initial Free-to-paid upgrade carries calendar-month game usage forward, matching the existing policy.

Chat images and game photos share the original game owner's retained storage. The uploader's subscription does not increase that game's allowance. Host permission, independent per-uploader daily limits and per-file limits still apply. Storage is not replenished monthly. Deletion releases retained storage but does not refund successful creation or daily-upload usage. An over-limit account retains existing content and gameplay; block only new affected usage.

## Proposed availability model

Keep these separate:

- **Coming soon:** paid tiers visible; no new purchase requests; Free remains usable. No QR/payment instructions for a new purchase and no implied launch date.
- **Active:** published paid tiers purchasable when payment configuration is valid.
- **Paused:** no new purchases; existing terms and review of already-issued requests remain available. Do not relabel a previously launched service Coming soon.

Default release state is Coming soon. Availability is server-enforced, including direct action submissions and stale tabs. Fail closed for new sales when configuration is missing. Admin activation must preview the public offer and require valid payment methods, recipient details, support contact, verification timeframe, refund/dispute/retention policy and an explicit tax/price-display decision. Audit activation and pause.

A global sales state should be sufficient initially; add per-tier availability only if individual tier rollout is required. Published catalog changes must invalidate all affected public/account/admin views; server purchase checks remain authoritative.

**Unresolved launch-access policy:** Coming soon alone must not silently grant paid access or remove limits. Recommended baseline is existing Free limits plus any already-granted complimentary terms. If the release should instead give everyone temporary Plus/Pro capacity, define a named, dated launch grant separately, with communication before it expires. The existing migration's beta Pro grant must be reconciled, never applied twice.

## Surface scope to confirm

### Landing and `/pricing`

Landing adds a compact three-plan comparison after product explanation, linked from public navigation. `/pricing` provides the complete comparison and concise FAQs: who pays, owner-funded photos, term/reset rules, manual verification, expiry and over-limit behavior. Free has a working start action; paid options have clear Coming soon status while unavailable. Do not invent a waitlist or a Most popular claim.

### Account: `/settings/plan`, labeled Plan & billing

Keep the existing canonical route and request/media child routes. Order information around current access and usage, term dates and scheduled changes, next payment action/open request, comparison, then payment history. Show paid versus complimentary versus overridden access accurately. No Cancel subscription button suggesting recurring debits; explain that access expires unless manually renewed. Payment requests are not automatically legal invoices or receipts.

### Admin: Billing workspace

Proposed destinations within the existing admin shell:

- **Payment requests:** needs-review default, status filters and search, oldest waiting requests first with deterministic cursor ties; user, selected tier, amount, submission date and status. Detail preserves actual-funds verification and private proof handling.
- **Accounts:** search and filter by effective tier, paid/complimentary source, expiry and active overrides. Link to the existing user billing detail; do not duplicate its mutation forms.
- **Plans & availability:** Free/Plus/Pro comparison, launch status, activation checklist and audited publish/pause actions. If catalog editing is approved, edit drafts and publish new versions rather than changing historical rows.
- **Payment settings:** existing methods, instructions, policies and support details.
- **Audit history:** reuse the existing admin audit destination with billing filters rather than creating a second audit store.

Account detail should show base plan, effective plan, access source, dates, usage, scheduled terms, override differences and history. Separate actions: verify payment, grant plan access, schedule a plan change, adjust allowances, remove an override. No generic Set paid action.

Admin access grants default to one month, with explicit start/end overrides and a required reason. Non-expiring grants should require a deliberate separate choice if approved. Preserve paid terms; temporary overrides must not overwrite the financial record or silently consume/delete scheduled paid access. Null allowance inherits; zero blocks new usage. Show the exact fallback on removal/expiry before confirmation. No raw usage resets or fabricated revenue.

## Term changes and safety decisions

Recommended initial policy: same-tier early renewal appends a monthly term; Plus/Pro changes take effect after the existing paid-through date. No automatic proration in manual billing. Use explicit temporary capacity relief for urgent mid-term needs rather than silently replacing paid access. A future self-service immediate upgrade needs a separately agreed credit/payment policy.

Admin assignments and overrides require a defined precedence: temporary plan override, otherwise current paid/complimentary term, otherwise Free; then field-level allowance overrides. Usage remains real and must never reset merely because an override changes. Plan overrides need an explicit usage window and expiry fallback preview before implementation. Reject conflicting schedules rather than guessing.

Keep current protections: another administrator reviews an admin's own payment, proof alone is insufficient, owner-only account access, private short-lived proof URLs, server-resolved prices, atomic/idempotent approval, duplicate transaction prevention and independent abuse throttles. Audit access assignments separately from received funds. Never label complimentary grants or pending requests as revenue/MRR.

## Delivery sequence after confirmation

1. Resolve the three open decisions below; complete source inspection of actions, forms, schema, usage, admin queries and marketing navigation. Read the relevant installed Next.js guides before code changes.
2. Add explicit tier/version identity and a safe migration/backfill preserving old Pro requests/terms, open requests, scheduled renewals, overrides and beta grants. Generalize enforcement and notifications to all tiers.
3. Add default Coming soon availability and authenticated admin controls; preserve existing-request review across sales changes.
4. Extend shared comparison/presentation and account billing; expose landing and pricing through the same catalog.
5. Improve admin queue, accounts and account-level plan controls using existing list/form/audit patterns.
6. Update the implemented subscription contract and rollout runbook only as behavior lands. Deploy with sales unavailable; activation is an explicit operator action after readiness review.

UI acceptance must cover mobile/desktop, light/dark, keyboard/focus, clear financial confirmation, empty/filter-empty, loading, failed/retry, offline, forbidden, stale form, pending review, expiry and over-limit states. Preserve shared tokens and flat hierarchy; no decorative dashboard metric grids, premium gradients or misleading monthly storage meters. This is a planning constraint, not a completed visual review.

Mandatory unit coverage for changed behavior: tier resolution; version snapshots; launch gating on server; stale/concurrent activation and payment requests; term boundaries and scheduling; idempotent grants/approvals; override inheritance/zero/expiry; unchanged usage through overrides; downgrade over-storage handling; host versus uploader allowance; owner/admin authorization; filtered stable pagination; matching pricing and CTA states across surfaces. Validation deferred to pre-commit; run `pnpm check:full` before committing. E2E is opt-in. No checks, browser acceptance, production migration or activation have been performed for this research draft.

## Decisions needed before a confirmed implementation brief

1. Confirm Plus at PHP 149, 12 games and 500 MiB, alongside existing Free and Pro.
2. During Coming soon, keep Free limits and existing grants (recommended), or grant every account temporary paid-tier capacity?
3. Does admin Set plan mean assigning plans to users only, or also editing public prices/allowances? Recommended scope supports assignments; if commercial editing is wanted, add versioned draft/publish controls, not unrestricted inline edits.
