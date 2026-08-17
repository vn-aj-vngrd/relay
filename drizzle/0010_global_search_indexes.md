# Global search indexes

Migration `0010_global_search_indexes.sql` enables PostgreSQL trigram search and adds indexes for Relay’s global typeahead.

## Why

Global search matches partial game titles, venue names and addresses, player names and usernames, and the current user’s group names. B-tree indexes cannot efficiently serve leading-wildcard `ILIKE` queries such as `%central%`; GIN trigram indexes can.

Membership lookup indexes support the authorization predicates that include a user’s unlisted sessions and groups without exposing them globally.

## Authorization

The indexes do not change visibility or RLS. The application query still limits:

- games to public sessions or sessions hosted/joined by the viewer;
- groups to groups where the viewer is a member;
- players to profile-safe fields;
- venues to public venue records.

Link-only and private sessions are never globally discoverable.

## Apply and verify

```bash
pnpm db:migrate
```

Then run an authenticated search for one character and a partial middle-of-word query. Verify `EXPLAIN (ANALYZE, BUFFERS)` can select the trigram indexes as the dataset grows. PostgreSQL may prefer sequential scans while tables remain very small.
