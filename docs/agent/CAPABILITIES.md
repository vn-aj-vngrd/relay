# Agent capabilities

Read before adding or changing Agent tools, creation, discovery, confirmation, or admin controls. This is the scope and extension contract. Read `README.md` for existing transport/security context and `../HELP_CENTER_MAINTENANCE.md` for mandatory user documentation updates.

## Implementation process

1. Identify the existing product command, actor permissions, side effects, quota, and recovery behavior. Complete when the normal form and Agent can share the same business implementation.
2. Add preparation and a reviewed preview before exposing execution. Bind confirmation to a server-owned, expiring immutable proposal; a replacement cancels the old proposal. Complete when retry returns the existing result and stale/foreign proposals cannot execute.
3. Keep discovery, enabled tools, admin flags, and Help Center aligned. Complete when every available menu item starts a supported task and every implemented behavior has current user guidance.
4. Maintain authorization, duplicate-confirmation, recovery, and form-parity regressions. Execute validation at the timing required by AGENTS.md. Complete when the handoff distinguishes code, migration, tests, browser exercise, and deployed availability.

## First release: implemented scope

- Hosted game creation, including draft intent, completed-game replay, and group games.
- Group creation and saving a completed hosted game’s linked Going crew as a group, only when the source has no existing group.
- Local Quick Play setup with named players, courts, and supported mode. It opens browser-local Play; it is not an account game.
- Court lookup, group/source selection, conversational corrections, cancellation, preview restoration, and authoritative result links.
- Separately default-off game/Quick Play and group creation flags. Normal permissions, hosting quotas, and strict-by-default privacy routing remain enforced.

Discovery shares one enabled-capability catalog between the composer + button and the `/` autocomplete. Both entry points open the same menu; creation selection sends a conversational setup prompt and Explore selection inserts a prompt without sending; arrow keys, Enter, Escape, and touch work while retaining the draft. The menu groups enabled tasks under Create and Explore, hides empty sections, uses single-line icon, title, and description rows, and links to `/help/agent-capabilities`. User guidance is authored in the shared Help Center catalog read by Agent's help tools. Future scope below stays out of the available-action menu.

## Game and group exploration

When game answers are enabled, `searchGames` supports upcoming, current, past,
all-time and draft searches, with status, date, venue, group, role and RSVP filters.
My Games and Invitations reuse the game-library predicates; invitation history
is distinct from unanswered invitations. Cancelled games require explicit inclusion.
Open games retain public-discovery eligibility even for all-time requests. Group
summaries require current membership; group drafts additionally require ownership.

`myGroups` reuses group-list name/role filters. `groupDetails` resolves an exact
slug or UUID and returns the description and paginated member names/roles only
after membership authorization. Group membership does not grant private game access.

`gameDetails` returns the authorized overview, RSVP, permitted roster, attendance,
play settings, booking state and existing post-game continuation links. Booking
references, totals and notes are organizer-only. `gameSection` reads Play, Recap,
payments, chat or Story captions using the existing workspace/permission boundary.
Play and Recap reuse the UI query and calculation functions. Payment rows are
organizer-wide or viewer-only as on Payments; expense collection summaries retain
archived state. No financial credentials, proof/media URLs, raw profiles, tokens,
or browser-local Quick Play data are returned. Story reads captions, not image
contents. Reads do not authorize mutations.

Lists are bounded and report truncation and continuation. A read-budget or paging
limit means partial results, never absence of history. Past includes ended games;
only status completed proves completion. Existing assistant claims that history is
unavailable must not override the current tools. The Explore menu and Help Center
share these capabilities. A01 regression coverage includes lifecycle queries,
collection boundaries, group membership, section authorization and safe projections;
live-provider and authenticated browser execution remain separate evidence.

## Conversational creation

Creation uses normal chat. Ask one missing question per reply, reuse supplied details, and fetch creationStatus before continuing so saved answers survive reloads and corrections. A passive setup card below the conversation shows the number of collected details; Agent asks for the next missing detail in its reply. The count is not validation or approval. Selecting a Create action starts this conversation. Restored setups offer Continue in chat and Cancel.

