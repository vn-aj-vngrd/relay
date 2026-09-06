# Game mobile responsiveness — implementation audit

## Scope and evidence

This pass expanded from Story to Overview, Players, Play/Recap, Chat, Payments, shared/authenticated game chrome, loading states, three Story themes, and failed device-photo exports. Relay’s existing design and role/lifecycle rules remain authoritative. No authorization, scoring, payment, roster, or factual-focus rules changed.

Source inspection covers both `/games/[id]` and `/s/[slug]` routes and their shared components. Browser evidence uses only synthetic, device-local Quick Play data and isolated export primitives under the real `/play` CSP. It is **not** a signed-in or shared-game browser audit. No disposable account or shared test session was provided; the reported live Chat appearance could not be reproduced directly.

## Findings and corrections

| Priority | Surface / source cause | Correction and evidence |
| --- | --- | --- |
| P1 | Story: width-only 280px portrait preceded every action; one disclosure exposed the entire desktop form. Expanded portrait combined fixed height, width clamp, and flex shrink. | Viewport-bounded width-only 9:16 wrappers, short-landscape adjacency, nonshrinking expanded media with scroll fallback, exports before customization, and Layout/Background/Message progressive tools. Shared skeleton follows the same geometry. Source + component tests; full workspace browser coverage pending. |
| P1 | Device-photo export: `drawPhoto` fetched its `blob:` preview URL. CSP allows `blob:` in `img-src`, not `connect-src`. | Reproduced `TypeError: Failed to fetch` on a synthetic PNG under actual CSP; direct Blob decode succeeded. Retain the original local File and pass it directly to `createImageBitmap`; URL remains preview-only. Validate decoding before replacing a working photo, guard out-of-order selections, close bitmaps, and retain remote session-photo fetching. No upload or CSP relaxation. Real browser tests export all three themes both with and without a synthetic photo at 1080 × 1920. |
| P1 | Score controls: global mobile `button:not(.compact-control)` minimum-height overrides Tailwind 64/80px score zones to 44px. Fullscreen shell clipped short-view content. | Exempt only score buttons through the existing control opt-out, retaining explicit 64/80px sizes. Fullscreen scoreboard scrolls when necessary, respects safe areas, wraps long names, and fits narrow portrait score numerals. Browser viewport assertions verify score targets ≥64px and reachable Finish controls. |
| P2 | Game chrome / Chat live status: negative top margins plus enlarged percentage heights compensated for shell padding; status sat outside sticky navigation with doubled gutters and truncated its useful label. | Remove height/margin compensation, give mobile game content explicit zero top padding, keep status inside persistent shrink-resistant chrome, wrap status, and expose a mobile direction affordance. Chat content retains `min-h-0` remaining-space ownership. Source and frame regression; real authenticated live Chat remains unverified. |
| P2 | Chat: message flex descendants could retain intrinsic width for long unbroken text/photo rows; composer used 15px text on phones. | Shrinkable message descendants, anywhere wrapping for message bodies, bounded attachment filename/removal control, visible attachment keyboard focus, and 16px phone composer text. Existing thread-only scroll, safe-area ownership, and privacy retained. |
| P2 | Overview / Players / Payments: unbroken venue names, notes, waitlist/player names and payment details; fixed min-width payment review subtree; crowded tablet guest-entry form. | Targeted wrapping/min-width fixes on both access paths, shrinkable payment grid and proof-review content, wrapping payment header, and defer the three-column guest form until desktop. No capability changes. Source inspected. |
| P2 | Play / Recap tables and loading: live standings let names determine all column widths; completed standings scroller was not keyboard-focusable; public Chat replaced static titles with skeletons. | Fixed live standings column allocation with wrapping names, labeled focusable completed standings scroller, real public Chat loading title/description, bounded auth Chat skeleton, synchronized payment/story skeletons. Source inspected. |

Global mobile navigation intentionally does not render on game routes (`AppNav`); the existing game safe-bottom policy was retained rather than adding a second fixed action bar. Story introduces no fixed composer/toolbar overlay. Public Chat keeps its existing dynamic-viewport conversation region. Native mobile keyboard/notch behavior still requires device testing.

## Three Story themes

Exactly three structural visual treatments are available in the existing Layout customization panel:

- **Minimal** — default; no decoration calls, existing appearance/export retained.
- **Scrapbook** — paper-colored photo frame, small paper-grain marks, and tape details.
- **Coquette** — blush frame, delicate bow, and scalloped lace edging.

Names and pressed states are visible and accessible. Existing palettes, photos, crop, contrast, layouts, focuses, headline and personal line remain available. Both HTML previews and the PNG renderer consume the same 1080 × 1920 motif paths; adornments stay in the outside margins. No downloaded assets, dependencies, or decorative changes to app chrome.

## Viewport / state matrix

