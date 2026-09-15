# Admin image upload limits

Adds `chat_image_max_mib` and `memory_image_max_mib` to the existing global
`billing_settings` row. Both default to 4 MiB, increasing the former chat limit of 1 MiB and
album limit of 2 MiB to give phone photos more headroom. Apply this migration before deploying the application
changes; it has been generated locally and does not apply itself.

Admin → Operations overview → Photo upload sizes saves both whole-number limits
atomically with an audit record. The existing `requireAdmin` gate requires an
allowlisted account with verified MFA. Existing billing settings RLS remains in
force; no new client write grants or storage policies are introduced.

Both settings accept 1–4 MiB. This conservative application ceiling fits below
the committed 8 MiB chat bucket, 25 MiB album bucket and 11 MB Server Action body
limit, while reserving room for multipart overhead below Vercel’s [4.5 MB request-body limit](https://vercel.com/docs/functions/limitations). Larger
limits require a separate review of the deployment's request-body limits and
storage configuration. This migration does not change bucket limits.

The chat composer, album upload hint, pricing comparison, upload actions and
storage reservations use the saved limits. Existing open pages must refresh to
show a changed value; uploads recheck the current policy. In-flight reservations
already accepted before a save can finish. Existing images remain available;
storage quotas, daily upload limits and the 50-photo album cap are unchanged.
All chat and album uploads charge the game host’s account, including files added
by other players and guests. Uploader identity is used separately for daily
abuse limits. Larger originals still need resizing; automatic compression and
direct-to-storage uploads are outside this change.

## Verification before release

- Run `pnpm check:full` before committing.
- Apply the migration to a test backend.
- With an MFA-verified admin, save different chat and album limits; verify the
  audit event and both values after a reload. Reject empty, fractional, zero and
  greater-than-four values without partially saving either setting.
- Check authenticated and shared-link chat and Story upload forms. Accept an
  image exactly at the configured limit and reject one byte over it. Lower a
  limit while a form is open and verify the stale form cannot bypass enforcement.
- Confirm the pricing comparison shows both saved values and an ordinary account
  cannot save settings. Existing images and host storage accounting must remain
  available.

Unit/component regressions cover saved limits, exact byte boundaries, admin
authorization and host-owned storage for account and guest uploads. See the PR
for local check results. Browser execution and live database/deployment
validation remain outstanding.
