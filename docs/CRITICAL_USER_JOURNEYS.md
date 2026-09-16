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
| A01 — Ask Agent about games, rosters, groups or Help Center | Authenticated active account; only authorized data; streaming answer with source links; no writes; cancellation and safe recovery | Agent request/read/tool/route/help unit regressions; synthetic responsive chat scenario in `e2e/agent-chat.spec.ts`. All execution deferred; live provider and cross-account database exercise unverified. |
| A02 — Configure Agent as administrator | MFA-protected admin action; encrypted write-only credentials; audited changes; creation capabilities default off; server validates enabled capabilities and explicit approval | Agent credential/action regressions. Validation deferred; migration, admin browser/MFA journey and live provider setup unverified. |
| A03 — Consume a monthly Agent allowance | Free/Plus/Pro defaults 50/250/750; configured limits match pricing; reservations prevent overspending; failed-before-text responses release; upgrade preserves usage; correct reset dates | Agent allowance/reservation/stream regressions and shared pricing/showcase tests added. Execution deferred; real concurrent PostgreSQL and provider-failure tests remain unverified. |
| A04 — Continue an Agent conversation | In-app navigation preserves messages and draft; new chat starts a separate conversation; refresh restores the selected saved chat; owner-only rename/delete; account changes isolate state; Markdown renders without HTML or unsafe links | Agent history/auth/stream, session and answer unit regressions; synthetic Agent navigation fixture. Execution deferred. |
| A05 — Ask Agent about courts | Verified Relay directory only; named-place search; manual city/neighborhood follow-up; no device-location access; admin toggle removes capability; no booking | Court/tool/manual-location/action regressions added; execution deferred. |
| A06 — Interactive Agent creation and approval | + and / open composer-width question popovers; tabs and Back/Next retain answers; Answer in chat collects one missing detail per reply; both modes preserve answers; review discloses effects; only explicit approval creates; edits invalidate old approval IDs | Creation question, mode-switch, preparation, wizard, route and confirmation regressions; synthetic desktop/mobile Agent fixture. Execution deferred; real database concurrency and live provider handoff unverified. |