| Surface | 320 × 568 | 390 × 844 | 667 × 375 | 1440 × 900 |
| --- | --- | --- | --- | --- |
| Shared scoreboard via synthetic Quick Play | Browser assertions passed | Browser assertions + settled screenshot inspected | Browser assertions + screenshot inspected | Browser assertions passed |
| Score targets / Finish reachability / page width | Passed | Passed | Passed | Passed |
| Auth/shared game tabs and live Chat | Source only | Source only | Source only | Source only |
| Full Story workspace and theme aesthetics | Source/component tests only | Source/component tests only | Source/component tests only | Source/component tests only |

Browser export tests pass in mobile and desktop Chromium under enforced CSP, exercising the real photo/theme modules. They are not an end-to-end authenticated Story route test. Existing smoke tests cover public light/dark accessibility, protected-route redirects, Quick Play scoring, and public navigation. No Safari/Firefox, real-device keyboard, authenticated guest/player/host matrix, or real private photo was exercised.

## Validation receipts

- `pnpm check:full` — passed: Ultracite, strict TypeScript, **188 files / 716 tests**, production build. Initial added-test typing failures were corrected.
- `pnpm test:e2e --workers=2` — **25 passed, 3 skipped**. Skips: mobile auth mutation intentionally omitted, desktop authenticated workflow lacks disposable credentials, desktop copy of mobile-only layout test.
- Initial E2E run exposed an existing ambiguous `Open games` heading locator when the empty-state heading also matched. Scoped it to the exact destination heading; full E2E rerun passed.
- Focused component tests cover progressive customization, retained personal copy/focus restoration, swipe direction/cancellation, expanded keyboard navigation, selected theme/default, custom-photo decode failure, local-file export, and 1080 × 1920 output settings.
- Browser regression covers the actual CSP blob-fetch failure and successful direct-File/photo+theme PNG output; unit tests cover crop math, unavailable remote photos, and bitmap cleanup.
- Source diff inspected. Existing local server on port 3002 was reused and left running; this pass started no server. Its isolated agent-browser session was closed. No real game, invite, payment, upload, commit, or push was made.

## Remaining / review boundaries

1. Authenticated/shared route screenshots, live Chat reproduction, mobile keyboard/safe-area testing and full Story visual theme review remain necessary before claiming comprehensive device verification.
2. **Pre-existing full-renderer divergence is not fixed:** HTML `RecapStoryCard` uses responsive content flow, while canvas `createCard` uses independent coordinates/font sizes and includes a footer absent from HTML. For example, HTML snapshot is a content-fitting panel whereas canvas snapshot is a fixed rectangle at `(48, 820, 984, 1020)`. Theme paths and selected settings agree, but pixel-exact full-artifact preview/export parity cannot be claimed. A renderer consolidation was explicitly excluded from this bounded pass.
3. No publication yet: implementation awaits parent read-only review and authorized normal commit/push. Existing unpushed commit `73c06a9` must remain in history. The previously reported remote 403 is not bypassed by this work.

## Reviewer P1 follow-up — expanded Story on short phones

The reviewer found that the expanded portrait's remaining-height calculation reduced it to approximately 67 × 119px at 667 × 375, smaller than the thumbnail and too narrow for the existing standings typography. This was an introduced defect, not the separate pre-existing HTML/canvas renderer divergence.

- **Minimal production correction:** `.expandedPortrait` now uses `width: min(100%, 26.875rem)`. The card still owns its 9:16 ratio; the existing nonshrinking expanded container scrolls vertically instead of compressing the artifact. No renderer, thumbnail, export dimension, control, theme, or other tab behavior changed.
- **New rendered-content regression:** `e2e/story-preview.spec.ts` reuses the existing landing page's real `RecapStoryCard` standings example with synthetic data and the actual workspace stylesheet inside a media-dialog-sized native fixture. It removes only the marketing card's width/rotation treatment. Assertions cover 430px portrait width at 667 × 375, 280px width at 320 × 568, 9:16 ratio, all four standings rows contained inside the card, unclipped player labels, vertical scrolling, reachable Download control, no horizontal document overflow, and Escape dismissal.
- **Red/green evidence:** Before the CSS correction the new browser regression failed on the undersized portrait at both sizes (approximately 67px and 175px widths). After correction all cases pass in mobile and desktop Chromium. Fixture setup issues (Node Next-module imports and marketing CSS rotation) were resolved before recording the final result.
- **Affected validation:** `pnpm check:fast` passed (33 supported changed files); `pnpm typecheck` passed; `pnpm exec playwright test e2e/story-preview.spec.ts e2e/story-export.spec.ts --workers=2` passed **6 tests, 0 skips, 0 failures**. Receipts: `/tmp/relay-story-p1-fast.log`, `/tmp/relay-story-p1-types.log`, `/tmp/relay-story-p1-e2e.log`.
- **Coverage boundary:** This is a browser test of actual Story standings content and layout CSS, not a numeric-only CSS calculation. The native fixture reproduces the expanded wrapper rather than the authenticated editor's open/customization wiring; full real-game Story/Chat and device coverage remain outstanding. The earlier full gate (716 tests/build) and full E2E run (25 passed/3 skipped) predate this narrow correction and were not unnecessarily repeated.

Only the Story width rule, the new focused browser test, and this audit changed during the P1 follow-up. No commit/push, server restart/shutdown, or other implementation expansion occurred.
