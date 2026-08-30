# Profile match summary index

## Purpose

Keeps player profile statistics fast without loading every historical match into application memory.

## What changes

Adds `match_players_session_player_idx` on `(session_player_id, match_id)`. Profile statistics now aggregate match count and wins in PostgreSQL, and this index supports the player-first join into match history.

## Verify

1. Confirm the index exists in `pg_indexes`.
2. Open profiles with no matches and with match history; Sessions, Matches, and Wins must remain correct.
3. Confirm the profile query returns one aggregate row rather than one row per match.
4. Run the complete release gate.

## Rollback

Drop `match_players_session_player_idx`. The profile remains correct, but historical aggregate queries may slow as match history grows.
