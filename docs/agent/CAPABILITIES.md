# Agent capabilities

Read before adding or changing Agent tools, creation, discovery, confirmation, or admin controls. This is the scope and extension contract. Read `README.md` for existing transport/security context and `../HELP_CENTER_MAINTENANCE.md` for mandatory user documentation updates.

## Implementation process

1. Identify the existing product command, actor permissions, side effects, quota, and recovery behavior. Complete when the normal form and Agent can share the same business implementation.
2. Add preparation and a reviewed preview before exposing execution. Bind confirmation to a server-owned, expiring immutable proposal; a replacement cancels the old proposal. Complete when retry returns the existing result and stale/foreign proposals cannot execute.
3. Keep discovery, enabled tools, admin flags, and Help Center aligned. Complete when every available menu item starts a supported task and every implemented behavior has current user guidance.
4. Maintain authorization, duplicate-confirmation, recovery, and form-parity regressions. Execute validation at the timing required by AGENTS.md. Complete when the handoff distinguishes code, migration, tests, browser exercise, and deployed availability.

## First release: implemented scope

- Hosted game creation, including draft intent, completed-game replay, and group games.
- Group creation and saving an eligible hosted game's linked Going crew as a group.
- Local Quick Play setup with named players, courts, and supported mode. It opens browser-local Play; it is not an account game.
- Court lookup, group/source selection, conversational corrections, cancellation, preview restoration, and authoritative result links.
- Separately default-off game/Quick Play and group creation flags. Normal permissions, hosting quotas, and strict-by-default privacy routing remain enforced.

Discovery shares one enabled-capability catalog between the composer + button and the `/` autocomplete. Both entry points open the same menu; creation selection opens a guided form directly and Explore selection inserts a prompt without sending; arrow keys, Enter, Escape, and touch work while retaining the draft. The menu groups enabled tasks under Create and Explore, hides empty sections, uses single-line icon, title, and description rows, and links to `/help/agent-capabilities`. User guidance is authored in the shared Help Center catalog read by Agent's help tools. Future scope below stays out of the available-action menu.

## Guided creation

Use the existing named controls from Create Game and Quick Play. Game/draft: court and schedule, players/settings, review. Replay/group game/crew: select an eligible source first. Group: name/description, review. Quick Play: names, courts/format, review. Chat preparation opens a form with known fields immediately instead of asking numbered questions. Only the ambiguous hosted-game versus local-Quick-Play intent needs conversational clarification.

Setup is an owner-scoped proposal with a server-owned `preview.collecting` marker; its public status is collecting and it cannot execute. Next and Save and close persist setup, not product resources. Outside clicks leave the modal and answers intact. Desktop uses the composer width and mobile uses a keyboard-aware bottom sheet. Review validates through the existing domain rules and creates a new immutable proposal ID. Editing a review cancels the old ID before accepting more changes. A stable client request ID recovers the replacement after a lost transition response; failed saves also offer a local dismissal that retains answers while the page remains mounted. Final approval uses the existing ID-only confirmation endpoint. Keep this boundary when adding steps; client fields and typed yes never authorize execution.

## Confirmation and recovery contract

The model prepares; the user confirms through the first-party endpoint. Neither typed yes nor replayed assistant text grants execution authority. Previews disclose exact date/time, visibility, payment intent, invite/member audience, and draft/publication effects. A conversational edit creates a new preview rather than modifying an approved payload.

`agent_creation_proposals` owns status, payload, expiry, and result. Game/group command hooks lock and validate the proposal inside the creation transaction and store its result in that transaction. Confirmation rechecks current settings, ownership, eligibility, and audience. A completed result remains recoverable after a response or analytics failure. Stop generation is separate from cancelling a pending proposal. Quick Play replacement requires explicit device-local confirmation.

Text streaming is preserved; safe creation cards are hydrated separately by conversation and original user-message ID. Provider tool payloads and arbitrary model-generated UI are not persisted as authorization. New capabilities should extend this small boundary rather than introduce a second workflow engine.

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
