# Critical and common game journeys

Scope: Relay's organizer and invited-player experience, from planning through payment follow-up and Story. A critical journey can prevent a game from happening, lose a response/result, charge the wrong person, or expose an organizer action. Common journeys are the ordinary tasks a host and friend repeat. These are acceptance scenarios, not a promise that every environment or combination is bug-free.

## Acceptance scenarios

| ID | Journey | Required outcome | Evidence and remaining coverage |
| --- | --- | --- | --- |
| J01 | Host creates and publishes a link-only game | Required fields explain errors; Back/edit preserve input; review matches published date, venue, capacity and payment choice; published game is in Games. | Existing authenticated lifecycle browser scenario; creation previously passed. A fresh uninterrupted creation-to-completion rerun is blocked by the dedicated account's five-game allowance. |
| J02 | Host shares; friend opens the invitation without an account | Share uses `/s/[slug]`; plan, price and approval requirement are visible before RSVP; clipboard/share failure leaves a usable link. | Prior guest browser walkthrough; canonical URL and recovery component tests. Real operating-system share sheets remain a manual check. |
| J03 | Friend joins, changes to Maybe, or declines | Saved status persists after reload without requiring signup or creating duplicate roster entries; Maybe and decline do not reserve a spot. | Main lifecycle join and prior manual decline; branch browser scenario adds response changes and reload. |
| J04 | Host approves or rejects a join request | Pending guest has no confirmed spot; pending names remain organizer-only; approve applies current capacity; rejection removes the request. | Branch browser scenario; roster transition and management tests. |
| J05 | Full game waitlists a friend; another player leaves | Capacity is never exceeded; approval at capacity becomes waitlisted; earliest eligible player is promoted when a spot opens. | Branch browser scenario plus transition tests. Simultaneous real-browser joins remain unverified; locked action behavior has unit coverage. |
| J06 | Host locks and reopens responses | Closed roster has no usable response form; unlock restores response controls; stale submissions are rejected by current server state. | Branch browser scenario plus RSVP concurrency and roster-lock action tests. |
| J07 | Host marks arrivals and prepares Play | Here is distinct from Going; booking is resolved; eligible players/courts/format are reviewed; invalid or stale setup cannot start. | Prior lifecycle browser walkthrough; setup, start-play and authorization unit tests. No-arrivals fallback deliberately permits Going players and is explained. |
| J08 | Players play, rest/return, and keep score | Only authorized scorers can change assigned matches; current scores agree across views; returning players follow queue rules; conflicts do not silently overwrite results. | Prior host scoring/guest realtime browser flow; live-court, availability and rotation tests. Signed-in assigned-player scoring and multi-device conflict recovery still need browser coverage. |
| J09 | Host finishes a match and ends the game | Result confirmation precedes completion; standings and both recap routes agree; final roster is read-only; ended games cannot accept RSVP/start again. | Prior passing resumed lifecycle browser scenario and terminal-state tests. |
| J10 | Host sets payment; player submits proof; host confirms | Recipient/amount precede proof; upload succeeds; proof pending is distinct from paid; confirmed players are not prompted to pay again. | Prior browser flow reproduced and verified the payment SQL fix; both payment route and SQL regression tests. No real money transferred. |
| J11 | Host adjusts a share or closes a collection | Affected player alone accepts/declines; pending proposal is not presented as due; old proof/payments remain history; switching Free does not imply a refund. | Payment adjustment, revision, switch and history tests. These alternative payment paths still require browser verification. |
| J12 | Host cancels before Play | Confirmation explains impact; reason remains visible; joining, attendance and start controls close; payment history stays available without new-payment instructions. | Optional terminal step in branch browser scenario; cancelled payment/RSVP tests. |
| J13 | Host/player creates and downloads Story | The default photo placeholder becomes a poster or 2–4 photo collage; each crop and photo order survive layout/theme edits; facts remain truthful; preview/export geometry agrees. | `recap-share-card.test.tsx`, `story-collage-editor.test.tsx`, `story-collage.test.ts`, `use-story-photos.test.tsx`, invitation/recap layout suites and `e2e/story-creative.spec.ts`. New collage coverage is authored, not run. Actual mobile social-app handoff remains manual. |
| J14 | User signs in or returns from a shared link | Public entry is usable; protected routes reject signed-out users; guest-to-account handoff preserves the response and destination. | Entry and protected-route browser tests; auth and destination unit coverage. Actual signup, CAPTCHA, SMTP and guest-account claim are not browser-verified. |

