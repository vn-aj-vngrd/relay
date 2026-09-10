# 0052 — Dynamic billing catalog

## Change and prerequisites

Adds nullable `billing_settings.plan_catalog` JSONB. Run after 0051. No usage, payment request, term, override or media records are rewritten, and no new beta grants are created. Existing requests and terms retain their snapshots; legacy Pro versions still resolve to Pro.

A null catalog resolves to Free/Plus/Pro source defaults (PHP 0/149/299, 5/12/30 games per month, 100/500/2048 MiB retained storage). Free is Active; Plus and Pro are Coming soon. **Even if the old global collection switch is enabled, new paid requests remain unavailable until an administrator explicitly activates a tier.** Existing request review and purchased access continue normally.

## Deploy

1. Follow `docs/integrations.md` and the normal backup/migration process. Apply this additive migration before deploying code that selects the new column. Source editing/generation does not apply it.
2. Deploy the application. Keep tiers Coming soon while checking the public `/pricing` page, landing comparison and Plan & billing values.
3. In Admin → Billing → Payment settings, verify real recipient/QR details, enabled methods, support contact, verification time and published policies; confirm the operator's tax/price disclosure requirements before charging. Enable collection only when ready.
4. In Plans & pricing, open a tier, review monthly PHP price, monthly games and total storage, select Active, provide a reason and confirm publication. This publishes a new version and audit entry. Free stays available without payment.
5. Review the exact production offer and normal paid request/approval flow through authorized operator accounts. Verify Coming soon/Paused direct submissions are rejected, stale price forms require refresh, and existing purchases remain unchanged. Do not invent proof or approve based on screenshots alone.

Admin edits use the existing billing-settings transaction lock. Payment creation acquires the account lock and then the settings lock, rechecks availability/version, and snapshots the server offer. Complimentary grants snapshot the selected plan independently of its sales availability. They default to one month, allow an explicit custom end date, and reject any existing/scheduled paid-plan term. A custom grant has one usage window, not multiple quota resets.

## Rollback

To stop new sales without removing access, disable collection or mark paid tiers Paused. Keep the additive column and all request/term snapshots. **Do not roll back to the two-tier binary once Plus requests or terms exist**: it would resolve every active term as Pro and mislabel customer access. Use a forward fix with collection paused. An old binary also ignores per-tier availability, so do not rely on Coming soon/Paused alone when rolling back code before any Plus usage; explicitly disable the global collection switch first.

No migration, production deployment or activation has been performed by the implementation session. Automated validation is deferred to pre-commit; browser acceptance and E2E have not run.
