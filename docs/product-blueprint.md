# Relay V1 product blueprint

## 1. Concise requirements

Relay coordinates everything around a recreational pickleball session; it does not reserve courts or move money. V1 must let a host publish a session quickly, let friends understand and RSVP from a public link, coordinate roster and shared expenses, run courts and scores in a live view, then preserve the completed session and clone its structure for another date.

**V1 quality gates:** mobile-first, public-link-first, server-authorized mutations, explicit domain rules, minimal client JavaScript, accessible controls, useful edge states, and selective realtime for live courts, queue, scoring, and chat.

## 2. Primary user flows

### Create → share → join
1. Authenticated host selects **Create game**.
2. Enters the seven required fields; sensible defaults are prefilled.
3. Optionally expands booking, cost, court, group, notes, and visibility.
4. Publishes and lands on the session overview with a share link.
5. Invitee opens `/s/[slug]`, sees the complete plan without signing in, and chooses Going, Maybe, or Can't make it.
6. An unauthenticated invitee supplies only a display name; Relay stores a scoped guest identity.
7. Going RSVPs fill capacity; later Going responses become ordered waitlist entries.

### Book externally → coordinate payment
1. Host follows the venue's external booking link.
2. Returns and marks the session booked with optional courts, reference, screenshot, total, and notes.
3. Relay divides included expenses among included players, preserving explicit overrides.
4. Player marks payment sent; host confirms it.

### Arrive → play live
1. Host starts Live Mode.
2. Available players enter a deterministic queue; host picks manual, queue, random, winner-stays, or king-of-court rotation.
3. Active court cards show teams and large scores. Score controls use optimistic version checks.
4. Completing a match records the result, updates standings, and advances the queue according to the selected rule.
5. Realtime subscriptions cover only court, match, queue, score, and chat changes.

### Complete → remember → play again
1. Host ends the session after confirming active matches.
2. The same URL transitions to a memory view with results, standings, and media.
3. Players add photos, captions, comments, and reactions.
4. **Play again** clones venue, group, duration, capacity, court count, and suggested invitees, then asks for a new date.

## 3. Route map

```text
/                         authenticated home (redirect to /login if required)
/login                    email + Google auth
/games                    upcoming and past sessions
/games/new                fast create flow
/games/[id]               private session workspace
/games/[id]/players       roster and waitlist
/games/[id]/payments      expenses and payment status
/games/[id]/live          courts-first Live Mode
/games/[id]/chat          contextual session chat
/games/[id]/more          booking, settings, danger actions
/s/[slug]                 fast public invite / completed memory
/venues                   venue search
/venues/[slug]            venue details + external booking
/groups                   user's recurring groups
/groups/[slug]            group home
/profile/[username]       participation-oriented profile
/notifications            in-app notifications
/search                   debounced global search with local recent searches
/api/search               authenticated, paginated global search boundary
/api/webhooks/*            future external boundaries only
```

## 4. Information architecture

- **Global mobile navigation:** Home, Games, Create, Groups, Profile.
- **Session workspace:** Overview, Players, Courts, Chat, More; Courts is selected during Live Mode.
- **Public session:** identity and status → time/place → RSVP → roster → cost/booking → notes.
- **Home:** next game → applicable action items → upcoming games → recent games. No generic analytics.
- **Search:** recent searches when idle → debounced typeahead → Games, Players, Groups, and Venues filters → incremental results. Link-only/private content remains authorization-scoped.
- **Completed session:** memory summary → media → matches and standings → conversation → Play again.

## 5. Domain model

- A **User** is an authenticated identity; a **Profile** is public participation identity.
- A **Guest** is a session-scoped identity represented directly by `session_players` with no `user_id`.
- A **Session** owns roster, courts, queue, expenses, matches, chat, and memories. Lifecycle: draft → published → live → completed/cancelled.
- A **SessionPlayer** is a historical participation record, not merely group membership. RSVP and play state are separate.
- A **Court** belongs to a session; a **Match** references a court but preserves court label and players historically.
- A **MatchPlayer** records team and side, supporting singles or doubles without changing match shape.
- **MatchScore** is an append-only score event when live scoring is used; the match also stores current/final score and a lock version.
- **SessionQueue** is an ordered, unique set of eligible session players with play state.
- **Expense** and **PlayerPayment** coordinate obligations; no payment transaction is processed.
- **Memory** is the completed session's content container; media, comments, and reactions attach to it.

Deletion policy: use restrictive foreign keys for historical participation and soft lifecycle status for sessions/matches. User deletion anonymizes retained participation. Ephemeral invitations and notifications may cascade. Completed session facts remain immutable except audited host corrections.