## Admin photo limits

An MFA-verified administrator can save separate 1–4 MiB chat and album limits.
The shared authenticated/guest upload forms and pricing show the saved values;
server uploads and reservations enforce exact boundaries even after an open
form becomes stale. Existing photos, host storage, daily limits and the album
count remain unchanged. `image-upload-limits-action.test.ts`,
`image-upload-limits-control.test.tsx`, `media-usage.test.ts`,
`memories/actions.test.ts` and `memory-photo-form.test.tsx` cover this at unit and
component level. The migration companion documents the pending authenticated
browser scenario; the non-admin E2E fixture cannot change global Admin settings.
Local check results are recorded in the PR; browser execution remains opt-in.

## Repeatable checks

The normal lifecycle stays in `e2e/smoke.spec.ts`. The alternative roster paths live in `e2e/game-branches.spec.ts`; they use the same `establishTestSession` and `reusableTestGame` guards. Both require the dedicated non-admin fixture described in `e2e/README.md` and `docs/AGENT_VALIDATION.md`.

Branch checks deliberately mutate and retain one exact published, link-only test game. Supply `E2E_BRANCH_SESSION_ID`; they do not create games or reset data/quotas. They add three synthetic guests and change capacity/approval. Review the exact retained state before another run. Cancellation is separately enabled by `E2E_BRANCH_CANCEL=true` and is terminal, so that game cannot be reused by this fixture afterward. Never point this at a real game or roster.

```sh
E2E_SESSION_FIXTURE=true E2E_BRANCH_SESSION_ID=<owned-test-game-id> \
  node --env-file=.env.local node_modules/@playwright/test/cli.js test \
  e2e/game-branches.spec.ts --project=desktop-chromium
```

## Verification record — 2026-09-13

- Baseline: commit `aceb1d3`; prior audit evidence is in `GAME_JOURNEY_AUDIT.md`.
- Public entry/protection/keyboard/mobile checks: 7 passed; 1 intentional skip because the mobile-only assertion does not apply to desktop.
- Branch browser scenario: passed in 1.6 minutes, including the optional cancellation step. Host settings, three mobile guest requests, organizer-only pending names, approval/rejection, waitlisting at capacity, promotion after Maybe, persisted decline, lock/unlock, and cancellation reason/read-only controls all passed.
- One intermediate attempt reached locking and stopped because the assertion matched both responsive copies of the closed-roster message. The test now checks the visible copy. The exact test roster was reopened through its host UI before the complete passing rerun; no data reset was used.
- Supporting authorization, roster concurrency, start-play, availability, live-court, and payment-alternative checks: 63 tests passed across 10 files. TypeScript and changed-test Biome checks passed. Product code did not change in this verification pass.
- The first branch attempt failed before any changes on a hosted Supabase DNS lookup (`ENOTFOUND`). This is recorded as an environment failure, not a passing scenario or a demonstrated application regression.
- These results are local app checks against the configured hosted Supabase, not production verification. The branch test cancelled only the dedicated account's retained test game; its exact ID and status are recorded in the ignored account Markdown. No real friends were messaged and no money moved.

## Release decision

Do not mark all journeys verified from a unit-suite pass. Require the normal browser lifecycle and relevant alternative browser paths for a release that changes them, alongside `pnpm check:full`. Record the commit, environment, date and evidence. Prior evidence remains prior evidence; a resumed game does not validate creation.

Before claiming complete critical-journey coverage, close the explicit gaps above: uninterrupted new-game lifecycle, signed-in invited player/guest claim, live scoring conflicts and recovery, alternative payment flows, and real auth/mobile integrations. Use a normally available disposable-account quota; do not provision accounts merely to evade a limit or change billing state to force a pass.

## Shared tab layout regression

