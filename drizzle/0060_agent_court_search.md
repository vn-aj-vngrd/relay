# Agent Court Finder capability

Adds the non-null `allow_court_search` boolean to Agent settings, defaulting to true for the verified public-directory read capability. Admins can disable it independently of games and Help Center. The toggle is audited and checked when constructing server tools; it cannot enable bookings or other game mutations.

No coordinates are stored by this migration. Agent asks for a city or neighborhood in chat and does not access device location. Apply migration 0059 first, then 0060 before deploying these UI/configuration changes. Both were applied on September 15, 2026. The new column was verified non-null with a true default.
