# Collection contributions and durable adjustments

## Scope

Additive schema for itemized collections, fixed versus split contributions, durable manual amounts, and explicit player agreement to increases. Generated locally with `pnpm db:generate --name collection_contributions`; the fixed-rate check explicitly rejects NULL and matches the schema snapshot.

- Existing expenses remain `split`; their recorded total, receipts, payer, account and IDs are unchanged. Empty `items` renders the historical label and total as one item.
- Existing payment rows default to `legacy` provenance. No amount/timestamp heuristic invents whether the original amount was automatic or manual. New application allocations explicitly use `automatic`; adjustments use `manual`.
- No payment amount, proof, review note, confirmation, exclusion, or identifier is deleted or backfilled.
- Fixed rates must be positive integer cents. A split has no fixed rate. Items and total are checked by the shared server schema before persistence; collection and share mutations serialize under the session lock.
- Existing table authorization and invalidation triggers still apply. There are no new tables, policies, storage buckets, or realtime subscriptions. Proposal/history JSON is never included in public discovery DTOs.

## Behavioral changes

Legacy and reviewed split collections pause automatic reconciliation; organizers can propose missing shares and adjust eligible existing amounts explicitly. This is intentional protection of unknown historical overrides, not a conversion to fixed pricing. New automatic splits preserve manual adjustments without passing discounts to other players. Fixed collections assign the stored rate to late arrivals independently of other players' proof state.

Fixed and split collections cannot be mixed in a game. After player shares exist, contribution methods/rates cannot be changed, and fixed games cannot add extra required collections. The fixed public price is the configured sum, not the highest individual agreed exception. Current split prices remain variable and explicitly labeled.

When a formerly Free game starts collecting, `consent_before` records the cutoff. Pre-existing roster members, including waitlisted players promoted later, receive a proposal rather than an automatic charge. Players first joining after that change see the new public price.

Amount increases leave the existing obligation unchanged until the affected player accepts the exact proposal. Declining records a manual unchanged amount, preventing a later automatic reconciliation from charging the rejected value. Submitted or reviewed proof blocks amount mutation. Zero/waived and excluded shares do not request payment proof. Relay does not move money or issue refunds.

## Deployment

Review and apply through the established migration process only with owner authorization. Apply before serving the new code: the queries need these columns. Coordinate the app rollout so old payment writers cannot continue resplitting or overwriting fixed prices. Prefer a controlled write pause over mixed-version financial writers. Do not run this migration automatically from a request or tests.

Before release, run the repository-required full gate and review the migration against a disposable database. E2E remains opt-in. Exercise creation without a roster, late joins after proof, manual waivers, accepting/declining stale proposals, and preservation of legacy records.

## Rollback

Do not drop the new columns once fixed collections or adjustment history exist. They encode obligations and player agreement. Roll forward or suspend payment writes while restoring compatible application code; deploying an old writer over fixed data would lose pricing semantics.