Concurrency: score, queue, and match transitions carry integer versions and update with compare-and-swap. Realtime broadcasts committed state; reconnect always refetches the authoritative snapshot.

## 6. Database proposal

Schema lives in `src/db/schema/index.ts`. Important constraints include unique session slugs, unique `(session_id, user_id)` authenticated roster membership, one queue row per session player, unique queue positions per session, nonnegative capacity/costs/scores, ordered waitlists, and version columns for concurrent live writes. Storage objects are referenced by paths rather than public URLs.

Supabase RLS should mirror application authorization for defense in depth. Drizzle remains the typed application query layer; privileged server actions use a server-only client after explicit authorization.

## 7. Authorization matrix

| Capability | Host | Group admin/co-host | Player | Guest | Public |
|---|---:|---:|---:|---:|---:|
| View public session | Yes | Yes | Yes | Yes | If visibility permits |
| Edit session / booking | Yes | If assigned | No | No | No |
| Manage capacity/roster | Yes | If assigned | No | No | No |
| Update own RSVP | Yes | Yes | Yes | Own invite identity | No |
| Manage courts/queue/matches | Yes | If assigned | No | No | No |
| Update live score | Yes | If assigned scorer | If assigned scorer | No | No |
| Mark own payment sent | Yes | Yes | Yes | If claim token valid | No |
| Confirm/override payment | Yes | If assigned | No | No | No |
| Chat/react/upload memories | Yes | Yes | Participant | Participant guest | No |
| Complete/cancel/delete | Yes | No by default | No | No | No |

Every mutation authenticates or validates a scoped guest token, loads the target session, checks role and lifecycle, validates with Zod, and performs the write transactionally.

## 8. Component architecture

- Server Components render shells, invite content, home lists, venue/group/profile pages, and initial session snapshots.
- Small Client Components own RSVP selection, share, create-form progressive disclosure, score controls, queue reorder, chat composer, and realtime reconciliation.
- Feature folders hold domain rules, schemas, server actions, queries, and UI. Shared components are limited to stable primitives (button, avatar, status, field, app navigation).
- No global client store in V1. Live Mode uses a route-scoped reducer fed by an initial server snapshot and narrow Supabase channels.

## 9. Design system and tokens

**Scene:** friends under bright court lights, checking one phone between rallies; clean white court lines, dark fence, mineral-green equipment, and coral tape markers.

**Strategy:** restrained. White and near-neutral surfaces carry information; mineral teal marks primary actions/live selection, while coral appears only for urgent or socially warm moments.

- Canvas `oklch(1 0 0)`; raised surface `oklch(.975 .004 170)`; ink `oklch(.19 .018 185)`.
- Primary mineral teal `oklch(.48 .105 170)` with white text; pale selected surface `oklch(.94 .035 170)`.
- Accent coral `oklch(.68 .15 35)`; semantic red, amber, and green remain distinct.
- One contemporary UI family (Geist Sans) and Geist Mono/tabular numerals for score/data moments.
- 4px base spacing; radii 8/12/16px; 44px minimum controls; shadows reserved for floating sheets/navigation.
- Signature: thin court-line dividers and scoreboard-like tabular scores encode the sport without decorative pickleball art.

## 10. Implementation milestones

1. **Foundation:** Next.js, strict TS, Tailwind, tokens, accessible shell/nav, Drizzle schema, environment validation, auth boundaries.
2. **Session core:** create, public invite, session overview, RSVP/waitlist rules, roster permissions, Open Graph metadata.
3. **Venue + booking:** search/detail, external link, mark-as-booked evidence.
4. **Payments:** expenses, splits, statuses, host confirmation.
5. **Live play:** courts, queue, rotations, matches, scoring, standings, realtime/reconnect.
6. **Groups + social:** groups, chat/system events, notifications.
7. **Memory + retention:** media, reactions/comments, profile/history, Play again.
8. **Production pass:** RLS policies, observability, migrations, browser E2E, a11y/performance/offline hardening.

## Resolved ambiguities

- A guest identity is session-scoped and token-bound, not a global anonymous account.
- Co-host powers are explicit per session; group admins do not automatically control all group sessions.
- Waitlist promotion is transactional and ordered; promotion may notify rather than auto-charge or auto-confirm attendance.
- Expense splits use currently included payers when recalculated; confirmed amounts never change silently.
- Winner-stays and king-of-court rules are session configuration with visible plain-language summaries.
- A host cannot leave until ownership transfers or the session is cancelled.
