# Session surface parity

Read this before changing an authenticated game route, shared RSVP route, session navigation, Play, payments, chat, roster presentation, or route loading state.

## Contract

A Relay game has two access paths to one product:

- `/games/[id]` is the signed-in workspace.
- `/s/[slug]` is the account-optional shared link.

Both paths represent the same session and use the same vocabulary, information order, visual grammar, and live state. Access changes available actions—not the underlying product.

## Route ownership

- Signed-in players stay on `/games/[id]` when they open an invite, notification, search result, or Open games result inside Relay.
- A signed-in nonparticipant may open `/games/[id]` only when the game is currently eligible for public discovery: public, published or live, not ended, and carrying a stated player price. The workspace is read-only except for the viewer’s RSVP.
- `/s/[slug]` remains the account-optional shared entry point and the host’s explicit shared-link preview. Signing in does not make a private or link-only game discoverable by identifier.
- RSVP changes update capabilities in place. Hosts and co-hosts see management controls; participants see personal actions; invitees, pending players, and discoverers see only actions they can complete.
- Guest RSVP never requires registration. A successful guest response may offer account creation afterward; authentication must claim the existing response, reconcile an unanswered account invitation without adding a second roster row, and return the player to that game. The guest token remains valid when signup is canceled or interrupted.

## Canonical navigation

Keep these destinations and labels in this order:

1. Overview
2. Play, which becomes the factual Recap after the host ends the session
3. Chat
4. Payments
5. Story, usable throughout the session for invitations, safe live updates, completed stories, and available game photos

Play owns participation as well as courts: before play, roster/requests/waitlist/arrival are inline above Set up Play; live play exposes a Players (Going count) drawer alongside the existing live section controls, not another roster tab. Completed recap leads with an expandable final roster below; cancelled games retain a read-only roster below cancellation. Final Going responses do not prove participation. Requests and other responses remain organizer-only and are excluded from rendered output for other viewers, including shared links.

`/play?panel=players` reveals and focuses the inline roster before play, opens the live drawer, or expands the final roster. Both legacy `/players` routes retain authorization before redirecting and preserve query values. Native history changes only this panel, preserving unrelated query values, hash, and mounted scoring state. Back/Forward and refresh restore roster intent. Lifecycle changes render current permitted controls; mutations recheck terminal status under the session lock. Roster, RSVP, and organizer mutations invalidate Play and setup on the appropriate access paths. One existing session realtime subscription remains authoritative.

A shared route and its authenticated counterpart must expose the same session facts. The public link may add RSVP and sign-in prompts. The authenticated workspace may add host controls and personal history.

## Viewer capabilities

| Capability                                        | Host or co-host | Signed-in player | Guest player | Link viewer        |
| ------------------------------------------------- | --------------- | ---------------- | ------------ | ------------------ |
| Read plan, roster, Play, and scores               | Yes             | Yes              | Yes          | Yes                |
| RSVP or update own response                       | Own response    | Own response     | Own response | Join by name first |
| Chat, contribute memories, and upload proof       | Yes             | Yes              | Yes          | Join first         |
| Update live availability                          | Any player      | Self             | Self         | No                 |
| Edit plan, roster, booking, payments, and matches | Yes             | No               | No           | No                 |
| Correct a completed match score                   | Yes             | No               | No           | No                 |
| End the live session                              | Host or delegated lead | No        | No           | No                 |
| Delete the session                                | Host only       | No               | No           | No                 |
| Cancel a published game before Play               | Yes             | No               | No           | No                 |
| Score an assigned active match                    | Yes             | Yes              | No           | No                 |
| Keep account history                              | Yes             | Yes              | No           | No                 |

Render actions only when the viewer can complete them. Explain the next step instead of showing disabled host controls. Organizer authority and participation are separate: a host or co-host may manage without occupying capacity, entering rotations, appearing in standings, or owing a player share. Organizer authority is managed only in the Organizers tab of Game settings rather than the Play roster; before and during Play, only the original Host may add a Relay member by username or remove Co-host access. A newly added organizer does not participate unless they separately RSVP. The roster in Play remains participation-focused and shows a Host or Co-host indicator whenever an organizer appears in a roster state. A host may delegate live-session completion to one lead co-host without delegating ownership or deletion.

Hosts and co-hosts may view Game settings in every session state. During Play, structural plan and access controls are disabled, but player notes and booking details remain editable. Organizer role changes never change participation or active assignments. Completed and cancelled games expose view-only plan settings. Payment settings and follow-up remain available after completion, matching the existing repayment lifecycle; cancelled payments are read-only.

## Shared presentation

