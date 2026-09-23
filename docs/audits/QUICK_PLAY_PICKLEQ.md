# Quick Play audit: competing with PickleQ

Date: 2026-09-21. Base: `origin/master` at `a6a776d`. Branch: `van/quick-play-pickleq-audit`.

## Recommendation

Make Relay the easiest way for a small group to start, understand its rotation, and play together again. Preserve its clear scoreboards and calm visual system. Prioritize roster flexibility, visible rotation rules, and repeat-session continuity before adding more formats or decoration.

PickleQ already documents saved rosters, late arrivals, live player views, queue estimates, staged matches, recovery controls, and shared results. “Up next” and a recap alone are not differentiation. See [competitor research](../research/pickleq-competitor-research.md) and its [official guide](https://pickleq.app/how-to-use.html).

This is an audit and proposed direction, not a redesign implementation or evidence that Relay retains users better.

## Evidence and limits

- Clean checkout branched from freshly fetched `origin/master`; this repository has no `main` branch. No application code changed, committed, or published.
- Inspected the actual signed-out local `/play` live session: Courts, Queue, Manage, Players drawer, and Escape dismissal/focus return. Preserved its existing roster, scores, and session.
- Inspected narrow and wide light-mode layouts. Requested viewport sizes were 390 × 844 and 1440 × 1000; browser scaling affected effective CSS dimensions (the wide DOM reported 1309px). These are responsive observations, not exact 390px/1440px certification.
- Wide live view reported one `h1` and no document-width overflow. No full keyboard, screen-reader, contrast, dark-mode, text-zoom, or performance certification.
- Reviewed setup, live state, storage, rotation planning, recap/reset, shared components, and nearby tests in source. Setup, match completion, populated queue, and recap were not newly exercised end to end. An alternate loopback origin stayed at “Restoring Quick Play”; no product root cause was established. A separate Chrome session could not initialize. Existing localhost data was not cleared to obtain a blank state.
- Opened PickleQ’s live public homepage and official setup/live-courts tour images. Those images are illustrative published UI, not an exercised session. Automatic approval review blocked “Start free” because it could initialize an external session. No competitor account/session created.
- Scoped Impeccable detector returned `[]` for `public-quick-play.tsx`, `quick-play-players.tsx`, `up-next.tsx`, and `court-scoreboard.tsx`. This does not prove accessibility or product quality.
- Validation deferred to pre-commit. Lint, typecheck, unit suite, build, and automated E2E were not run.

## Competitive comparison

| User need | Relay evidence | PickleQ evidence | Implication |
| --- | --- | --- | --- |
| Start without signing up | Public `/play`; three setup steps in source | Homepage advertises no signup; tour shows guided setup | Both offer low-friction entry; measure actual setup effort |
| Enter a group quickly | Four initial individual name fields; Add player up to 24; no bulk entry | Guide documents saved players and roster import | Reduce repetitive typing |
| Handle arrivals mid-session | Live drawer only changes existing players’ availability | Guide documents walk-ins and late arrivals | Material functional gap for spontaneous play |
| Understand who plays next | Existing shared `UpNext`, queue ordering, result-dependent preview | Official live tour puts queue and staged matches alongside courts | Improve visibility; do not rebuild an existing feature |
| Understand fairness | Rotation rules exist but live rules panel is desktop-only | Guide describes queue position, games played, wait estimates | Show reasons and participation before promising precise waits |
| See personal status remotely | Quick Play is device-local; saved games have shared surfaces | Connected-club player live view documented | Requires a real sharing/data boundary, not a cosmetic QR button |
| Score courtside | Large two-sided scoreboards; labeled score controls | Tour emphasizes compact courts and winner buttons | Relay has a strong scorekeeping identity; do not sacrifice it for density |
| Come back with the same crew | Starting again clears the saved session and draft | Guide documents retained roster/settings and result sharing | Build an explicit reuse path |
| Operate offline | Browser storage persists state; service worker has offline fallback | Homepage advertises offline operation | Local storage is not proof of offline reload; verify separately |

PickleQ’s live tour also displays optional kiosk auto-send. Do not generalize manual organizer dispatch to every PickleQ mode. No comparative claim about algorithm quality, speed, adoption, or retention is established.

## Prioritized findings

Severity here describes user impact within the intended small-group/open-play use case. Feature opportunities are explicitly distinguished from defects. No P0 was established. Four P1 product gaps and three P2 UX opportunities follow.

### P1 — The live roster cannot accommodate a new arrival

**Category:** Implementation integrity / product capability. **Evidence:** `src/features/matches/quick-play-players.tsx:79` and the observed drawer say names stay fixed. The live component offers break/rejoin only; setup owns Add player. `quick-play-session.ts` has availability mutation but no live add-player operation.

**Impact:** A friend arriving after the first match cannot join this Quick Play through its normal UI. Restarting breaks continuity. This is a product limitation, not a regression claim.

**Recommendation:** Extend the existing Players drawer with Add player and safe name correction using stable player IDs. Append a new arrival to the eligible queue; do not disturb active matches/history. Start with Paddle Stack; explicitly define fixed-pair and scheduled-format behavior before expanding. Preserve break-after-match semantics.

**Acceptance:** With eight players already playing/waiting, a ninth joins without restarting; existing scores and assignments remain intact; a name correction updates display without changing identity. Command: `$impeccable harden` after behavior is specified.

### P1 — Starting again discards the work that should make returning easier

**Category:** Implementation integrity / retention opportunity. **Evidence:** `public-quick-play.tsx:1123` confirms recap replacement; `:1249` offers Start new session; `:1639` clears the setup draft and session. Initial setup returns to four blank players.

**Impact:** “Play again” requires rebuilding the group and gives up the previous local recap. Confirmation prevents surprise but does not solve repeat-use friction.

**Recommendation:** Offer “Play again with these players” with a reviewable roster/settings draft, distinct from “New group.” Preserve/export the last recap before replacement. Treat any “Save to Relay” import as a separately designed authenticated flow with ownership, duplicate handling, and clear migration semantics; do not imply signup already saves Quick Play.

**Acceptance:** Start another game with the same group without retyping names; prior results remain accessible according to an explicit retention rule. Command: `$impeccable shape`.

### P1 — Mobile users lose the explanation of the rotation

**Category:** Responsive design / comprehension. **Evidence:** `public-quick-play.tsx:1445` renders Active rotation rules with `hidden ... lg:block`; the observed phone Queue has no rule explanation. Default setup is adaptive Paddle Stack; `rotation.ts:77` explains that winners stay with a short queue and all four rotate with a busy queue.

**Impact:** A changing rotation can look arbitrary when its rule is invisible on the device used courtside. Queue position alone does not explain every format or fixed-pair eligibility.

**Recommendation:** Show a compact selected-rule summary on phones with an optional explanation. Reuse `rotationDescription`. Add factual played counts or a clear eligibility reason where useful; distinguish manual reorder from ordinary order. Do not claim “perfectly fair” or show invented minute estimates.

**Acceptance:** A player can find the current rotation rule on mobile and understand why a preview depends on the current result. Command: `$impeccable clarify`.

### P1 — Quick Play’s value cannot become a shared or saved game

**Category:** Product capability / retention opportunity. **Evidence:** `public-quick-play.tsx:998` explicitly says it cannot be shared or moved into account history. The reviewed recap offers local restart, not save/share. This is an intentional current boundary, not a storage bug.

**Impact:** The moment a group wants its results or other players want to follow along, the session stops short of Relay’s “one shared game” promise. A generic Create game link is not a conversion of existing work.

**Recommendation:** First design a factual local recap export reusing existing recap/Story rendering where appropriate. Separately plan an opt-in saved-game transition that preserves roster/results. Remote player view belongs to that durable shared model and its existing permission boundaries.

**Acceptance:** Users know exactly what stays local, what is saved, and who can see a shared result. No data is published just by entering Quick Play. Command: `$impeccable shape`.

### P2 — Group entry is repetitive before the first reward

**Category:** Setup UX. **Evidence:** `public-quick-play.tsx:575` renders one input per player and a separate Add player action. Five formats are displayed in step two (`:706`); additional partner/rotation options follow. Setup source was inspected; no timed baseline was measured.

**Impact:** Larger groups require repeated field additions and name entry, then configuration before seeing a court.

**Recommendation:** Add “Paste names” with a reviewable parsed roster and duplicate/empty-name feedback; retain individual editing. Recommend one existing mode for the stated use case and place less-common formats behind “Other formats.” Keep Review as the final deliberate start boundary. Remember the last valid choices for returning groups.

**Acceptance:** Twelve newline-separated names can be reviewed and corrected in one entry action; chosen courts/mode and storage scope remain visible before Start Play. Test first-session speed rather than promise an unmeasured time. Command: `$impeccable onboard`.

### P2 — Up next sits after every full scoreboard

**Category:** Responsive design / information hierarchy. **Evidence:** `public-quick-play.tsx:1300` uses a single-column court grid at all widths, then renders `UpNext` after it. One-court desktop and mobile were observed; multi-court impact is source-derived. PickleQ’s official desktop tour shows two compact courts side by side with queue/staging nearby.

**Impact:** With several courts, a host must travel through scoreboards to find the next assignment. A player looking for their turn competes with scorekeeping for screen space.

**Recommendation:** Preserve full scoreboards for scoring; offer compact court summaries for multi-court overview and put Up next near the active task. On wide layouts consider courts plus a queue/next column. On phones use a compact next-match summary that does not obscure controls or the keyboard. Avoid adding a competing primary action or duplicating all queue rows.

**Acceptance:** In a two-court/eight-plus-player scenario, the next eligible lineup and its start action are easy to locate without scrolling through every scoreboard. Command: `$impeccable layout`.

### P2 — The organizer must remain the information desk

**Category:** Player UX / future shared capability. **Evidence:** Quick Play’s queue is an organizer-operated local list; no cross-device identity or player live link. Source review shows player names/order but no personal lookup or played count on queue rows. PickleQ’s guide documents a connected player view.

**Impact:** Waiting players depend on the host’s phone or verbal announcements. This overlaps with the save/share boundary; it is not a reason to bolt a second backend onto Quick Play.

**Recommendation:** Make the local queue more glanceable now; reuse saved-game participant state/capabilities for a future shared “Find my name” view. A local selection must not claim authenticated identity. Separate tentative “Get ready” from committed “On Court 2.”

**Acceptance:** In a usability study, players can identify their status and next action without asking the host. Any five-second target is a proposed study criterion, not a measured result. Command: `$impeccable clarify`.

## Keep and reuse

- `CourtScoreboardCourt`: real court geometry, prominent scores, labeled actions, explicit Finish match. The observed mobile view is legible and restrained.
- `PlaySectionTabs` / `TabChipRail`: shared compact navigation and selected-state feedback. Do not flag 36px standard buttons as an automatic violation of Relay’s deliberate size convention; assess actual target spacing and applicable criteria.
- `QuickPlayAvailability`: same status vocabulary in Players and Manage; occupied players finish before resting. Observed Escape closes the drawer and returns focus to Players.
- `planNextRotation` / `UpNext`: shared preview/start logic, honest result-dependent messages. “Add Up next” is already done on the audited base.
- `RecapOverview`, `RecapHighlights`, `SessionStandings`, and score correction: extend these rather than invent a separate Quick Play results system.
- `WizardProgress`, field-linked validation, duplicate-name checks, persisted drafts, storage warnings, and destructive-action confirmation: preserve these safeguards while shortening routine work.

## Technical audit health

| Dimension | Provisional assessment | Evidence limit |
| --- | --- | --- |
| Accessibility | 3/4 within inspected controls | Labeled buttons, headings and drawer focus observed; full AA audit not performed |
| Performance | Not scored | No timing, bundle or large-session profiling performed |
| Theming | Not scored | Light mode inspected; dark mode/contrast not measured |
| Responsive design | 2/4 provisional | Mobile rule omission verified; multi-court hierarchy concern source-derived |
| Implementation integrity | 3/4 provisional | Coherent shared components; scoped detector clean; product gaps above |

No overall /20 score is given because two dimensions were not measured. The inspected visual system passes the product-specific/coherence review; that is not a release approval. No confirmed performance or contrast defect is being invented to fill the scorecard.

## Proposed delivery order

1. **Faster first session:** paste names, recommended existing format, concise mobile rules. Preserve the three-step safety/review structure unless a measured test supports changing it.
2. **Better live session:** late arrivals for Paddle Stack, identity-safe name correction, next-lineup hierarchy. Define format constraints and regression cases first.
3. **Reason to return:** reuse crew/settings, preserve/export recap, then explicitly designed saved-game conversion and participant view.

Avoid new play modes, streaks, forced signup, notification pressure, fabricated wait estimates, and venue administration in the first iteration. “Hooked” should mean users trust the rotation and avoid repeated work.

Suggested design sequence: `$impeccable shape` → `$impeccable onboard` / `$impeccable clarify` → `$impeccable layout` / `$impeccable harden` → `$impeccable polish`. These can be scoped separately. Re-audit the implemented flow afterward.

## How to establish that it is better

Use the same 12-player, two-court task for both products, with one late arrival, one break/rejoin, one mistaken result, and a second session with the same group. Record first-court setup time, organizer actions per transition, recovery success, player questions, and repeat-session setup effort. Distinguish measured outcomes from participant preference. Recruit ordinary hosts/players rather than relying only on developer judgment.

For retention, establish a baseline before choosing targets: first-session completion, same-device repeat Quick Play use, saved-game adoption if implemented, and voluntary group reuse. Device-local repeat use is not a known unique-person retention rate. No current research supports a numerical uplift claim.

Before implementation, consult `docs/HELP_CENTER_MAINTENANCE.md` and map each behavior change to `docs/CRITICAL_USER_JOURNEYS.md`. Extend `public-quick-play.test.tsx`, `quick-play-session.test.ts`, `quick-play-draft.test.ts`, `next-rotation.test.ts`, and the existing Quick Play scenarios in `e2e/smoke.spec.ts` as relevant. Include duplicate pasted names, no eligible complete pair, late arrivals, recap preservation, storage failure, and result-dependent preview changes. Run the full required gate before an authorized commit; E2E execution remains opt-in.


## Local implementation for review — 2026-09-21

Implemented on the audit branch, uncommitted: newline roster entry with duplicate/limit errors; recommended Paddle Stack label; late arrivals for mixed-partner Paddle Stack; mobile rotation-rule visibility; actionable Up next before courts (empty states below); two-column multi-court desktop layout; replay with the same crew/settings; and one read-only previous recap retained locally with storage-failure protection. Both replay and blank restart confirm replacement of an older previous recap.

Reused existing wizard, buttons, drawer, rotation planner, UpNext, scoreboard, standings and recap components. Help Center, journey/parity notes, unit/component coverage and an E2E scenario were updated. This remains device-local. Name correction, local recap export, account conversion and a cross-device player view remain future work.

Rendered inspection covered the existing live session and mobile Players form without changing the user's roster/scores. New setup/replay transitions have authored coverage but were not executed. Validation deferred to pre-commit; no lint, typecheck, unit-suite, build or automated E2E result is claimed.


## Pre-commit validation — 2026-09-21

Lint and strict TypeScript passed. The full unit suite ran 360 files / 2,598 tests: 2,596 passed initially. Added the missing noValidate attribute required by the form-policy test; that test and an unrelated five-second release-script timeout passed on focused rerun (2/2). No test was skipped or weakened.

The standard local production build was blocked by Google Font network access and Turbopack worker-port restrictions. A webpack production build passed using the actual Google CSS/font files cached outside the repository through Next's font-response override; no font/configuration change is included. Standard uncached Turbopack CI must pass before merge. Automated E2E remains unrun.
