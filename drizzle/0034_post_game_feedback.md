# Post-game feedback context

Adds optional completed-game context and an experience signal to the existing feedback inbox. Detailed issue reports use this context; the lightweight smooth response and dismissal use deduplicated `product_events` so they do not create support tickets.

`session_id` uses `ON DELETE SET NULL` so deleting an ephemeral game does not erase a player’s support history. The submission retains its written description and review status without retaining a reference to the deleted game. The `(user_id, session_id)` uniqueness constraint permits at most one contextual response per player and game while continuing to allow multiple ordinary feedback submissions with no game attached.

The existing server-only feedback authorization remains unchanged. Contextual submissions additionally require the account to host or belong to the completed game. `experience` is limited to `smooth` or `issues`; current detailed reports use `issues`, while ordinary feedback keeps it null.
