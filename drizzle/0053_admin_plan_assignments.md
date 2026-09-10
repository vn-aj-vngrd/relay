# 0053 — Admin-only plan assignments

Adds nullable `billing_overrides.plan_override` JSONB for a snapshotted admin plan assignment. Existing overrides retain their numeric allowances and expiry. No accounts are automatically assigned Unlimited, and no usage, terms, payments or media are rewritten.

Apply after 0052 and before deploying code that selects this column, using the normal backup/migration process in `docs/integrations.md`. This migration has been generated, not applied.

## Defaults and visibility

Catalog normalization merges existing records by identity with defaults. The fourth default is Unlimited: admin-only, always hidden, with no game-creation or retained-photo-storage quota. Its numeric zero defaults are placeholders; explicit unlimited flags control enforcement rather than artificial huge quotas or Infinity. Ordinary numeric account overrides still take precedence, including zero.

The visibility field is stored in the existing catalog JSON. Old entries without visibility default to visible. Unlimited is forced hidden even if malformed stored JSON marks it visible. Public pricing payloads, cards, tables and self-service options exclude hidden plans. Server purchase validation independently rejects hidden plans; Unlimited is not an accepted checkout plan ID. Hiding a paid plan blocks new requests, including renewals, but preserves existing requests and terms.

## Operations

- Admin → Billing → Plans & pricing: toggle public visibility for commercial plans. Unlimited is described as admin-only rather than offered as a product for sale.
- Admin → Users → account → Plan & allowances: select an assigned plan (including hidden plans), optional numeric overrides, optional Philippine-date expiry, reason and confirmation. This works even when the account has an active/scheduled subscription.
- Assignment snapshots override the underlying paid term or Free. Numeric account limits override that assignment. Blank numeric values inherit; under Unlimited they mean no hosting quota. Existing assignments retain their snapshot when only limits or dates are edited.
- Removing the assignment restores the current subscription or Free. Paid terms continue to run underneath the assignment; they are not paused or refunded. Usage windows and actual usage never reset on assignment changes. An expired assignment is ignored at read/mutation time.
- Unlimited preserves media reservations, actual byte accounting, per-file limits, per-uploader daily limits, player/court ceilings and abuse controls. Provider storage/compute charges still apply. It is not a promise of unlimited infrastructure.

Own-account sidebar, profile and Settings read the effective plan; other viewers' profiles do not disclose billing plans. Upgrade prompts consider only visible commercial capacity improvements, and do not upsell admin-managed assignments. Root layout revalidation and the existing notification refresh update account chrome after assignment changes. Expiry remains authoritative in server reads and mutations; an already-mounted label refreshes with the next server refresh, not a new polling system.

## Rollback and acceptance

Do not deploy a binary that ignores assignments while assigned accounts rely on Unlimited. Pause collection and use a forward fix, or explicitly remove assignments through the admin workflow before reverting code. Keep additive columns and audit history.

Verify owner/admin authorization, hidden-plan exclusion, direct checkout rejection, assignment removal/expiry, preserved paid terms/usage, explicit zero overrides and continuing upload safeguards before release. Unit coverage was added but not executed. Validation deferred to pre-commit; browser acceptance and E2E have not run.