- Reuse domain components for session hero, plan details, at-a-glance status, scoreboard, queue rows, standings, and chat.
- Use the same game accent, labels, status language, score values, player price, approval requirement, capacity state, and player ordering on both paths.
- Create offers Decide later (unset), Free, or Collect payment. Game settings → Payments owns general expense, split-type, and payment-detail configuration. New games have one payment setup with multiple expense items; older separate records remain intact. Payments owns tracking, individual share adjustments, missing-share assignment, proof, and review, with an exact settings link. A split collection without assigned shares says the share is pending, not that the host has not set up payment. Fixed collections disclose their rate before anyone joins. Both Payments routes show the same expense breakdown, contribution method, adjustment reason/history, and exact proposal acceptance or decline controls for the affected player. No payment instructions are presented as due for zero/excluded shares or while a proposal awaits a response.
- Free is an explicit payment state, not missing data. Newly created games may say payment is not set up yet. Public games appear in Open games only after the host marks them Free or adds a per-player amount, so discoverers always see price context before the RSVP action.
- Keep one `h1` per destination. On game tabs it is screen-reader-only because the active tab already labels the view; no visible title, subtitle, or empty header row remains. Loading states use the same accessible heading and start skeletons at the content position, without heading/description placeholders. Game settings and Set up Play retain visible headings. Session heroes use `h2`.
- Use the shared 1152px product canvas and the spacing rules in `DESIGN.md`.
- A scoreboard is the digital court: neutral outer shell, deep court field, complete player names, tabular scores, and explicit Live text. It must remain readable in its column and in the expanded view.
- On live Play, desktop uses one compact toolbar: Courts/Queue and other available section tabs align left; **Play in progress** and **Players (Going count)** align right on the same row. On mobile, roster actions stack above the section tabs. Both access paths share this toolbar; the tab rail can scroll without squeezing or remounting the roster drawer or active courts.
- While Play is live, authenticated game routes outside Play retain a compact link to the participant’s current Playing, Waiting, Resting, or Not here state. The Play page itself does not repeat that status in a personalized banner; current assignments and waiting order live in Courts and Queue.
- Expanded scoreboards preserve the same score state and permissions. Public viewers can expand but cannot score.

Before Play, hosts confirm an unresolved court booking in a compact dialog, then use three steps: Players, Game options, Review. Confirmed bookings and No booking needed bypass the prompt. Back preserves selections; only Review offers Start Play. Booking changes reopen the prompt without losing setup; roster/court changes require a fresh review. The server rechecks booking and play eligibility under the session lock. Overview, Home, and Games show next actions instead of percentages. Payments are independent and can be arranged before, during, or after Play; unset payment never becomes Free implicitly and public discovery still requires a stated price. Public and authenticated plan summaries use the same booking/payment facts. Existing live sessions continue without retroactive gating.

Completed Overview has one non-dismissible **Game ended** action banner above details on both access paths, not a repeated notice on every tab. View recap stays in the current route family; only the original host receives Play again. Payment follow-up requires the destination’s existing participant capability. Authorized nonparticipants may browse Open games. The final roster labels Going responses without asserting attendance; completed and cancelled shared previews have no joining or availability invitations.

The Overview hero uses one shared lifecycle chip directly below the game name and before the host label on both access paths. Game navigation, Share/Edit chrome, and the completion banner do not repeat it. Published schedules that have elapsed say Published, not Ended; live games remain Live until the persisted lifecycle changes. Layout-provided authorized lifecycle context lets Overview’s loading state use completion geometry without an RSVP placeholder or an additional subscription.

## Loading and realtime

- Overview’s page and loading state live in a leaf route group (`/games/[id]/(overview)` and `/s/[slug]/(plan)`), preserving the public URLs. Never place an Overview-specific `loading.tsx` at the shared `[id]` or `[slug]` segment: Next.js would let sibling tabs inherit that fallback. The workspace layout and navigation remain shared; each tab owns its content loading state.
- A route loading state must match that route’s final structure. Scoreboard skeletons preserve the header, two score sides, controls when applicable, and adjacent queue.
- Subscribe once per mounted session to the session Broadcast invalidation topic. Roster, courts, matches, scores, queue, chat, payments, and memories refresh from authoritative server queries.
- Reconnect language and concurrency errors must match across access paths.
- Score controls update locally, debounce one absolute write, and reconcile against the server version. A conflict restores and names the authoritative score before inviting a retry. Hosts, co-hosts, and signed-in players assigned to that active match may score.
- Host and co-host court, cancellation, and queue changes serialize through the session and reject stale structural mutations. A closed court keeps its history, lets an active match finish, and receives no new assignment. Match cancellation voids the affected Paddle Stack court or complete synchronized rotation and excludes it from standings.
- Match completion confirms the teams and final score. Completed results appear on both access paths; only hosts and co-hosts may correct them, and corrections update standings and recap without rewriting later court assignments.
- Before Play, attendance uses **Here / Not here**. During Play, availability uses **On court**, **Waiting**, **Taking a break**, and **Taking a break after this match**. Active players finish their match before taking a break; late and returning players rejoin at the queue’s end. These changes never alter RSVP or past results.

## Completion check

For every session-surface change:

1. Compare `/games/[id]/<tab>` and `/s/[slug]/<tab>` side by side at 390px and 1440px.
2. Verify the same session facts, labels, active tab, ordering, and accent.
3. Verify host, player, guest-player, and link-viewer actions against the capability table.
4. Verify loading, empty, denied, live, reconnecting, and completed states.
5. Verify keyboard focus, dialog dismissal, score-control labels, no horizontal overflow, and one `h1`.

Complete when differences are explained by viewer capability rather than separate UI implementations.
