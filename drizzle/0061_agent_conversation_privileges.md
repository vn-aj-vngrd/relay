# Saved conversation Data API privileges

Follow-up to the already-applied `0059_agent_conversation_history`. Revoke all
Supabase Data API role privileges, including `service_role`, matching Agent
settings and message usage. RLS alone cannot restrict a role that bypasses RLS.

Apply with `pnpm db:migrate` before deploying saved chats. This changes table
permissions only; it does not rewrite or delete conversations. Authorized Agent
services continue to use the server database connection with owner predicates.

Verify `has_table_privilege` returns false for SELECT, INSERT, UPDATE and DELETE
for `anon`, `authenticated` and `service_role`, and that the server connection can
still read the table. Keep the revoke in place when rolling back application code;
there is no need to restore direct Data API access.

Applied September 16, 2026 through the configured database connection. Verified
all three roles lack SELECT/INSERT/UPDATE/DELETE and the server connection retains
read access; the migration ledger records `0061`. No message content was read.
