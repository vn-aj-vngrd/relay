# Roster approval and session chat

## Intent

Completes the two ways a host builds a recreational roster—adding friends by name or sharing an invite—and upgrades session chat with private image attachments.

## Data changes

- Adds `pending` to `rsvp_status` for host-reviewed join requests.
- Adds `sessions.requires_approval`, defaulting to `false`, so existing links retain instant RSVP.
- Creates the private `chat-images` Storage bucket for JPG, PNG, and WebP files up to 8 MB.

## Behavior

- Approval is session-specific. Relay does not create permanent “host” and “player” account types; the same person may host one game and join another.
- Pending players cannot use participant chat or live controls until approved.
- Hosts and co-hosts can approve, reject, add, remove, lock, and unlock roster entries.
- Removing a confirmed player promotes the first waitlisted player.
- Unpaid expense splits are recalculated when the confirmed roster changes. Splits stop changing after any proof is sent or payment is confirmed.
- Chat images remain private and are served with short-lived signed URLs.

## Apply

```bash
corepack pnpm db:migrate
```

## Verify

1. A normal invite joins immediately while capacity remains.
2. An approval-enabled invite creates a pending request visible only to session managers.
3. Approving at capacity moves the requester to the waitlist.
4. Removing a going player promotes the earliest waitlisted player.
5. Host-added guests appear in the roster and Play queue.
6. A participant can send text, attach one valid image, and react to messages.
7. A pending or removed player cannot send chat messages.
