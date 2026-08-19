# Session surface parity

Read this before changing an authenticated game route, shared RSVP route, session navigation, Play, payments, chat, roster presentation, or route loading state.

## Contract

A Relay game has two access paths to one product:

- `/games/[id]` is the signed-in workspace.
- `/s/[slug]` is the account-optional shared link.

Both paths represent the same session and use the same vocabulary, information order, visual grammar, and live state. Access changes available actions—not the underlying product.

## Canonical navigation

Keep these destinations and labels in this order:

1. Overview
2. Players
3. Play
4. Chat
5. Payments
6. Recap, visible throughout planning and play with explicit preview, in-progress, and final states

A shared route and its authenticated counterpart must expose the same session facts. The public link may add RSVP and sign-in prompts. The authenticated workspace may add host controls and personal history.

## Viewer capabilities

| Capability                                        | Host or co-host | Signed-in player | Guest player | Link viewer        |
| ------------------------------------------------- | --------------- | ---------------- | ------------ | ------------------ |
| Read plan, roster, Play, and scores               | Yes             | Yes              | Yes          | Yes                |
| RSVP or update own response                       | Own response    | Own response     | Own response | Join by name first |
| Chat and upload payment proof                     | Yes             | Yes              | Yes          | Join first         |
| Edit plan, roster, booking, payments, and matches | Yes             | No               | No           | No                 |
| Score an assigned active match                    | Yes             | Yes              | No           | No                 |
| Keep account history                              | Yes             | Yes              | No           | No                 |

Render actions only when the viewer can complete them. Explain the next step instead of showing disabled host controls.

## Shared presentation

- Reuse domain components for session hero, plan details, at-a-glance status, scoreboard, queue rows, standings, and chat.
- Use the same game accent, labels, status language, score values, and player ordering on both paths.
- Keep one `h1` per destination. Session heroes below a destination heading use `h2`.
- Use the shared 1152px product canvas and the spacing rules in `DESIGN.md`.
- A scoreboard is the digital court: neutral outer shell, deep court field, complete player names, tabular scores, and explicit Live text. It must remain readable in its column and in the expanded view.
- Expanded scoreboards preserve the same score state and permissions. Public viewers can expand but cannot score.

## Loading and realtime

- A route loading state must match that route’s final structure. Scoreboard skeletons preserve the header, two score sides, controls when applicable, and adjacent queue.
- Subscribe once per mounted session to the session Broadcast invalidation topic. Roster, courts, matches, scores, queue, chat, payments, and memories refresh from authoritative server queries.
- Reconnect language and concurrency errors must match across access paths.
- Score controls update locally, debounce one absolute write, and reconcile against the server version. Hosts, co-hosts, and signed-in players assigned to that active match may score.

## Completion check

For every session-surface change:

1. Compare `/games/[id]/<tab>` and `/s/[slug]/<tab>` side by side at 390px and 1440px.
2. Verify the same session facts, labels, active tab, ordering, and accent.
3. Verify host, player, guest-player, and link-viewer actions against the capability table.
4. Verify loading, empty, denied, live, reconnecting, and completed states.
5. Verify keyboard focus, dialog dismissal, score-control labels, no horizontal overflow, and one `h1`.

Complete when differences are explained by viewer capability rather than separate UI implementations.
