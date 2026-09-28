# Agent reply feedback

Apply `0065_agent_reply_feedback.sql` before deploying the reply rating controls
and Admin rating counts. It extends the existing `feedback_submissions` table;
the table's existing row-level security and Data API privileges remain in place.

Each rating stores the account ID, conversation and reply IDs, Good or Needs
work, fixed reason codes, and optional player-written details. It does not copy
the question, answer, tool data, or full conversation. The API checks current
conversation ownership and confirms the reply is a saved assistant message
before inserting or updating. A unique constraint keeps one rating per account
and reply. The IDs remain with the feedback record if the chat is later deleted,
so the admin review signal survives without retaining its transcript.

If this migration is missing, rating submission fails with a recoverable error;
Agent answering still works. Admin usage continues to show message usage while
rating and report counts are marked unavailable.
