# Relay market and product audit

Research date: 2026-08-19

## Executive decision

Relay should not try to beat Pickleheads, Swish, Spond, or OpenSports feature-for-feature. Those products are strongest when an organizer is running a club, league, paid program, or large recurring event. Relay’s best market is smaller and more personal:

> **The shared game link that runs a pickleball night with friends—from “who’s in?” to the recap.**

The initial ideal customer is the person already doing unpaid coordination in a Messenger, WhatsApp, or iMessage thread: 6–16 friends, one to four courts, a venue booked elsewhere, and a cost repaid through GCash, Maya, bank transfer, or cash.

Relay already has a credible product wedge:

1. A friend can understand and join from the shared link without installing an app or creating an account.
2. The same session carries the roster, waitlist, plan, courts, scores, chat, repayment, photos, and recap.
3. Payment is framed correctly for friend games: the host paid first and collects shares; Relay does not pretend to be a payment processor.
4. Play is recreational and flexible rather than tied to a rating, league, or tournament.
5. The completed game turns into a shareable social memory instead of disappearing into event history.

The main risk is not a missing feature count. It is whether Relay makes the organizer’s first successful night materially easier than the group chat they already use. Product work should therefore optimize the full host loop: **publish → share → get four responses → start a match → finish the night → play again**.

## V1 response to this audit

Implemented immediately after the audit:

- Vercel Web Analytics for privacy-conscious page and invite-view measurement, plus a first-party allowlisted lifecycle event table and 30-day admin funnel.
- Structured, privacy-safe server error logging through Next.js instrumentation.
- Supabase Cron reminders for tomorrow and roughly one hour before play, with idempotent retry keys.
- Progressive **Who’s here** check-in for account players, guests, and host overrides.
- Optional persisted shared round timers for round-based play.
- Exact full-game waitlist language before RSVP.
- Session-specific 1200×630 Open Graph images, canonical metadata, Twitter cards, Event JSON-LD, and `noindex` protection for link-only games.
- Guest-to-account claim and redirect into the authenticated version of the same game.
- Public Privacy and Terms pages, installable web-app metadata, a launch plan, and a reusable messaging kit.

Lightweight recurrence, recent venue reuse, groups, Play Again, realtime scoring/chat, repayment, and session recaps were already present and remain the deliberate alternative to league or club automation.

## Competitive benchmark

### Pickleheads

Pickleheads is the closest direct competitor. Its official product material includes automatic invitations, weekly sessions, waitlists, groups, chat, player skill information, many round-robin formats, court assignments, score entry, and live standings. It also supports players joining a session link without an account. Its game-day guidance covers check-in, no-shows, late arrivals, injuries, hand-edited matchups, and score corrections.

Sources:

