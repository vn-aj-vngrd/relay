# Interactive Agent creation plan

Date: 2026-09-16. Status: proposed; no runtime implementation.

## Recommendation

Extend the existing Agent with conversational preparation and explicit action confirmation. Start with hosted games, Quick Play setup, and groups. Preserve existing forms as another way to complete the same work, using the same domain validation and authorization.

The interaction is: request → necessary questions → editable preview → confirm → authoritative result and next steps. Typing a request prepares an action; it does not silently publish a game or add people. Follow-up questions and suggestions happen in the current conversation. Scheduled reminders or autonomous future work are separate, deferred capabilities.

## Current implementation and reference flows

- `src/features/agent/tools.ts` and `instructions.ts`: authenticated read tools for games, groups, courts, and Help Center. Current Agent is explicitly read-only.
- `docs/agent/README.md`: the current chat uses text streaming and saves visible text, so durable interactive cards require an explicit protocol and persistence extension.
- `src/features/sessions/create-session-form.tsx`, `actions.ts`, and `domain.ts`: hosted game inputs and validation, Manila date conversion, verified court selection, draft/published intent, payment intent, creation key, and transactional creation quota checks. Reuse these rules rather than creating an Agent-specific game model.
- `createSessionAction` also accepts group and completed-source-game references. A group must be accessible to the creator; replay currently requires the original host and a completed game. Published group/replay games can add invitees. Preserve and display these effects.
- `src/features/groups/actions.ts` and `domain.ts`: create/update groups and add members by username. Saving a crew from a game requires the original host, includes linked Going players, and attaches the source game. Names are 2–60 characters; descriptions at most 300.
- `src/features/matches/public-quick-play.tsx` and `quick-play-session.ts`: Quick Play is a local browser session, not a hosted account game. Existing setup supports 4–24 players, 1–6 courts, play mode, queue rule, fixed pairs, and optional round duration. Starting it should open the existing Play experience and warn before replacing an existing local session.
- `src/features/sessions/organizer-actions.ts`, `court-booking-actions.ts`, `live-settings-actions.ts`, `src/features/matches/actions.ts`, and `src/features/payments/actions.ts`: later management actions must retain the existing role, lifecycle, and payment restrictions.

## Function inventory

These are proposed user-facing capabilities, not tools already available to the Agent. Phase 1 is the recommended initial release; phase 2 is a separately gated extension. “Handoff” means opening the existing product flow with safe prepared inputs rather than claiming the Agent completed it.

