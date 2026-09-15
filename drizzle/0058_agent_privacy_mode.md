# Agent provider privacy mode

Adds `agent_settings.require_zero_retention`, non-null with a `true` default.
Existing installations remain in strict mode. Admins can explicitly save provider
policy mode after reviewing the retention/training disclosure. Both streaming chat
and synthetic connection tests use the saved setting. No credential is copied or
rotated; existing RLS and table grants remain unchanged.

Apply before deploying code that reads the new column. This additive migration is
compatible with the previous application version. Verify the column default and
existing strict value after application; rollback application code without dropping
the column. Do not change saved privacy choices as part of deployment.
