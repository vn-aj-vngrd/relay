# Agent creation proposals

Adds default-off game and group creation controls and server-owned confirmation records. Existing games, groups, and Agent credentials are unchanged.

## Access and lifecycle

The proposal table uses RLS with no client policies. PUBLIC, anon, authenticated, and service_role receive no privileges; only the trusted server database connection accesses it with explicit owner predicates. Records cascade when their owning account or conversation is deleted. Pending previews expire in application logic; completed result references support idempotent confirmation recovery.

## Apply and verify

Apply through `pnpm db:migrate`, preserving the Drizzle ledger. Verify the migration hash, both false column defaults, the conversation index, cascading foreign keys, status constraint, enabled RLS, and denied Data API grants. Confirm the server connection can read the table. Applying this migration does not enable creation or deploy application code.
