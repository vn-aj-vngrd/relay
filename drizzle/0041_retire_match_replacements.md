# Retire live match replacements

Relay no longer records substitutions during an active match. Players may still opt out of later rotations, while any courtside substitution is handled informally and leaves the original match assignment unchanged.

## Data changes

- Deletes legacy `replacement_requested` notifications. Related notification delivery rows are removed by their existing cascade.
- Deletes the two legacy system-chat message formats created by replacement requests and recorded replacements.
- Drops `matches.replacement_requested_by_id` and `matches.replacement_requested_at`, including the requester's foreign key.

Core match assignments, scores, queue state, ordinary match-assignment notifications, and completed results are unchanged. Previously recorded player replacements cannot be reconstructed; completed match attribution remains as stored.
