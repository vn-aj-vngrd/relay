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
| J13 | Host/player previews and downloads Story | Lifecycle facts match the game; singular/plural text is correct; export produces a usable image; failures offer recovery. | Prior host/guest light/dark inspection, actual 1080×1920 PNG, 343 Story layout tests. Actual mobile OS download/share remains manual. |
| J14 | User signs in or returns from a shared link | Public entry is usable; protected routes reject signed-out users; guest-to-account handoff preserves the response and destination. | Entry and protected-route browser tests; auth and destination unit coverage. Actual signup, CAPTCHA, SMTP and guest-account claim are not browser-verified. |

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

Overview, Play, Chat, Payments and Story share one tab-to-content inset on authenticated and shared routes, including loading states. `src/features/sessions/game-tab-spacing.test.ts` guards spacing ownership; `play-roster-surface.test.tsx` covers roster lifecycle behavior. This source/component coverage is not a rendered browser geometry check.
