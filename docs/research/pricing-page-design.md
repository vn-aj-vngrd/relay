# Pricing page: SaaS references and Relay implementation

## Sources and decisions

- [Linear pricing](https://linear.app/pricing) presents short plan summaries, explicit price/billing units and a feature-by-feature comparison. Adopt progressive detail and one canonical pricing destination, not its per-seat billing model.
- [Slack pricing](https://slack.com/pricing) places plan summaries before “Compare all features.” Adopt the summary-then-comparison sequence requested by the user; do not copy promotional discounts, Best value claims or unsupported enterprise features.
- [NN/G comparison tables](https://www.nngroup.com/articles/comparison-tables/) discusses side-by-side comparison for products, services and memberships. Relay groups comparable rows into hosting capacity, included features, photo uploads and billing. Same labels, units and order are used for all three plans.
- [Stripe product/price management](https://docs.stripe.com/products-prices/manage-prices) separates commercial versions and availability from historical purchases. Relay uses its own admin-managed catalog and manual payments, not a Stripe integration.

Sources were researched through search and fetched page content. No live competitor screenshot or browser-based visual comparison was performed. These patterns do not validate Relay's prices or willingness to pay.

## Direction contract

THESIS: make monthly hosting capacity understandable before asking a host to pay; refuse ambiguous game totals and monthly storage promises.

OWN-WORLD: inherit Relay's opaque surfaces, restrained semantic colors, shared buttons, typography and flat Settings/Admin forms.

STORY: scan three plans, compare specific allowances, understand reset/renewal rules, then start Free or open account billing for an available paid plan.

FIRST VIEWPORT: compact navigation, a short left-aligned introduction, then Free/Plus/Pro cards. Price, games per month, total photo storage and availability remain visible together. Cards stack on phones.

FORM: user-selected cards first, grouped comparison table second, FAQs last; no concept roll because composition was explicitly specified. The table remains semantic and has a labeled keyboard-focusable horizontal scroll region.

FINISH: implementation review and validation remain deferred under the repository development loop. No rendered acceptance claim is made.

## Scope and reuse

`src/features/billing/plan-comparison.tsx` owns shared plan cards, comparison table and explanatory questions. Landing, `/pricing` and Plan & billing consume the same server catalog. Plan & billing now reuses only the summary cards; the full comparison table and FAQs remain exclusive to `/pricing`. Reuses `ButtonLink`, Settings forms, `SelectField`, shared alerts, Admin headings, the existing payment queue and existing account billing detail. Intentional differences: public pricing explains the offer, account billing leads with actual usage, and admin pricing exposes publication controls rather than promotional cards.

Admin can change PHP monthly prices, monthly games, total photo storage, public visibility and per-tier Coming soon/Active/Paused availability. Hidden plans are removed before public presentation, and table columns follow the visible catalog. Unlimited is a fourth, always-hidden admin-only assignment with hosting quotas removed; it is not a public offer. Technical ceilings and upload/security safeguards remain protected. Paid prices and allowances are snapshotted when a request is created, then reused on approval. Free changes apply immediately. All public plan values come from the same published catalog, not separately edited marketing copy.

## Simplified account billing

Reuse the self-service information architecture from the existing [Stripe customer-management reference](https://docs.stripe.com/customer-management): current subscription, a next action, and history. Relay intentionally keeps marketing detail on `/pricing`, not in an account-management dashboard. No additional external research was needed for this refinement.

The account page uses three task-based tabs rather than one long scroll: **My plan** for current usage and pending payment, **Plans** for summary cards, one `/pricing` link and selected-plan payment setup, and **History** for plan and payment records. History needs no nested accordion. Navigation reuses `SettingsTabs`' shared underline `TabChipRail`, including active-link semantics and narrow-screen behavior. Query-backed sections support refresh/back/deep links; legacy plan and pagination links still select the appropriate section. Only the active section's data is queried, so browsing history does not calculate photo usage. Contextual upgrade/discovery hooks open Plans directly. No billing policy or account assignments change.

The page does not repeat a feature matrix, FAQ list, generic upgrades-unavailable banner or an always-open payment form. Cards use the existing visual language; current tier, manual monthly renewal, monthly games and total retained storage remain explicit.

`AccountBilling` extends the existing authorized account-page queries and form workflow. `PlanUsage` gains an account-only compact mode; detailed admin usage remains unchanged. `PlanHistory` displays owner-scoped historical term snapshots, not current catalog prices/limits, and the latest assignment without private admin reasons. Each collection has stable five-record cursor pages; this is not a five-record history cap. Active underlying terms are not mislabeled as the effective plan when an admin assignment takes precedence. Earlier assignment changes are not included in this user-facing history.

Admin-managed Free and Unlimited assignments remain unchanged by this UI work. Those accounts see public summaries but must contact support to change their assignment; offering an upgrade that leaves an overriding assignment in place would be misleading.

## Account identity and contextual upgrade links

The existing sidebar account trigger now stacks the effective plan under the name. Its menu retains Plan & billing, while a visible compact Explore plans/Upgrade plan link appears only when a public offer can provide more capacity. The collapsed sidebar keeps account/billing access in its existing menu; mobile reaches it through the owner's profile rather than adding an upsell to courtside navigation.

Own-profile headers and account Settings show the same request-memoized plan summary. Other viewers' profiles omit billing details. Coming soon uses Explore plans, purchasable non-reducing capacity improvements use Upgrade plan, and admin-managed assignments have no upsell. Root-layout invalidation and existing in-app notification refresh carry admin changes to account chrome; labels refresh through normal server rendering, while quota enforcement always reads authoritative state.

## States and acceptance still owed

Source implementation includes Coming soon, Active, Paused/global collection off, Free, paid/complimentary account access, expired terms, stale catalog submissions, missing payment readiness, pending/failed/successful publication, confirmation and optional grant expiry. Coming soon/Paused text is not a fake disabled checkout button. Purchase links lead to account billing, where server availability and version checks remain authoritative.

Anti-slop source review: no Most popular badge, invented discounts, annual switch, automatic-renewal promise, decorative gradients, metric dashboard or nested plan cards. Cards are discrete subscription offers requested by the user; detailed comparison uses rows. No new illustration or raster assets.

Tests were added/updated but not run. Browser screenshots, responsive/contrast/focus acceptance, mechanical UI checks, lint/type/unit/build gates and independent finish review have not run. Validation deferred to pre-commit; E2E remains opt-in.
