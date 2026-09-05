# Normalize match court labels

Migration `0043` removed configurable court names but deliberately preserved match snapshots. Active courts therefore continued displaying retired custom names. This follow-up removes those remaining structured labels.

## Data changes

- Re-normalizes `courts.label` to `Court <position>`.
- Normalizes every linked `matches.court_label`, including active, completed, and cancelled matches, using the court's persisted position.
- Uses `Court` for snapshots whose court was deleted instead of guessing a number.
- Preserves court and match IDs, assignments, availability, players, scores, standings inputs, versions, and timestamps. Existing free-text chat and notification history is not rewritten.
- These updates are idempotent. This is a data-only migration with no schema changes.

## Application behavior

Both shared and authenticated Play queries derive labels from court positions, including the compact personal status outside Play. The rotation planner generates numbered labels even when a stored court still has a retired custom name. Live UI therefore does not depend on migration timing.

## Deployment

After pre-commit validation and deployment review, retire old application instances and apply through `pnpm db:migrate`. Review all pending migrations first; this command applies the journal, not only this file. Confirm active court identifiers and completed results use numbered names on both access paths. The updates use the existing Broadcast invalidation triggers.

The old labels are irreversibly replaced; restoring them requires a backup. No games, court records, matches, or scores are deleted.
