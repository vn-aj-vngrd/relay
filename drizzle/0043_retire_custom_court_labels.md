# Retire custom court labels

Court names are no longer configurable. Hosts use **Note for players** for venue instructions; Play keeps automatic **Court 1**, **Court 2**, etc. identifiers for assignments.

## Data changes

- Drops `sessions.court_numbers` and its saved custom names.
- Resets existing `courts.label` values to `Court <position>` so future assignments cannot reuse legacy custom names.
- Preserves court IDs, positions, availability, match assignments, scores, and `matches.court_label` snapshots. Existing active matches retain their original identifier until they finish; completed results and historical messages remain unchanged.
- Creation and settings ignore retired fields submitted by older clients. Existing browser drafts can still resume, but custom names are neither rendered nor submitted by the new form.

## Deployment

Deploy the application removal before applying this migration, and retire old application instances before dropping the column. The new application does not select or write the removed column and can run against the old schema during this transition. Until migration is applied, previously saved court records may still supply custom names to Play.

Apply through the normal migration process after pre-commit validation and deployment review. This migration removes custom-name data irreversibly; restoring it requires a backup. Do not roll back to code that expects `court_numbers` without restoring the column.