| Capability | Follow-up inputs or choices | Existing reference / execution boundary | Scope |
| --- | --- | --- | --- |
| Create a hosted game | Title, court/location, exact date and time, capacity, courts, visibility, host participation, payment intent | Shared command extracted from `createSessionAction`; preview then Save draft or Create game | Phase 1 |
| Create a game quickly | Clarify hosted game versus local Quick Play; collect missing required fields, show existing defaults | Same hosted creation command; do not invent a second quick-game database entity | Phase 1 |
| Start Quick Play | Player names, court count, mode; optional queue rule, pairs, duration | Prepare validated configuration and hand off to current browser-local Quick Play | Phase 1 |
| Save an unfinished game | Required fields for the existing game draft schema | Existing draft intent; distinguish saved game draft from incomplete conversational preparation | Phase 1 |
| Replay a completed game | Eligible source game, new date/time, changes, invitees | Existing `sourceSessionId` creation path and original-host restriction | Phase 1 |
| Create a game for a group | Accessible group, game details, resulting invitee list | Existing `groupId` creation path; explicit preview of invitations | Phase 1 |
| Create a group | Name, optional description | Shared command extracted from `createGroupAction` | Phase 1 |
| Save a game's crew as a group | Eligible hosted game, name, included people | Existing source-game group creation; preview linked Going players and game association | Phase 1 |
| Find/select a court while creating | Ask city/neighborhood for “near me”; pick listed court or enter a custom venue | Existing Court Finder reads and game venue controls; no GPS or availability claim | Phase 1 helper |
| Inspect/edit/cancel pending preparation | Natural-language correction or inline field edit | New durable proposal; edits invalidate prior confirmation | Phase 1 helper |
| Update/reschedule a game | Target, changed fields, affected roster | Existing `updateSessionAction`; current role and lifecycle checks | Phase 2 |
| Publish an existing draft | Complete setup and review visibility/invite effects | Reuse the existing draft publication journey after identifying its command boundary; do not recreate the game | Phase 2 |
| Add/approve/remove game players | Exact player or pending request; guest details when supported | Existing roster actions; confirm membership consequences | Phase 2 |
| RSVP, attendance, availability, roster lock | Game, exact player/scope, status | Existing RSVP/attendance/availability/lock actions and actor restrictions | Phase 2 |
| Update a group/add a member | Owned group, changed fields or exact username | `updateGroupAction` / `addGroupMemberAction`; images stay in existing upload flow | Phase 2 |
| Add a cohost/change organizer role | Eligible game, exact person, role | Existing organizer actions; explicit permission-change preview | Phase 2 |
| Record a court booking | Booking already made, reference/details | Existing booking actions; records booking information, does not reserve a court | Phase 2 |
| Configure/start Play or create a match | Game, roster, courts, mode | Existing Play settings and match actions; live scores/queue controls stay in Play initially | Phase 2 |
| Set up contributions or add an expense | Game, amount/split and payment setup | Initially hand off to Payments; later typed commands require separate financial review | Handoff |
| Share/invite others | Exact audience and channel | Offer existing share flow; no automatic external messages | Handoff |
| Suggest a court/send feedback | Relevant location or feedback details | Existing submission forms; prepare then user submits | Handoff |
| Cancel/delete resources, confirm payments, refunds, subscription/account/admin changes | Destructive, financial, or privileged effects | Excluded from initial Agent mutation surface | Deferred |
| Scheduled follow-ups/reminders | Time, recipients, purpose, delivery channel | New scheduling capability requiring separate scope and explicit consent | Deferred |

## Interactive experience

Example: “Create a game for my Friday group this Saturday evening.”

1. Resolve accessible groups; ask which one if ambiguous. Ask for the court and exact start/end time together.
2. Use the existing court search. For “near me,” ask for a city or neighborhood in text. Do not request device location.
3. Ask remaining required choices, such as capacity and payment intent. Display the resolved calendar date and Philippine time; do not silently interpret an ambiguous date or overnight interval.
4. Show one compact game preview using current Relay controls: title, group, court, time, players/courts, visibility, payment choice, and invitation effect. The user can edit fields or say “make it 12 players.”
5. Offer an explicit primary action, such as **Create game**, with **Save draft** and **Cancel** where valid. Incomplete preparation cannot be mislabeled a saved game draft.
6. On success, show the actual game link and concise next actions such as Open game, Share, or Set up payments. These are suggestions, not automatic mutations.

Use native controls and compact cards inside the existing message column. Preserve the fixed composer, message-only scrolling, mobile full-screen layout, keyboard access, existing skeleton restoration, and accessible pending/error states. Do not add an always-visible action toolbar. During preparation the composer remains available for corrections. A changed preview clearly supersedes the old one.

## Implementation design

### Share business behavior

Extract small typed domain commands from the current redirecting FormData server actions, starting with game creation. Forms and Agent both call those commands. Keep redirects/revalidation at adapters, preserve analytics and domain notifications, and return the resource identifier and safe result DTO. Reuse existing Zod schemas and transactional hosting quota/idempotency logic. Do not duplicate game/group writes inside tool definitions or add a generic workflow engine.

### Separate preparation from execution

Model tools may prepare a typed proposal and request missing fields. A first-party confirmation endpoint executes only the server-held reviewed proposal. It reloads identity, conversation ownership, feature gates, permissions, resource state, and quota at confirmation time. Neither natural-language “yes” in replayed history nor client-supplied `approved: true` is sufficient authority.