Setup is an owner-scoped proposal with a server-owned `preview.collecting` marker and cannot execute. Once details pass domain validation, preparation creates an immutable review proposal. Corrections replace the old proposal and require fresh approval. Final approval uses the existing ID-only confirmation endpoint; typed yes never authorizes execution. Legacy stored interaction modes normalize to chat.

When considering structured question controls in a future release, read [Deferred guided creation](GUIDED_CREATION_FUTURE.md). That proposal is not current product behavior or authorization to implement it.

## Confirmation and recovery contract

The model prepares; the user confirms through the first-party endpoint. Neither typed yes nor replayed assistant text grants execution authority. Previews disclose exact date/time, visibility, payment intent, invite/member audience, and draft/publication effects. A conversational edit creates a new preview rather than modifying an approved payload.

`agent_creation_proposals` owns status, payload, expiry, and result. Game/group command hooks lock and validate the proposal inside the creation transaction and store its result in that transaction. Confirmation rechecks current settings, ownership, eligibility, and audience. A completed result remains recoverable after a response or analytics failure. Stop generation is separate from cancelling a pending proposal. Quick Play replacement requires explicit device-local confirmation.

Answer text streams alongside server-authored activity summaries for the Agent UI; legacy text-only clients remain supported. Activity summarizes tool calls without exposing arguments, results or reasoning. Completed and interrupted summaries are saved with the reply. Safe creation cards are hydrated separately by conversation and original user-message ID. Provider tool payloads and arbitrary model-generated UI are not persisted as authorization. New capabilities should extend this small boundary rather than introduce a second workflow engine.

## Second phase: proposed, not implemented

| Function | Existing reference | Required preview and constraints |
| --- | --- | --- |
| Update or reschedule game | sessions/actions.ts: updateSessionAction | Changed fields, exact timezone, lifecycle and role checks, affected participants |
| Publish existing draft | Existing draft publication journey | Complete setup, visibility, invitations; preserve original game identity |
| Add/approve/remove players | sessions/actions.ts roster actions | Exact person, RSVP/capacity consequences, current actor authority |
| Set own RSVP | rsvpAction | Game and response; retain approval/waitlist and concurrency rules |
| Set attendance/play availability | Attendance and availability actions | Exact player/scope, active-match consequences, existing permissions |
| Lock/unlock roster | toggleRosterLockAction | Game and resulting join behavior |
| Update group | groups/actions.ts: updateGroupAction | Owner-only changed name/description; images use normal upload flow |
| Add group member | addGroupMemberAction | Exact username and group; owner permission and duplicate membership |
| Add/change organizer | sessions/organizer-actions.ts | Exact person and authority change; participation remains separate |
| Record court booking | sessions/court-booking-actions.ts | Booking already made, reference and amount; no external reservation |
| Configure/start Play | live-settings-actions.ts, matches/actions.ts | Eligible roster, booking state, courts, mode, start consequences |
| Create a match | matches/actions.ts: createQueueMatch | Teams, court and queue consequences under existing session lock |

## Later scope: proposed, not implemented

| Function | Initial direction | Gate before exposing it |
| --- | --- | --- |
| Payment setup/expenses | Guide to existing Payments | Financial preview, host authority, consent/share rules, no claim of money transfer |
| Payment confirmation/adjustment | Keep current manual workflow | Separate financial design and audit review |
| Invitations/sharing | Open existing share UI | Explicit audience and channel; external sending needs explicit consent |
| Court suggestions/feedback | Prepare and open existing forms | Review submission and existing abuse controls |
| Live scoring, queue control, match correction | Keep courtside controls | Latency, stale-state and active-match safety evaluation |
| Delete/cancel resources | Keep current product controls | Exact destructive effects, current roles, confirmation/recovery policy |
| Scheduled follow-ups/reminders | Separate scheduling project | Explicit time, recipients, delivery channel, cancellation, reauthorization at execution |
| Account, subscription, admin mutations | Excluded from current Agent | Separate privileged-access design and product authorization |
| Quick Play advanced setup | Reuse full setup controls | Fixed pairs, skill inputs, durations and saved-local-state migration |

The dated research plan in `../research/agent-interactive-creation-plan-2026-09.md` records the original rationale. This capability contract is authoritative for current scope; implementation source is authoritative for exact schemas and limits.
