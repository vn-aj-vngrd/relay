# Guest chat reactions

## Intent

Makes message reactions belong to a session player rather than requiring a permanent account. This gives signed-in players and token-authenticated guests the same lightweight chat interaction.

## Data changes

- Replaces the old `(message_id, user_id, reaction)` primary key with a generated `id`.
- Adds required `session_player_id` as the reaction identity.
- Keeps nullable `user_id` for attribution when the player has an account.
- Adds a unique constraint on `(message_id, session_player_id, reaction)`.
- Backfills existing reactions through the message’s session and user membership; orphaned legacy reactions are removed.

## Safety

Guest mutations still pass through Server Actions that verify the HttpOnly guest token and confirmed RSVP. No anonymous database write policy is added.

## Verify

1. A signed-in player can add and remove a reaction.
2. A guest with a valid session token can add and remove a reaction.
3. A viewer who has not joined cannot react.
4. The reaction count updates through Realtime for public-link and authenticated viewers.
