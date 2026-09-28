# Agent reply rating time

Apply `0066_agent_reply_rating_time.sql` after `0065_agent_reply_feedback.sql`
and before deploying reply ratings. It records when a player first submits or
replaces a rating. Admin review updates the feedback row's general `updated_at`
timestamp, but does not change `agent_rated_at`, so 30-day rating counts reflect
player activity only.

The migration adds a nullable column and a check requiring it exactly when an
Agent rating is present. No historical backfill is needed because reply rating
controls had not been deployed when this migration was created; the production
table had zero Agent rating rows. Existing general feedback rows keep both
Agent-specific fields null.
