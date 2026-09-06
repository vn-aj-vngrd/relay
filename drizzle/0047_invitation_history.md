# Invitation history

Adds nullable `session_players.invitation_received_at` as durable account-invitation provenance. `invited_at` predates this distinction and defaults on every roster entry, including self-joins, so it cannot identify invitations.

Backfill uses the most recent `session_invite` notification for the account/session pair, then unanswered account-player invitation rows. Answered invitations whose notifications were already deleted cannot be reconstructed safely; they remain absent rather than classifying self-joined players as invitees. No RSVP or session status changes.

Creation and roster reinvitation set the timestamp explicitly. RSVP changes preserve it. Removing a membership hides it from this account's history; reinvitation restores membership and updates the timestamp. Existing membership authorization remains unchanged.

Apply this additive migration before deploying code that selects the new column. No changes to Supabase authentication, storage, or realtime configuration are required.