Overview, Play, Chat, Payments and Story share one tab-to-content inset on authenticated and shared routes, including loading states. `src/features/sessions/game-tab-spacing.test.ts` guards spacing ownership; `play-roster-surface.test.tsx` covers roster lifecycle behavior. `e2e/game-layout.spec.ts` additionally measures compiled-CSS tab offsets at 390px and 1440px using current route/loading container classes and real roster/tour components. It checks final-roster spacing, denied-payment internal padding and both final tour continuations. These synthetic layout checks do not replace authenticated game-journey E2E.


Story photo-memory regression coverage: completed Story opens with a clickable photo placeholder and disabled export, accepts a local photo before Customize is opened, preserves the caption after removal, and exports the photo composition. `e2e/story-creative.spec.ts` maintains this browser-only fixture journey alongside all five theme exports. Coverage added; execution remains opt-in. Validation deferred to pre-commit.


Story photo allowance: both account and shared-link surfaces use the same 50-photo album cap and host-owned storage budget. Contributors see usage and the rule that whichever limit fills first stops uploads; neither resets monthly. Only monthly game creation renews (Free 12, Plus 40, Pro 100 for standard v2 offers). Storage is 250 MiB / 2 GiB / 10 GiB for standard v2 offers. Existing/custom snapshots may differ. The host gets storage-management and plan links; other players are not asked to upgrade their own accounts. Regression coverage includes full album with spare bytes, full storage with spare album slots, exact boundaries and preserved legacy/custom terms. Validation deferred to pre-commit.

`e2e/photo-allowance.spec.ts` maintains the mobile pricing/FAQ explanation of both limits. `media-usage.test.ts` covers reservation boundaries, while `memory-photo-form.test.tsx` covers full-album/full-storage feedback and host-only management links. These additions have not been executed; real concurrent database uploads and route-level browser checks remain unverified.


Story gallery photos open in a shared fullscreen Dialog on both routes. The viewer displays the complete image with object-contain, caption and live photo counter; previous/next buttons, Left/Right keys and horizontal swipes cycle through available photos. Single-photo albums omit navigation. Escape/native dialog dismissal and Close return focus to the initiating thumbnail. Safe-area padding and bounded scrolling captions preserve mobile controls. Image failures retain recovery text and navigation. Reuses the existing ChatPhotoViewer dialog pattern and Make swipe threshold. Unit coverage added; validation deferred to pre-commit.


Story Make and Photos are both available from publication through live play and completion, even with an empty album. Hosts, co-hosts and Going account/guest players can add pregame memories using the existing upload flow. Draft and cancelled games remain unavailable; spectator access is read-only. Participant-image restrictions, shared album caps and host storage limits still apply. The shared SessionMemories implementation keeps both private and public routes aligned. Permission, upload-action and component regression tests cover the phase boundaries; browser execution remains opt-in.

## Agent V1

| Journey | Acceptance condition | Coverage / evidence |
| --- | --- | --- |
| A01 — Ask Agent about games, rosters, groups or Help Center | Authenticated active account; only authorized data; streaming answer with source links; bounded activity labels and elapsed time expand while working and collapse on completion; stopped/failed activity persists; response errors and Retry stay in the affected Agent turn; no unapproved writes; cancellation and safe recovery | Agent request/read/tool/route/help unit regressions; synthetic responsive chat scenario in `e2e/agent-chat.spec.ts`. All execution deferred; live provider and cross-account database exercise unverified. |
| A02 — Configure Agent as administrator | MFA-protected admin action; encrypted write-only credentials; audited changes; creation capabilities default off; server validates enabled capabilities and explicit approval | Agent credential/action regressions. Validation deferred; migration, admin browser/MFA journey and live provider setup unverified. |
| A03 — Consume a monthly Agent allowance | Free/Plus/Pro defaults 50/250/750; configured limits match pricing; reservations prevent overspending; failed-before-text responses release; upgrade preserves usage; correct reset dates; composer ring discloses used/reserved counts and PH reset date on hover, focus or tap | Agent allowance/reservation/stream, usage-indicator and shared pricing/showcase regressions. Synthetic chat scenario includes tap disclosure. Execution deferred; real concurrent PostgreSQL and provider-failure tests remain unverified. |
| A04 — Continue an Agent conversation | Sidebar and mobile header show working, unread completion and failure indicators; returning to Agent clears unread status; In-app navigation across authenticated and public route layouts preserves pending chat creation, streaming replies, activity, selected conversation and draft; sign-out/account changes stop and clear the active session; new chat starts a separate conversation; refresh restores the selected saved chat; owner-only rename/delete; account changes isolate state; Markdown renders without HTML or unsafe links; message time and Copy appear on hover or keyboard focus, remain visible on touch, and never shift layout | Agent history/auth/stream, session, answer and reply-actions unit regressions; synthetic Agent navigation fixture covers message actions for both authors. Execution deferred. |
| A05 — Ask Agent about courts | Verified Relay directory only; named-place search; manual city/neighborhood follow-up; no device-location access; admin toggle removes capability; no booking | Court/tool/manual-location/action regressions added; execution deferred. |
| A06 — Conversational Agent creation and approval | Create actions start chat; one missing question per reply; saved answers and collected-detail progress survive restoration; corrections require fresh review; only explicit approval creates | Progress, preparation, route and confirmation regressions; synthetic desktop/mobile Agent fixture. Execution deferred; real database concurrency and live provider handoff unverified. |


