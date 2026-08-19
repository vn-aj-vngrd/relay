# Cebu court directory

## Purpose

Adds moderation and provenance to Relay’s existing venue records so the Cebu court finder can show sourced listings without treating every imported or submitted record as verified.

## Data behavior

- Existing venues remain `verified`.
- Directory imports start as `unverified` and remain visible with a confirmation warning.
- Player submissions start as `pending` and are hidden from the public finder until an admin approves them.
- Rejected and archived records remain available to admins for audit and deduplication but are hidden from players.
- Source IDs are unique per source, making imports idempotent.
- Sessions retain their venue snapshots if a directory record is later corrected or archived.

## Authorization

The public venue read policy now exposes only `unverified` and `verified` records. Creation, moderation, and editing continue through server-authorized actions. Admin actions check the `ADMIN_EMAILS` allowlist; player submissions derive the submitter from the authenticated session.

## Import source

The importer reads factual court information and coordinates from the public Cebu Pickleball Courts WordPress API, whose robots policy allows public content outside `/wp-admin/`, and may include independently reviewed first-party venue announcements such as SM Supermalls. Relay stores no third-party photos or editorial copy. Every imported record keeps its source page URL and remains labeled unverified until reviewed.

## Rollback considerations

Dropping the new columns removes moderation provenance. Before rollback, export pending submissions and ensure no application query depends on `listing_status`. Restore the former `Public venues are readable` policy only if exposing all remaining venue rows is intended.
