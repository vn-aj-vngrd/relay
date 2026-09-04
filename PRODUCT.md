# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Relay serves friends organizing recreational pickleball sessions.

- **Hosts** set the plan, invite players, manage capacity and booking status, coordinate shared costs, run courts and scoring, and preserve the completed game.
- **Players** check the plan, RSVP, chat, coordinate repayment, follow court assignments, and revisit results and photos.
- **Lightweight guests** join a specific game by name from its shared link without creating an account.
- **Operators** moderate users, games, feedback, and the Philippines court directory through a separately authorized admin console.

Usage is mobile-first and often one-handed while people are messaging, traveling to the venue, paying the host, or standing courtside between rallies.

## Product Purpose

Relay is the shared home for a recreational pickleball game. A host creates the game once and sends one link; that link keeps the plan, roster, chat, shared costs, courts, scores, and memories together before, during, and after play.

Success means a new invitee can understand where and when the game happens, who is attending, whether space remains, what it costs, and whether the court is booked before signing in. During play, the group can determine who plays where and record results from a phone without moving the conversation or game state into separate tools.

## Positioning

Relay organizes one real-world game around one durable shared link and one session-scoped workspace. Unlike a generic group chat, spreadsheet, or league tool, the same game object carries structured planning, account-optional RSVP, courtside rotations and scoring, repayment status, conversation, and the completed story. Relay does not reserve courts, process money, operate a league, or expose a public social feed.

## Operating Context

A typical game moves through four connected moments:

1. **Plan and invite:** the host moves through a short Plan → Players and access → optional Details → read-only Review flow, sets the schedule, court, roster, and visibility, optionally records booking details, then publishes one shared game link. Payment starts unset and is added afterward.
2. **Confirm and coordinate:** players or named guests RSVP; capacity and waitlist state remain authoritative; the group checks changes, chats, and coordinates external court booking and repayment.
3. **Play courtside:** the host marks attendance, chooses a supported play format, creates court assignments, records scores, advances the queue, and monitors standings and timers from a phone.
4. **Remember and repeat:** the completed game retains results, standings, chat, photos, and shareable recap imagery; a host can reuse the game structure for another date.

The public shared surface and authenticated workspace expose the same session facts. Authentication adds identity continuity and role-appropriate controls rather than changing the underlying plan.

## Capabilities and Constraints

- Password authentication is the baseline; configured Google or magic-link authentication is optional. Public game links and named guest RSVP do not require an account.
- A session owns its historical roster, courts, queue, pairings, matches, score events, expenses, chat, and memories. RSVP state and courtside attendance are distinct.
- Unanswered account invitations stay visible in Home, a counted Games destination, and the Games **Invites** filter. Players can respond inline; accepted, approval-pending, maybe, and waitlisted games then move into Upcoming, while related invite notifications are cleared.
- Going responses respect capacity and ordered waitlists transactionally. Guest identity is scoped and token-bound to one session.
- Supported play formats include Paddle Stack with mixed or fixed partners, Mix It Up, Balanced Mix, Court Climb, and Team Round Robin.
- Relay coordinates payment methods, player shares, receipts, proof, and host confirmation. Money moves through external methods such as GCash, Maya, bank transfer, or cash; Relay never processes the transaction.
- Relay stores court and booking context and links to external directions or booking. It does not reserve courts. Court Finder accepts reviewed listings and evidence-backed creation or correction requests throughout the Philippines; its initial verified inventory remains strongest in Cebu. Restricted facilities stay discoverable when their access and reservation rules are explicit.
- Session collaboration uses one Broadcast invalidation topic per mounted session and refetches authoritative server state after changes or reconnects. Score and queue mutations preserve explicit concurrency controls.
- The installable web app provides an offline fallback and network-state feedback. It intentionally does not cache authenticated pages, API responses, game data, payment media, chat media, or map tiles for offline use.
- Anyone may browse public, unended sessions that disclose Free or an estimated per-player cost. Signed-out visitors open the shared game and authenticate when they want account identity or history. Link-only sessions remain accessible only by shared link and private sessions only to hosts and invited participants.
- Authorization is enforced at server boundaries for host, participant, guest, and admin capabilities. Link visibility, route rendering, and identifier secrecy are not treated as authorization.
- The responsive web interface supports light and dark themes. Product language uses **game** in the interface while the durable domain model uses **session**.

## Brand Commitments

The product name is **Relay**. Its durable promise is “pickleball plans in one link.” Voice is conversational, direct, and grounded: a capable friend running the night rather than a sports broadcaster or enterprise administrator. The product stays spirited around live play and quiet when the plan is settled; recreational participation matters more than performative statistics.

Existing identity assets include the Relay ball mark and PWA icons in `public/relay-ball.svg`, `public/relay-ball-32.png`, `public/apple-touch-icon.png`, and `public/pwa-*.png`. The approved photographic asset is `public/images/pickleball-friends.jpg`.

## Evidence on Hand

- `docs/product-blueprint.md` records the reviewed workflows, domain language, authorization matrix, and product boundaries.
- `src/features/`, `src/app/`, and `src/db/schema/index.ts` contain database-backed implementations for authentication, game creation and management, public RSVP, roster and waitlist handling, groups, Philippines courts, chat, payments, live play, notifications, memories, search, profiles, feedback, and administration.
- `drizzle/0000` through `drizzle/0026` document the deployed data, authorization, realtime, reminder, court-directory, abuse-control, performance, and public-discovery migrations.
- Vitest and Playwright suites cover domain behavior, component interactions, accessibility, responsive browser workflows, and public/protected route safety.
- `DESIGN.md`, `docs/UI_QUALITY.md`, and `docs/SESSION_SURFACE_PARITY.md` are the implementation authorities for visual quality and shared/authenticated session parity.
- No repository evidence currently supports claims about customer counts, testimonials, revenue, pricing, market leadership, partnerships, or measured engagement. Future product work must not fabricate those claims.

## Product Principles

1. **The game is home.** Planning, participation, play, payment coordination, conversation, and memories return to one understandable game.
2. **The link carries the plan.** A shared link provides complete context and a lightweight path to RSVP before authentication.
3. **Reveal responsibility progressively.** Common participant actions remain immediate; host, scorer, and administrative controls appear only when the role and game state require them.
4. **Courtside beats comprehensive.** Live controls prioritize glanceability, reliable touch interaction, deterministic state, and quick recovery over exhaustive configuration.
5. **The game becomes the memory.** Results, people, photos, and reactions accumulate around the event rather than becoming a generic content feed.
6. **Useful before signup.** One public product shell lets any visitor find a court, explore open games, run device-local Quick Play, and complete a local game draft before creating an account.
7. **Ask at the value boundary.** Authentication begins when a visitor wants to publish, share, save, or collaborate. Court selection, draft values, Quick Play state, and intended destination survive that transition.
8. **Public means informed.** A discoverable game states its court, roster limit, admission behavior, and cost expectation before a new player joins.

## Accessibility & Inclusion

Target WCAG 2.2 AA with semantic structure, keyboard operation, visible focus, 44px minimum touch targets, screen-reader-friendly score controls, non-color status cues, sufficient contrast, reduced-motion support, and clear offline or reconnecting feedback. Public links and guest RSVP must remain usable without an account. Experience and balancing inputs are self-described rather than presented as authoritative player ratings.