J13 creative-layout acceptance: all five arrangements retain two to four selected
photos and their crops; callouts, scrapbook, and camera frames share paths between
preview and export; revealing extra layouts retains the caption and photos. Photo memories show recorded totals once, inside the photo overlay.
Regression coverage: `story-collage.test.ts`, `story-collage-editor.test.tsx`,
`story-photo-stats.test.ts`, `story-recap-layout.test.ts`, and the three creative PNG
branches in `e2e/story-creative.spec.ts`. Authored, not executed. Validation deferred
to pre-commit; browser and social-app handoff remain unverified.


J13 mobile export regression: Share Story and Download PNG follow every editing
panel without overlap at narrow portrait and landscape sizes. The responsive
contract is covered by `story-workspace.test.ts`; the real composer geometry is
covered by `e2e/story-creative.spec.ts`. Coverage authored; validation deferred
to pre-commit. No native sharing or download failure was inferred from the layout
screenshot.


J13 template clarity: `story-recap-layout.test.ts` covers single-photo versus
collage totals, empty photo memories, missing court time, and factual
copy bounds across photo modes. Full-photo theme artwork is omitted in preview
and export. Coverage authored; validation deferred to pre-commit.


Agent mobile New chat spacing: `e2e/agent-chat.spec.ts` checks the action's right
inset and separation from chat history before starting a new conversation.
Coverage authored; validation deferred to pre-commit.


J13 scrapbook refinement: regression cases in `story-recap-layout.test.ts`,
`story-collage-editor.test.tsx`, and `story-theme-picker.test.tsx` cover optional
stats, retained photos and captions, and crop-aware collage thumbnails. Shared
poster fitting gives text the artwork space before shrinking. Validation deferred
to pre-commit; rendered review and PNG inspection remain unverified.


J13 curated theme set: editor tests use Studio, Soft Serve and Clubhouse labels
while preserving theme IDs. `recap-template-preview.test.tsx` checks the landing
examples render all five real themes with sample-data labeling. Existing theme
path, photo-preview, fitting, and export scenarios cover the revised artwork.
Validation deferred to pre-commit.


## Device-local Quick Play (2026-09-17)

Application-wide state polish: loading regions expose a readable label and
reduced-motion-safe indicator without nested status announcements. Empty content
uses an icon, title, guidance and existing permitted actions. Shared component
coverage lives in `content-state.test.tsx`; Court Finder also covers clearing
filters from an empty result. See `audits/CONTENT_STATES.md` for the surface map.
Validation deferred to pre-commit; authenticated and admin browser coverage is
not implied by the local review gallery.

Scoreboard side swapping: Quick Play and saved-game Play share the labeled
Swap sides control and tooltip in normal and fullscreen views. Saved-game
swapping changes local display order only; scoring must still write to the
original team. `live-court.test.tsx` covers swapping, scoring and swapping back.
Validation deferred to pre-commit; browser coverage for saved-game swapping
remains unverified.

