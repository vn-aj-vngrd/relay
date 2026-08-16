# Public session workspace

## Intent

Makes the shared session link useful courtside for signed-in players and lightweight guests. Initial data still renders on the server; these policies allow Supabase Realtime to deliver read-only updates to an anonymous browser holding the link.

## Access

Anonymous realtime reads are limited to sessions that are:

- `public` or `link` visibility, and
- `published`, `live`, or `completed`.

The policies cover courts, matches, match players, the session queue, messages, and message reactions. They do not permit anonymous writes. Guest chat and payment mutations continue through authorized Server Actions using the guest’s HttpOnly session token.

Private sessions remain inaccessible from public routes and anonymous realtime subscriptions.

## Apply

```bash
corepack pnpm db:migrate
```

## Verify

1. Open a link-visible live session in two anonymous browsers.
2. Change a score or queue position as the host and confirm the public Courts route refreshes.
3. Send a guest chat message and confirm the other browser refreshes.
4. Confirm anonymous direct inserts remain denied.
5. Change the session to private and confirm public routes return not found.
