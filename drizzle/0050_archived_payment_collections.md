# Archived payment collections

## Scope

Add nullable `expenses.archived_at` and `archived_by_id`. Existing collections remain active and existing prices, amounts, proof, and accounts are unchanged. An archived collection cancels outstanding obligations without rewriting paid amounts or using paid/excluded as cancellation states. A cancelled pending proposal is appended to its adjustment history before clearing the proposal.

The original host confirms switching to Free against a digest of session version, collection data, and payment activity. The server rechecks the digest after acquiring the same session lock as proof, review, roster, and adjustment mutations. All active collections (including legacy multiple collections) archive together. Payment account details and uploaded proof/receipts are retained. Pending collection-request deliveries are suppressed and affected account players receive one price-change notice. Already delivered external notifications cannot be recalled; current Payments remains authoritative.

Both Payments routes separate active obligations from read-only history. Paid records and submitted/rejected proof are flagged for manual host follow-up. No refund is recorded or implied. Archived expenses remain visible in administrative counts and explicitly authorized game deletion retains its existing behavior.

Free-to-Collect starts a new collection with reviewed instructions, no restored obligations, and the existing Free-to-paid consent cutoff for previously joined players. New participants see the active price. A split with only zero consent-pending shares is not advertised as Free. New cycles cannot begin after completion; existing follow-up and closing collections are allowed. Cancelled games remain read-only. Decide later cannot erase collection history.

## Database safeguards

The migration adds insert/update guards on player payments and an update guard on expenses. These serialize writes with the session lock and reject changes to archived collections, including moving a payment to another expense. Application mutations also use active-collection predicates under that lock. These are defense in depth, not replacements for existing account/guest authorization. No new table, RLS grant, storage bucket, or realtime subscription is introduced.

Session price aggregation, discovery price metadata, Overview totals, and roster reconciliation ignore archived collections. Reconciliation returns without changing an explicit Free price when only history exists. New collection setup never edits historical accounts or obligations.

## Deployment

Generated locally using `pnpm db:generate --name archived_payment_collections`, with reviewed custom trigger SQL appended. **Applied to the configured database during this session.** The migration ledger, both archival columns, the foreign key, and both enabled guard triggers were verified. Pre-commit lint/format checks, strict typechecking, all 1,806 unit tests (four workers), and the production build passed. Live database concurrency behavior remains a release check. Apply only with owner authorization through the established migration process, before running the new app code. Full expense queries require the added columns.

Coordinate the deployment so old payment writers cannot run over archived data: old aggregation code does not exclude history. Prefer a controlled write pause and roll forward. Do not automatically apply migrations from requests or tests. The pre-commit gate is complete; browser/E2E validation was not run. Before production release, review the migration against a disposable database, including concurrency and trigger behavior. E2E remains opt-in.

## Rollback

Keep archival fields and trigger guards once any collection has closed. Deploying old pricing/reconciliation code over history may recreate apparent obligations. Roll forward or suspend payment writes; never unarchive records or drop cancellation history to accommodate an old writer.