- [Pickleheads groups and organizer capabilities](https://www.pickleheads.com/groups)
- [Pickleheads weekly sessions](https://www.pickleheads.com/guides/how-to-set-up-weekly-sessions)
- [Pickleheads check-in mode](https://www.pickleheads.com/guides/check-in-mode)
- [Pickleheads game-day guide](https://www.pickleheads.com/guides/game-day-guide-rotate-partner)

**Relay implication:** format count, venue discovery, ratings, and club automation are poor battlegrounds. Relay should be faster and calmer for a private friend game, materially better at local repayment coordination, and more memorable after play.

### Swish

Swish offers game creation, centralized schedules, automatic court assignments, flexible rosters, seeding/randomization, manual matchup edits, groups, leagues, tournaments, and DUPR integration. Its recreational product still leads into club and competition workflows.

Source: [Swish recreational play](https://swishsportsapp.com/recreational-play/)

**Relay implication:** keep manual overrides and fair play strong, but do not follow Swish into leagues, club administration, or DUPR workflows. Relay’s lighter link-first product should feel useful before a whole community adopts it.

### OpenSports

OpenSports’ automatic waitlist gives players a visible position, offers an open spot for a bounded period, and sends push/email notifications before moving to the next person.

Source: [OpenSports automatic waitlist](https://opensports.net/waitlist)

**Relay implication:** automatic promotion is only trustworthy when the promoted person notices it and can act. Relay’s waitlist domain logic is good, but reminders and delivery are a market-readiness gap.

### Spond

Spond combines event details, attendance, group communication, reminders, and payment collection in one event workflow.

Sources:

- [Spond event planning](https://www.spond.com/en-us/planning-events/)
- [Spond team features](https://www.spond.com/en-us/features-for-teams-overview/)

**Relay implication:** session-first information architecture is validated. Relay should preserve its pickleball-specific game-day and recap depth instead of becoming a generic team organizer.

### DUPR and CourtReserve

DUPR’s product centers ratings, validated results, clubs, and competitive events. CourtReserve centers facilities, reservations, memberships, and programming.

Sources:

- [DUPR](https://www.dupr.com/)
- [CourtReserve](https://courtreserve.com/)

**Relay implication:** “friendly games, not rankings” and external booking are correct boundaries, not missing functionality.

## Current Relay audit

The audit combined production browser review at 390px and desktop, the public invite flow, the account entry flow, route and domain inspection, and the existing end-to-end suite.

### What is already marketable

| Area                | Assessment     | Evidence                                                                                                                                             |
| ------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Positioning         | Strong         | Landing page clearly rejects ratings and leagues and presents one session as the product.                                                            |
| Public invitation   | Strong         | Public session shows plan, venue, roster, booking, tabs, guest RSVP, account RSVP, and sharing without authentication.                               |
| Game-day depth      | Strong for V1  | Five recreational play modes, multi-court scoring, optimistic writes, standings, queue, fixed pairs, and realtime invalidation are implemented.      |
| Repayment           | Differentiated | Host-paid-first model, per-player shares, one proof image, and host confirmation fit Philippine friend groups better than a generic Stripe checkout. |
| Memory loop         | Differentiated | Recap scenes, personal and group statistics, photos, reactions, native sharing, and Play Again create a credible post-game hook.                     |
| Surface consistency | Good           | Authenticated and shared games use the same Overview, Players, Play, Chat, Payments, and Recap model.                                                |
| Accessibility       | Good baseline  | Existing Playwright/Axe coverage checks public entry and core host/guest flows with no serious violations.                                           |

### Gaps that matter before broad marketing

#### P0 — Product instrumentation

**Resolved in this V1 pass.** At audit time, there was no product analytics or error-monitoring dependency. Relay now uses aggregate Vercel Web Analytics for routes and invite views, structured server error logs, and first-party lifecycle events for `session_published`, `invite_shared`, `rsvp_saved`, `play_started`, `first_match_completed`, `session_completed`, `recap_shared`, `play_again_published`, and `group_saved`. The admin console shows a 30-day product-loop summary.

Names, chat, payment details, addresses, and scores never enter lifecycle metadata.

#### P0 — Notification delivery

**Resolved for the V1 in-app channel.** Supabase Cron now creates idempotent account notifications for tomorrow and roughly one hour before play every 15 minutes. Action-driven invitations, waitlist promotion, venue, payment, and court notifications remain realtime. Push and email stay intentionally deferred until those delivery channels are configured and supportable.

#### P1 — Arrival state

**Resolved with progressive check-in.** Before Play, players mark themselves here and hosts can override the crew. With no check-ins, all going players remain eligible; after the first check-in, only players marked here enter the first rotation. Late arrivals join the waiting queue and unavailable players keep their RSVP and history.

#### P1 — Timed rounds

**Resolved with an optional shared timer.** Round-based modes offer one shared countdown derived from persisted match start time. It survives refresh, appears above active courts, and announces that players should finish the rally without automatically inventing a result.

#### P1 — Public-link semantics

**Resolved.** Full sessions now say **Join waitlist** in the prominent action, RSVP heading, submit action, metadata, and Open Graph preview before any mutation occurs.

#### P1 — Shared-link previews

**Resolved with generated session cards and structured metadata.** Every shared session now has a legible 1200×630 card with title, date, venue, availability, and Relay identity, plus canonical metadata, Twitter cards, and SportsEvent JSON-LD. Link-only sessions keep rich previews while remaining `noindex`.

Next.js explicitly supports generated `opengraph-image` routes for social and messaging previews: [Next.js Open Graph image convention](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image).

#### P2 — Recurrence should stay lightweight

Pickleheads already has sophisticated recurring schedules and automatic invite lists. Relay should first make **Play Again** exceptionally fast and automatically suggest the last crew. Only add “repeat weekly” after users repeatedly clone games; do not build a series-management product preemptively.

#### P2 — Venue discovery is not a defensible early acquisition channel

Pickleheads and booking products have established venue datasets. Relay’s venue autocomplete and external booking boundary are enough for the core loop. Invest in location accuracy and saved recent venues, not a broad directory.

## Positioning that can win

### Category

**A shared home for a pickleball night with friends.**

Avoid “pickleball management platform,” “club software,” “social network,” and “score tracker.” They put Relay in larger, less favorable categories.

### Promise

**Share one link. Everyone knows the plan, who is playing, what they owe, where they are next, and how the night went.**

### Contrast

- Group chat creates interest; Relay creates a playable night.
- Booking apps reserve the court; Relay handles everything around it.
- Rating apps record competitive results; Relay keeps friend games moving.

### Landing-page message hierarchy

1. **From group chat to game night—one shared link.**
2. Friends RSVP without an account.
3. The host runs every court and fair rotation from one phone.
4. Everyone sees their share and payment status.
5. The completed night becomes a recap worth sharing.

The product UI should remain the evidence. Avoid generic testimonials, invented usage numbers, or feature-card inflation before real customer proof exists.

## Growth loops

### 1. Invite loop — primary acquisition

Host publishes → shares in Messenger/WhatsApp → friend opens a rich preview → understands the game → RSVPs as guest → sees Relay work during the session → creates an account to keep history.

Optimize invite-view-to-RSVP conversion before paid acquisition.

### 2. Recap loop — emotional acquisition

Session ends → participant selects a personal or group recap → adds a real photo → shares to Stories or chat → viewers see Relay attribution → next organizer starts a session.

Keep attribution tasteful and never cover the user’s photo or result.

### 3. Crew loop — retention

Session ends → host taps Play Again or Save this crew → venue, duration, capacity, courts, and invitees are reused → a new date publishes in under a minute.

### 4. Organizer utility loop — future SEO acquisition

A free no-account **fair teams / paddle stack generator** can solve an immediate search problem, then offer “save this as a Relay game.” Build this only after the authenticated game-day loop is reliable; it should reuse the same rotation domain rather than become a separate toy.

## Go-to-market plan

### Beachhead

Start in Metro Manila with friend-group organizers, venue community chats, and casual open-play hosts who already collect with GCash/Maya. The product is localized to their actual flow without requiring venue or club adoption.

### Launch motion

1. Recruit 10–20 organizers who run at least two games per month.
2. Concierge-onboard their next real session; do not ask for a hypothetical product review.
3. Observe creation, sharing, arrivals, first match, repayment, and recap.
4. Contact the host the next day with three questions: what still happened in chat, where did play pause, and would they use Play Again?
5. Ship fixes weekly and publish only real workflows and real recap examples.

### Channels

- Direct outreach in local pickleball Facebook and Messenger groups, with moderator permission.
- Venue partnerships via a simple “organize your group after booking” link or QR; no booking integration required.
- Shareable recap attribution.
- Useful organizer guides around fair rotations, collecting court shares, late arrivals, and running two courts.
- Referral prompt after a host completes a second successful session—not during onboarding.

Paid ads should wait until invite conversion and second-session retention are known.

## Metrics

Use a **successful session** as the north-star event: a published session with at least four going players and one completed match.

| Funnel      | Metric                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------- |
| Activation  | Median time from signup to published session; percent shared; percent reaching four going players |
| Invitation  | Unique public invite views → RSVP; guest → account after participating                            |
| Game day    | Sessions with Play started; time to first match; matches completed per active session             |
| Reliability | Mutation failure rate; realtime reconnect rate; unresolved score conflicts; upload failures       |
| Retention   | Hosts creating another session within 14 and 30 days; Play Again usage; crew saved as group       |
| Growth      | Invite viewers per host; recap shares; signups attributable to invite and recap links             |
| Repayment   | Collections created; proof submitted; shares confirmed before/after session                       |

Do not use raw account count, page views, or total messages as success metrics.

## Prioritized roadmap

### Now — market-ready loop

1. Add privacy-conscious lifecycle analytics and error monitoring.
2. Generate session-specific Open Graph previews.
3. Make full-session and waitlist language exact everywhere.
4. Verify reminder and waitlist-promotion delivery end to end.
5. Run five real sessions and fix every point where coordination returns to chat.

### Next — own game day

1. Here now / unavailable arrival state with host override.
2. Optional shared round timer.
3. Faster late-player and injury handling between rounds.
4. Explicit score correction history and conflict feedback.

### Then — compound retention

1. Play Again in under one minute with recent venue and crew suggestions.
2. Gentle recurring-session offer only after repeated clones.
3. Recap attribution and conversion measurement.
4. Free fair-teams / paddle-stack utility as an acquisition surface.

## Product guardrails

- Keep guest RSVP, core Play, and basic recap free of player paywalls.
- Keep the session—not clubs or feeds—as the primary object.
- Let the host override every algorithmic court decision.
- Never turn recreational standings into a rating claim.
- Do not process money until payment compliance and support are a deliberate business decision.
- Do not add tournaments, leagues, broad venue discovery, or DUPR integration to manufacture parity.
- Prefer one reliable reminder channel over three unreliable channels.

## Bottom line

Relay is already more than a CRUD session planner. It has a coherent friend-game product and two credible differentiators: locally appropriate repayment coordination and a social recap attached to real play. The fastest path to a marketable product is not more breadth. It is making the invite link excellent, making game day impossible to derail, measuring the whole lifecycle, and making the second game much easier than the first.