Both public and authenticated `/play` use `PublicQuickPlay`. Setup displays
a single-column player list, with Add player below the final row and Paste
names beside the heading. Adding a player focuses the new name field; component
and existing Quick Play browser coverage assert this focus behavior.
Setup must restore names, options and its current step after reload. Before hydration, show a real
Quick Play heading and readable device-opening status, without pulsing blocks
or actionable fresh setup controls. Hydration must restore an existing recap
without a mismatch; server-render/hydration cases in `public-quick-play.test.tsx`
cover empty storage and a saved recap. Validation deferred to pre-commit.
Balanced Mix experience must
be editable in Game options. Review exposes relevant pairs, queue rules,
experience and timer. Courts, Queue and Results remain directly reachable at
320px, 390px and desktop widths without queue content following match history.
Ending requires settled courts and retains a reloadable recap; starting a new
session separately confirms replacement. Storage failures warn without blocking
in-memory scoring. Quick Play supports late arrivals in mixed-partner Paddle Stack; other formats retain a fixed roster. It never becomes account
history.

Regression coverage: `public-quick-play.test.tsx`, `quick-play-session.test.ts`,
`quick-play-draft.test.ts`, and the public Quick Play scenario in
`e2e/smoke.spec.ts`. The full unit suite passed (2,547 tests across 356 files),
alongside formatting/lint, TypeScript and the production build. Manual public
browser setup, scoring and recap reload passed with synthetic players;
authenticated browser and automated E2E execution remain unverified.


Shared action density: Button/ButtonLink keep 36px defaults and 40px large
variants below and above the desktop breakpoint. Explicit icon actions keep
44px targets; existing 48px chat send and 64px scoreboard controls retain their
sizes. Component contract coverage is in `src/components/ui/button.test.tsx`;
mobile rendered action/score size assertions extend the public Quick Play E2E
scenario. Component tests passed; manual public checks measured 36px actions,
44px swap controls and 64px score controls. Automated E2E remains unrun.


Court Finder mobile height: the dedicated public/authenticated Courts workspace
uses the bottom navigation's actual flex height, including its safe-area inset,
and removes the ordinary scrolling page's bottom padding. The inner list/map
fills the remaining height; outer shell scrolling stays locked. Geometry
regression coverage in the public court-finder E2E scenario checks list-to-nav
adjacency and absence of outer overflow at 320px, 390px and landscape 844px.
Manual public checks at those sizes found a 1px list-to-nav border and no outer
overflow. Automated browser execution remains opt-in and unrun.


Quick Play Manage and recap follow-up: reuse saved-game PlaySectionTabs with
separate Results/Standings, court availability and session ending in Manage.
Ended sessions use the shared recap calculation, summary and highlights; local
corrections update all facts, while cancelled-only sessions show no highlights.
Coverage: `public-quick-play.test.tsx`, existing `session-recap.test.tsx` and the
public Quick Play E2E scenario. Pre-commit lint/types and production build passed;
the full unit run passed 2,550 tests, and the single failing height assertion was
corrected and passed on its targeted rerun (2 tests). A local public
browser walkthrough covered Manage, finishing/ending, recap reload and score
correction; mobile/desktop widths had no horizontal overflow or browser errors.
Authenticated, dark-mode and automated browser execution remain unverified.

Mobile parity follow-up: private/shared Play and Quick Play reuse standings and
recap presentation. Mobile queue controls prioritize up/down, preserve full names,
and omit rotation explanation cards. Shared recap coverage checks results before
highlights; standings coverage checks factual records and empty states.

Court Finder responsive follow-up: bound the results grid width, wrap filters
from tablet widths, and apply the full-height workspace at every breakpoint.
Phone results meet bottom navigation; tablet/desktop bottom insets match the top.
Manual public checks at CSS widths 355, 818, 1091 and 1455 found zero page-width
overflow and zero outer vertical overflow. Unit and E2E geometry coverage updated.

PR review follow-up: Quick Play stores wall-clock completion separately from its
rotation ordering counter. Legacy recaps omit elapsed time; new timing survives
reload. Final `pnpm check:full` passed: lint/types, 357 test files / 2,552 tests,
and production build. Automated E2E remains unrun.


Quick Play availability: the Players drawer allows
breaks and rejoining. Acceptance covers immediate waiting removal, deferred
on-court rest on completion/cancellation, undoing a deferred break, queue-tail
rejoining, reload persistence and legacy restoration, fixed-pair eligibility and
Court Climb pausing. Reuses planPlayAvailability and splitFinishedPlayers from
saved-game availability. Coverage: quick-play-session.test.ts,
public-quick-play.test.tsx and the Quick Play smoke scenario (browser suite not
executed). End session uses the shared secondary action pattern with truthful
local-recap copy. Validation results are recorded in the PR.

