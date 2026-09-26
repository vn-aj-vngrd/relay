# Agent conversation archive

Migration `0063_agent_conversation_archive` adds a nullable `archived_at` timestamp to `agent_conversations`.

Existing conversations keep `archived_at = NULL` and remain in Chats. Archiving sets the timestamp; restoring clears it. Neither action deletes messages or changes conversation ownership. Deletion remains a separate, permanent action.

To verify, confirm the `archived_at` column exists, open Chat history, and switch between Chats and Archived. The two views should load without a history error, and existing conversations should remain in Chats.
