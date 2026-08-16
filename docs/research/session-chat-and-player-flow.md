# Session chat and player-flow decisions

Researched: August 16, 2026

## Reference patterns

Messenger exposes reactions directly beneath a message and makes them visible to everyone in a group conversation. This keeps acknowledgement contextual instead of creating a separate activity feed.

Source: [Messenger Help — message reactions](https://www.facebook.com/help/messenger-app/1602676269761759)

Instagram and Messenger group conversations establish a familiar structure: other people’s messages align left with identity context, the current person’s messages align right, system activity is visually quieter, and the composer stays available at the bottom. Relay uses that conventional grammar while retaining its own restrained colors, typography, and session navigation.

Sources: [Instagram Help — group chats](https://help.instagram.com/885515954830762/), [Messenger Help Center](https://www.facebook.com/help/messenger-app/)

## Relay role model

Relay does **not** create permanent “host accounts” and “player accounts.” Roles belong to a session:

- A person can host Saturday’s game and be a player in Tuesday’s game.
- The creator is the session host.
- A co-host receives management permissions for that session.
- A confirmed member is a player and can open the game workspace, chat, payment share, courts, queue, scores, and memories.
- A guest can RSVP from the public link. Signing in is required for persistent chat, personal payment proof, and account history.

This avoids onboarding complexity and matches the session-first domain.

## End-to-end player flow

```text
invite link
  → understand plan without signing in
  → RSVP instantly OR request host approval
  → sign in for participant tools
  → see game in Home and Games
  → chat with the group
  → view payment instructions and assigned share
  → pay externally and upload one proof image
  → host confirms or requests clearer proof
  → view court, queue, live score, and session standings
  → add photos and comments after completion
```

## Host roster flow

A host may mix both entry methods:

1. Add friends by name before sharing anything.
2. Share the public invite for self-service RSVP.
3. Optionally require approval for join requests.
4. Approve, reject, remove, lock, or unlock the roster.
5. Capacity remains authoritative: approved players enter the waitlist when full.
6. Removing a going player promotes the earliest waitlisted player.

## Payment consistency

Unpaid shares may be recalculated while the roster changes. Once any player submits proof or is confirmed paid, the split stops changing automatically. Hosts can then override an individual amount or exclude a player without rewriting payment history.