Add one durable proposal record containing owner/conversation, action kind, validated payload, version, expiry, status, idempotency key, and result reference. Pending states distinguish incomplete preparation from ready-to-confirm. Editing invalidates the previous version. Confirmation locks/rechecks the record; link the domain write and completed result in one transaction where possible. Retries and double-clicks return the existing result. Group creation needs equivalent duplicate prevention to existing game creation. Model failure after a commit must not turn successful creation into a retry that creates another resource.

After refresh, hydrate trusted proposal/result state alongside historical messages. Stop generation and cancel pending action are different controls; Stop cannot undo a committed creation. On uncertain network failure, query operation status before offering retry. Permission removal or changed invitees between preview and confirmation requires denial or a refreshed preview.

### Extend the chat protocol deliberately

AI SDK supports typed tool UI and approval states, but Relay currently uses text-only streaming. Add a versioned, allowlisted representation for question/preview/result cards and maintain compatibility with old text history. Persist safe card references and approved projections, not unrestricted provider tool payloads or reasoning. Hydrate authoritative status from the proposal store; never execute saved message contents.

Native SDK approval can adapt the UI, but it does not replace application ownership, expiry, transactions, or idempotency. Use one application confirmation authority rather than competing SDK and database approval systems. Do not add resumable streaming in the first release; preserve Stop and reload durable messages/action status instead.

### Admin and privacy

Add default-off controls for game creation, group creation, and later game/group management under the existing global Agent switch. Quick Play handoff can be controlled with game creation. Recheck all controls when confirming. Show action counts/failures and minimal audit records without storing credentials or excessive private data. Update read-only product/help copy when actions are enabled. Keep strict zero-retention routing as the default and preserve the existing explicit admin privacy setting.

Maintain current message limits and hosting quotas. Deterministic preview edits and confirmation should not create extra model calls or message charges. Model-assisted turns follow current message accounting. Do not require unsupported forced tool-choice or parallel-tool-call parameters; validate inputs server-side and test the configured OpenRouter route.

## Delivery and validation

1. Shared game command plus durable proposal lifecycle; one complete game creation journey.
2. Typed question/preview/result UI, restoration, accessible mobile interactions, and admin gates.
3. Expand to replay/group games, group creation, saved crews, and Quick Play handoff using the same small interfaces.
4. Review phase 2 independently after the creation flows are reliable.

Required unit/integration coverage: missing fields, ambiguous dates, invalid court, existing draft requirements, creation quota, denied ownership, changed membership/invitees, stale proposal versions, expiry, forged payload/foreign action ID, duplicate confirm, commit then disconnect, stop/cancel distinctions, refresh restoration, legacy text history, disabled admin gate, group duplicate prevention, and local Quick Play replacement. Preserve form and shared-game parity after extracting commands. Maintain targeted journey coverage; browser E2E execution remains opt-in under `docs/RELIABILITY.md`. Run the full mandated quality gate before committing implementation.

## Primary-source research

- [AI SDK tool reference](https://ai-sdk.dev/docs/reference/ai-sdk-core/tool) and [generative UI](https://ai-sdk.dev/docs/ai-sdk-ui/generative-user-interfaces): typed tools can drive ordinary React cards.
- [Tool approvals](https://ai-sdk.dev/docs/agents/tool-approvals) and [chatbot tool usage](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-tool-usage): approval pauses/resumes a tool flow. Verified against installed `ai` 7.0.101 docs and source; the approval response does not edit tool inputs or supply application idempotency.
- [Message persistence](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence): tool-bearing history needs validation. Application ownership and durable business state remain Relay responsibilities.
- [Resume streams](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-resume-streams): resumability has abort trade-offs; retaining Stop with durable reload is the recommended initial choice.
- [OpenRouter tool calling](https://openrouter.ai/docs/guides/features/tool-calling) and [provider routing](https://openrouter.ai/docs/guides/routing/provider-selection): application code executes model-requested tools; provider capabilities and privacy constraints still apply.

The architecture, phases, and confirmation policy above are engineering recommendations based on these sources and the current Relay implementation, not requirements imposed by the SDK.
