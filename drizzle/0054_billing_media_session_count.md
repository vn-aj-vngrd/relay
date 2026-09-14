# Per-game photo-count index

Adds `billing_media_session_kind_status_idx` on `(session_id, kind, status)` to support the shared game-album count on Story reads and upload reservations. A composite index supports parameterized predicates without requiring a partial-index predicate to be inferred by a generic query plan. Reserved and stored photos count; released photos do not.

Apply this migration through the normal migration process before releasing the new photo-count path. The standard index build may temporarily block writes to `billing_media`; schedule it during low traffic. No records, quotas, authorization policies or storage objects are changed. Application code remains compatible before and after the index exists, but the performance improvement requires the migration.

Rollback, if needed: drop only `billing_media_session_kind_status_idx`. Do not remove other billing indexes or records. This migration has been generated and reviewed locally, not applied to a hosted database.
