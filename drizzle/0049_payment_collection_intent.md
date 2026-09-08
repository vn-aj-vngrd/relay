# Creation payment intent

## Scope

Add `sessions.payment_collection_requested`, a non-null boolean defaulting to false. It records a host’s choice to collect payment without creating an expense, payment account, player price, or player obligation. Existing rows keep their prices, records, proof, and authorization unchanged. Collection existence and authoritative player price continue to determine payment presentation and discovery; this flag does not override them.

New creation forms save only Decide later, Free, or Collect payment. The original host completes collection setup in Game settings → Payments, reached from Overview’s existing access/listing section. Settings preselects Collect payment when intent is recorded. Saving Free or unset clears intent under the session lock and still rejects games with any existing expense. Clearing intent without changing the price sends no price-change notification. Saving a collection records collection intent in the same transaction.

Legacy browser drafts with amounts or payment details retain the editable legacy form and atomic account/collection creation path. No account details are added to the session row. Play Again does not copy intent, expenses, or payments.

## Deployment

Generated locally with `pnpm db:generate --name payment_collection_intent`. Applied to the configured database during this session; its migration record and boolean/non-null/default-false column definition were verified. Apply through the established migration process with owner authorization before deploying the new application: full session queries select the added column. No policy, storage, realtime, or service configuration changes are required. Existing session invalidation remains authoritative.

Pre-commit lint/format checks, strict typechecking, all 1,806 unit tests, and the production build passed. The full unit suite used four workers after an existing Quick Play test timed out under default concurrency; no timeout or test coverage was changed. Review deployment against a disposable database before release; E2E remains opt-in and was not run.

## Rollback

The additive column may remain during application rollback. Older code ignores intent, so defer rollback or explain pending setup to hosts if intent-only games exist. Never infer Free from missing price or backfill obligations from this flag. Prefer rolling forward rather than dropping recorded host intent.
