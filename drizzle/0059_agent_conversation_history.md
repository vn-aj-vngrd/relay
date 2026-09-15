# Agent conversation history

Adds account-owned saved conversations with JSON text messages, a title, timestamps and a short active-request lease. The user foreign key cascades on account deletion. RLS is enabled without client policies and privileges are explicitly revoked from anon/authenticated; access is through server-owned services with an owner predicate on every operation.

Apply with the normal migration command before deploying the history UI. No credential or model configuration changes are required. Applied on September 15, 2026 using the configured database connection. Verified RLS enabled and no anon/authenticated SELECT or write privileges.

Chats are retained until deleted. Deletion removes the transcript row; ordinary database backup retention still applies. Existing in-memory conversations are not backfilled. Rollback discards saved history and should only be performed deliberately after reverting the application feature.

Follow-up migration [0061](0061_agent_conversation_privileges.md) also revokes
`service_role` access. Apply the complete migration chain to keep transcripts
outside the Supabase Data API, including roles that bypass RLS.
