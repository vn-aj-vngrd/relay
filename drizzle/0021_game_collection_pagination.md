# Game collection pagination index

Adds `session_players_user_rsvp_idx` on `(user_id, rsvp, session_id)` to support authenticated game-history pagination without scanning the full player roster table.

This migration changes no authorization, deletion behavior, or historical data. It is safe to apply online with the normal Drizzle migration workflow.
