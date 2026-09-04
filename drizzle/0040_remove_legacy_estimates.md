# Remove legacy cost estimates

Migration `0040_remove_legacy_estimates.sql` removes estimated pricing from the session model.

- Renames `sessions.estimated_cost_cents` to `sessions.player_price_cents`.
- Keeps explicit Free values (`0`) when no positive repayment share exists; real payment assignments are authoritative when the two states conflict.
- Clears every positive legacy estimate.
- Rebuilds positive player prices only from non-excluded `player_payments`, totaling each player’s shares across collections and storing the highest positive current total so public discovery never understates repayment. Zero-value payment rows remain unset rather than manufacturing a Free state.
- Leaves sessions without Free or a real repayment share unset and therefore outside Open games.

After applying, verify that no player-facing surface says “estimated” and that old test sessions without repayment rows show **Payment not set up yet**.
