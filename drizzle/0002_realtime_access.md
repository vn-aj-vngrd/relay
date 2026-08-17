# Realtime participant access

Adds read-only RLS policies for authenticated session participants on courts, matches, match players, score events, queues, messages, and message reactions.

These policies allow Supabase Realtime to deliver committed collaborative state while application mutations remain server-authorized. A user must have a `session_players` row with Going, Maybe, or Waitlisted status. Guest RSVP identities do not receive authenticated Realtime events and use authoritative page refreshes.

Verify by opening the same active Play session in two authenticated browsers, changing a score in one, and observing the other refresh without navigation.
