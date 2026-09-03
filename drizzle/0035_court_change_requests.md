# Court access and change requests

Adds explicit access, reservation, and operational-status fields to courts so public/private access is no longer inferred from price. Existing records intentionally backfill to `unknown`; review must establish these facts rather than inventing them.

Adds `venue_change_requests` as the private moderation record for both missing-court submissions and proposed updates. Requests store a validated proposed patch, evidence links, contributor identity, review lifecycle, and resolution. They never mutate public court data directly.

The new table has row-level security enabled and grants no Data API access to anonymous or authenticated roles. Authenticated submissions and allowlisted admin review continue through authorized Server Actions using the server database connection. Deleting a user or court retains the moderation record while nulling its foreign key.
