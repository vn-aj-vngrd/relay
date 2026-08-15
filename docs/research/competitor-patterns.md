# Competitive patterns for Relay

Research date: 2026-08-15

## Question

Which proven patterns from recreational-sports products should Relay adopt without becoming a club-management, booking, league, or social-feed product?

## Primary-source observations

### Spond

Spond organizes around groups and events, combining participant invitations, reminders, availability requests, messaging, and payments. Its official team feature overview treats these as one coordinated workflow rather than separate tools. Availability requests deliberately collect intent before an event is finalized.

**Sources:** [Spond team features](https://www.spond.com/en-us/features-for-teams-overview/), [Spond event planning](https://www.spond.com/en-us/planning-events/), [Spond availability requests](https://www.spond.com/en-us/availability-requests/)

**Relay implication:** Keep the plan, roster, payment, and conversation attached to one session. Offer recurring groups as an accelerator, never a prerequisite. Relay does not need Spond’s guardian/team administration.

### OpenSports

OpenSports emphasizes pickup-event registration, invitations, payment coordination, and an automatic waitlist. Its waitlist documentation says players are notified when cancellations or capacity changes open a place.

**Sources:** [OpenSports waitlist](https://opensports.net/waitlist), [OpenSports group overview](https://opensports.net/blog/opensports-groups-a-complete-overview), [OpenSports event invitations](https://opensports.net/blog/the-opensports-app-makes-it-easy-to-invite-the-right-people-to-your-sports-and-fitness-events)

**Relay implication:** Capacity and waitlist promotion must remain transactional, visible, and automatic. The promoted player needs a useful notification. Do not copy OpenSports’ organization/pricing complexity into a friend session.

### Pickleheads

Pickleheads’ official Organizer Hub groups its guidance around sessions and setup, invitations and groups, formats, game day, and payments. This closely matches the real-world pickleball lifecycle in Relay’s requirements.

**Source:** [Pickleheads Organizer Hub](https://www.pickleheads.com/organizer-hub)

**Relay implication:** Relay’s strongest differentiation is not another directory. It is a calmer shared session home that carries the same game from invitation through courts, scores, and memory.

### TeamReach

TeamReach centers group communication and scheduling behind a simple group-access model. Its value is low-friction coordination rather than public discovery.

**Source:** [TeamReach](https://teamreach.com/)

**Relay implication:** Keep session chat contextual and avoid direct messages or a public feed. Shared links should explain themselves before requiring an account.

### Reclub

Reclub presents meets, clubs, competitions, and community management in one platform. Its official product language emphasizes running communities and competitions.

**Sources:** [Reclub platform](https://reclub.co/), [Reclub meets](http://reclub.co/platform/meets), [What is Reclub?](https://help.reclub.co/hc/reclub-help/articles/1765846073-what-is-reclub)

**Relay implication:** Meets validate lightweight social play, but clubs and competitions are progressive complexity Relay should continue to avoid in V1.

### PlayTime Scheduler

PlayTime Scheduler represents pickleball sessions directly on a calendar and supports list-oriented scanning. It prioritizes finding a time and seeing who is attending.

**Sources:** [PlayTime Scheduler](https://playtimescheduler.com/), [User guide](https://playtimescheduler.com/user-guide.php)

**Relay implication:** Games lists should prioritize date, venue, capacity, and RSVP status. Relay should retain its cleaner consumer interface rather than adopting a dense scheduling calendar.

### CourtReserve

CourtReserve defines events in the context of court reservations, clubs, clinics, and open play.

**Source:** [CourtReserve](https://courtreserve.com/)

**Relay implication:** External booking links and “Mark as booked” remain the correct V1 boundary. Internal reservations would dilute Relay’s friend-session focus.

## Product decisions

1. **Invite link is the acquisition surface.** Preserve the fast public session page and guest RSVP.
2. **Onboarding ends at a real share.** A new host should create a session and send the link in roughly 2 minutes; avoid a tour or setup wizard.
3. **Capacity manages itself.** Show spots, waitlist order, promotion, and notifications in plain language.
4. **Game day is the differentiator.** Court assignments, queue, scores, and standings deserve more attention than discovery or generic club features.
5. **The session owns the social layer.** Chat, photos, reactions, comments, and system events stay attached to the session.
6. **Groups are shortcuts.** They prefill people and context but never block standalone play.
7. **Payments stay coordination-only.** Make who owes what obvious; do not imitate accounting or payment-gateway products.

## Minimal improvements selected

- Strengthen first-use empty states around the real Plan → Share → Play sequence.
- Add a contextual “game ready to share” host state that disappears once another player joins.
- Add waitlist/promotion notification coverage before recommendation or discovery work.
- Keep search focused and secondary.
- Preserve external booking and avoid league/tournament expansion.
