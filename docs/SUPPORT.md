# Relay support process

**Owner:** Relay operator (`vanajvanguardia@gmail.com`)

Relay’s public beta support channel is email. The owner reviews it every business day.

## Response targets

- suspected credential exposure, unauthorized access, or active abuse: acknowledge within 24 hours;
- inability to access a game, RSVP, Play, payment proof, or account: acknowledge within two business days;
- court corrections, feature requests, and general feedback: acknowledge within five business days.

These are response targets, not resolution guarantees. Never ask a player to email a password, one-time code, guest token, payment screenshot, database dump, or private game content. Direct security reports through `/.well-known/security.txt` and preserve only the minimum evidence needed.

## Triage

1. Record received time, affected route/session ID, impact, and safe reproduction details.
2. Classify availability, abuse, data integrity, provider quota, account access, or product question.
3. Use the incident controls in `PUBLIC_RELEASE_AUDIT.md` for active incidents.
4. Confirm receipt without promising an unverified cause or deadline.
5. Close with the correction, workaround, or explicit next review date.

During launch week, arrange a second operator destination before unrestricted signup so urgent reports do not depend on one inbox or person.
