# Agent settings and message allowances (0056–0057)

Apply both migrations with the normal Drizzle migrator before deploying Agent.
They create new Agent-only tables and do not modify existing game or billing data.
Agent remains disabled by default; migration does not configure a provider.

## Authorization

Both tables enable RLS with no client policies and revoke all privileges from
anon, authenticated and service_role. Access uses the server database connection.
Settings contain an encrypted provider key; only MFA-authorized admins can change
settings through the application. Usage stores identifiers and reservation metadata,
never conversation text. Deleting an account cascades its usage rows.

## Verification and recovery

Confirm both entries in drizzle.__drizzle_migrations, RLS on both tables, no client
role grants, and Free/Plus/Pro defaults of 50/250/750. Configure the server encryption
key before entering provider credentials in Admin → Agent.

The previous application revision can run with these additive tables present. Roll
back the application or disable Agent rather than dropping tables and losing keys
or quota history. Provider setup and live authorization checks are separate from
successful migration execution.