## Up next review (2026-09-20)

J08 and device-local Quick Play: Courts shows one upcoming rotation beneath the
scoreboards. Paddle Stack previews teams when four waiting players rotate in;
result-dependent lineups name waiting players without guessing winners or a
court. Synchronized modes wait for every court. Once ready, the preview and Start use the same planner. Fixed partners,
breaks, closed courts and completed round robins remain respected. Saved-game
starts reject a changed lineup under the session lock and refresh both access
paths; read-only viewers cannot start matches.

Coverage added: `next-rotation.test.ts`, `create-queue-match.test.ts`,
`quick-play-session.test.ts`, `public-quick-play.test.tsx`,
`session-play.test.tsx`, and Quick Play/shared Play assertions in
`e2e/smoke.spec.ts`. Local Quick Play was manually exercised with eight players
and one court: preview, finish, and start the displayed lineup. Light/dark
layouts were inspected at 390px and 1440px. Saved-game browser flow and the
automated browser suite remain unrun. Final pre-commit validation on 2026-09-21: `pnpm check:full` passed formatting,
TypeScript, all 2,590 unit tests across 360 files, and the production build.
CI must pass on the PR head before merge.


## Quick Play repeat-session improvements (2026-09-21)

- Setup accepts newline-separated names without losing existing named players; duplicates, oversized names and the 24-player cap are explicit errors.
- Mixed-partner Paddle Stack permits late arrivals at the end of the queue while preserving active scores and history. Fixed pairs and scheduled formats retain their roster constraints.
- Queue exposes rotation rules on mobile. Courts puts actionable Up next before scoreboards and uses two columns for multiple courts on wide screens.
- Play again with these players seeds a reviewable setup with the roster/settings. Both replay and confirmed blank setup preserve one previous read-only recap locally, and stop if preserving it fails. No account migration or cross-device sharing is implied.
- Coverage: quick-play-draft.test.ts, quick-play-session.test.ts, public-quick-play.test.tsx and the roster/replay journey in e2e/smoke.spec.ts. Coverage authored; validation deferred to pre-commit. E2E execution remains opt-in.

Quick Play roster entry: Enter advances to the next name, ignores IME composition, and validates the final name before opening options. Component regression: `src/features/matches/public-quick-play.test.tsx`. Existing Quick Play browser scenarios use the explicit Choose game options action. Manual local browser review covered the ten-player roster, sticky actions and recap header layout. Component coverage includes the recap header round trip. Full automated E2E execution remains opt-in.

Players drawer refinement: Quick Play and saved/shared live Play use compact headers, outside-click dismissal, right-side entry on desktop and mobile with a bounded width and reduced-motion fades. `src/components/ui/dialog.test.tsx` covers backdrop versus inside/drag interactions; `e2e/smoke.spec.ts` covers dismissal, focus restoration and compact title sizing. Existing roster tests retain URL/input/score preservation coverage. Execution deferred.

Navigation status and clarity follow-up: A04 has shared sidebar/mobile Agent working, unread completion and error indicators, acknowledged on return and cleared on sign-out (`runtime.test.tsx`, synthetic `agent-chat.spec.ts`). Courts uses a visible List View / Map View menu label (`court-finder.test.tsx`, existing court-finder smoke scenario). Notification dates and chevrons center vertically with the mark-read action (`notification-feed.test.tsx`). Coverage updated; execution deferred to pre-commit.

Court Finder location action now leads the existing scrollable filter row, retains its visible label on mobile, and shows its active nearest-first state. Existing distance-sorting coverage also checks placement and toggling off (`court-finder.test.tsx`); validation deferred to pre-commit.

2026-09-23 pre-commit verification for Agent continuity and UI polish: repository lint and strict types passed; all 2,628 unit tests across 364 files passed; the production build passed after retrying outside the restricted sandbox. Earlier deferred notes above describe implementation-stage status. Updated browser scenarios remain unrun, and authenticated live-provider navigation remains unverified.
