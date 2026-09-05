# Retire queue readiness acknowledgements

Relay no longer asks waiting players to confirm **I’m ready**. Queue position and availability are the only live participation states: a player remains in the queue until they take a break, and returning players rejoin at the end.

## Data changes

- Drops `session_queue.ready_at` and its historical acknowledgement timestamps.
- Leaves queue order, queue state, player availability, match assignments, scores, and results unchanged.

The personalized readiness banner is also retired. Players use the Courts and Queue sections as the current source of assignment and waiting information.
