# Relay Design System

## Design thesis

Relay should feel like checking a beautifully made sports instrument: immediate, precise, and calm until play becomes live. Light mode is the deliberate default for bright venues and daytime planning; dark mode is an explicit, persistent user choice. The visual world combines **hard-court geometry** with **Apple-like product discipline**—native-feeling typography, strong hierarchy, polished materials, and controls that behave exactly as expected.

Linear is the current product-UI baseline for hierarchy, density, alignment, icons, theme discipline, and component behavior; see `docs/LINEAR_UI_REFERENCE.md`. It is a temporary foundation, not Relay’s final identity. Apple remains a quality reference for platform-native behavior and careful state feedback.

## Physical scene

Players stand under bright court lights and share one phone between rallies. The interface must read in glare, from several feet away, with one hand, while people are moving. Planning surfaces stay quiet; courts, scores, and the queue become visually forceful.

## Signature

**The digital court.** Session heroes and match surfaces use a deep blue-black field, crisp white divisions, court-blue action areas, tabular scores, and a single optic-yellow signal. The geometry encodes actual structure—sides, courts, queue order, and live state. It is never a decorative pattern.

The Relay mark is one irreducible game ball: an optic yellow-green circle with a restrained inset edge that gives it physical presence at small sizes. It remains freestanding—no holes, border, enclosing tile, decorative background, miniature court, paddle, or motion effect. The same mark is used across themes and browser/app icons; the full mark-plus-wordmark lockup is preferred whenever space allows.

## Color strategy

Restrained foundation with a stronger courtside state. Court blue occupies less than 10% of planning surfaces and expands only in session identity, selected state, and active Play.

```css
/* Light */
--canvas: oklch(0.965 0.002 75);
--surface: oklch(0.992 0.001 75);
--surface-raised: oklch(0.935 0.003 75);
--ink: oklch(0.22 0.008 275);
--muted: oklch(0.48 0.012 275);
--line: oklch(0.875 0.005 75);

--primary: oklch(0.55 0.18 275); /* accessible court-blue action */
--primary-hover: oklch(0.5 0.18 275);
--primary-soft: oklch(0.93 0.04 275);
--court: oklch(0.18 0.045 252); /* scoreboard/court field */
--court-line: oklch(0.84 0.095 220);
--signal: oklch(0.89 0.18 105); /* optic ball; sparse */
--live: oklch(0.64 0.2 32);

--success: oklch(0.52 0.14 150);
--warning: oklch(0.69 0.15 78);
--danger: oklch(0.56 0.2 26);
```

Dark mode uses neutral blue-black architecture rather than inverting light colors. The app never follows the operating-system theme implicitly: it starts light, exposes a labeled toggle, and stores the user’s choice. Court blue becomes lighter but not fluorescent. `signal` is reserved for queue readiness, match point, and compact live indicators; it never becomes a general CTA color.

### Color rules

- Primary blue: the one main action, current navigation, links, selected RSVP, score focus.
- Court field: session identity and active matches only.
- Optic signal: one small cue in a viewport, never a large surface.
- Live coral: live/broadcast state and destructive urgency.
- Status always includes text or an icon; color never carries meaning alone.
- Body copy maintains WCAG AA; primary body text targets 7:1.

### Game color

A host may choose one game color from the curated palette in `src/features/sessions/accent.ts`. It scopes the authenticated game workspace and public invite only; global Relay navigation and semantic status colors remain unchanged. The selection tints the deep court cover, active tabs, primary actions, and compact session markers across Home, Games, Search, and profiles while preserving white cover-text contrast. Soft fills mix into the current surface. Unknown stored values fall back to violet.

## Typography

Relay currently uses Inter across product UI to match the Linear baseline. Geist Mono is reserved for scores, times, currency, queue numbers, and standings.

- Page title: 30/36 mobile, 36/42 desktop, 720 weight, `-0.025em` tracking.
- Session title: 28/34 mobile, 36/42 desktop, 720 weight.
- Section title: 18/24, 680 weight.
- Body: 15–16/24.
- Utility: 13–14/18.
- Data/score: Geist Mono with tabular numerals; large scores use tighter `-0.045em` tracking.
- Headings balance; prose wraps prettily and stays below 70ch.
- Avoid all-caps except court labels, dates, and live scoreboard utilities where the compact scan pattern is functional.

## Materials and elevation

- The shell uses a crisp warm-gray canvas while the work area sits on a near-white foreground panel. Hierarchy comes from typography, spacing, and sparse neutral fills.
- Introductory and authentication surfaces remain white; sport character comes from court geometry, the optic ball, and precise blue actions rather than large dark marketing panels.
- Navigation chrome may use `backdrop-filter` because it floats above scrolling content. Content cards never use blur.
- Elevation is expressed by surface contrast, a 1px keyline, and at most an 8px blur shadow for floating chrome.
- No gradient fills, glow, glass cards, border-plus-wide-shadow cards, or decorative transparency.

## Shape

- Controls: 8–10px radius.
- Discrete session/match objects: 14–16px radius.
- Compact identity/status: full circle or pill only when its semantics justify the shape.
- Inputs are 48px high. Standard buttons are a compact 36px, large actions are 40px, and courtside score controls remain 64px.
- Use rows, dividers, and whitespace before cards. Nested cards are not allowed.

## Layout

- Mobile: 16px page gutter, edge-to-edge data sections, safe-area bottom navigation. Public invites show the plan before the RSVP form so people understand the game before responding.
- Desktop: a quiet 240px left rail keeps primary actions in a stable, familiar position; content uses the remaining space for overview/roster and courts/queue compositions. A top-rail control collapses it to a persistent 64px icon dock for focused work. The compact dock keeps Relay’s ball visible; hovering or keyboard-focusing that header swaps the mark for the expand control, avoiding a permanently generic utility icon. Compact navigation icons retain labels through accessible names and restrained hover/focus tooltips; the content island expands into the released space.
- Every authenticated player destination uses the same centered 896px content canvas. Home, Games, Groups, Search, Create, Notifications, Help Center, profiles, and game tabs share the same outer edges. Forms, prose, filters, and empty messages may be narrower inside that canvas for usability, but breadcrumbs, page headings, primary content sections, and loading states never shift to a different page width. Admin Console uses a wider 1152px operational canvas so user, game, and audit tables fit without desktop horizontal scrolling; its headings and loading states still align to that canvas.
- Authenticated shells stay fixed to the dynamic viewport. The content surface is the sole vertical scroll container, keeping the desktop rail and mobile chrome stable without locking nested feature scroll areas such as chat. Visible scrollbars use one narrow neutral trackless treatment across themes; horizontal tab rails remain visually hidden.
- Mobile: a compact bottom tab bar uses an opaque surface inside the safe area and preserves 44px touch targets without letting scrolling content show through or reducing label contrast.
- Navigation chrome may float and blur; content remains opaque and structurally flat.
- Vertical rhythm uses 8, 12, 16, 24, 32, 48, and 64px steps.
- Desktop never stretches mobile cards; it introduces useful adjacency.

## Session surfaces

The shared game link and authenticated session workspace are two access paths to the same session, not separate products. They use one canonical Overview, Players, Play, Chat, and Payments navigation; the same session hero; and the same session vocabulary. Shared information keeps the same order and labels on both surfaces. Guest RSVP, personal actions, and host management are contextual additions—not alternate page structures.

- Overview: the at-a-glance session home—plan, roster and waitlist state, current play, payment state, and the viewer’s next useful action.
- Play: the courtside workspace for assignments, paddle stack, rotations, scores, and session standings.
- Shared game link: optimized for understanding the invitation and joining as an account player or guest player. It uses the authenticated app’s 896px content canvas, left-aligned game tabs, destination title hierarchy, section rhythm, and opaque surface rather than presenting a separate microsite aesthetic. On desktop, RSVP and a five-person roster preview share the right rail, matching the authenticated Overview; on mobile, both stay in the main reading flow and Overview exposes an immediate Join game shortcut. Full rosters belong in Players.
- Account player workspace: the shared experience inside Relay’s app shell, plus personal chat, payment, history, and participation actions.
- Host workspace: the same account player workspace with contextual edit, roster, payment-review, court, scoring, and completion controls.
- Platform administration never appears as a session role.

Authenticated destinations begin with one compact breadcrumb trail that anchors the current surface in Home or Admin Console. Ancestors are links, the current destination is text, and database identifiers never appear as labels. A game always uses the stable `Home / Games / [game name]` trail; its local tabs already communicate Overview, Players, Play, Chat, and Payments. Trails scroll quietly on narrow screens rather than wrapping into a second navigation row.

Authenticated game chrome is persistent across navigation: the tab rail stays left, while Edit game (host/co-host) and Share game sit beside the session name. The session name, destination title, and destination subtitle render before the data boundary; only each tab’s content becomes a layout-accurate skeleton. This prevents navigation, actions, and headings from flashing between tabs.

Management controls sit beside the information they change and render only for hosts or co-hosts. Sharing is the persistent session action, so inviting someone never requires returning to another tab. Player screens remain readable and action-light; they are not disabled host dashboards.

## Onboarding

Profile setup asks only for identity and optional recreational context. The following product tour runs over the real authenticated shell rather than a slideshow: it spotlights Create, Home, Games, Groups, Search, Notifications, and Profile in place, selecting the visible desktop or mobile control automatically. Each step explains one practical part of the create → share → play loop. The rest of the interface is inert while the accessible tour dialog is open. Closing stays visually immediate—no spinner or exit effect. Completion is persistent; Help Center may replay the same tour without resetting account data.

## Notifications

Notifications are a contextual inbox, not an activity feed. Group updates by recency, distinguish unread items with one quiet dot and stronger icon treatment, and route every row directly to the relevant session surface. The sidebar shows a compact numeric unread count and updates through one user-scoped realtime subscription. Notification color remains restrained; urgency comes from specific copy and destination, not red badges or promotional cards.

## Product feedback

Feedback is one support workflow with three clear intents: bug report, feature request, and general feedback. Players choose the affected product area, provide specific context, and see only the public review status of their own submissions. Private triage notes stay in the admin console. The admin inbox groups work by lifecycle—New, Reviewing, Planned, Resolved, and Closed—without implying that Planned is a public delivery commitment. Feedback surfaces use rows, dividers, and the standard form system rather than support-ticket dashboards or voting mechanics.

## Core components

### Buttons

One solid action per decision area. Primary buttons use court blue and a subtle inner highlight; secondary buttons use a white surface and keyline; quiet actions have no container until hover. Standard buttons are 36px with restrained horizontal padding, 13px labels, centered icon-label alignment, and one shared radius; use the 40px large size only for a dominant mobile action. RSVP choices use the same 36px rhythm as adjacent Update response and Share game actions. Labels describe outcomes and remain consistent across surfaces (for example, always “Share game,” never a mix of “Share” and “Share game”). Disabled controls retain legible labels.

### Inputs

Text and numeric controls use a 44–48px white surface, cool keyline, and court-blue focus halo. Labels sit above inputs. Date, time, and select fields use Relay-owned accessible popovers rather than browser-native pickers so their hierarchy, spacing, and error treatment remain consistent across iOS, Android, and desktop. Mobile popovers become compact bottom sheets; desktop popovers stay anchored to their trigger. Validation appears inline and names the corrective action.

### Navigation

Top chrome may use a slightly translucent canvas plus controlled blur. Desktop navigation uses compact quiet rows, smaller Phosphor icons, and a neutral selected surface; mobile uses an opaque, standard edge-to-edge bottom tab bar. The desktop rail’s expanded/icon-only choice is saved locally and restored before paint; it does not alter the mobile bar or content density. Navigation icons never become loading spinners. Appearance lives in the owner’s Profile settings rather than daily navigation. Active Play prioritizes local game navigation over global navigation.

### Session identity

A deep court field carries date, title, plan, capacity, and status. White court divisions organize the object. The game color appears as a restrained cover tint, edge, selected state, and action color—not a decorative wash. Shared links and authenticated workspaces use the same quiet underlined tab row so the five session destinations remain legible and spatially consistent across both access paths.

### Live court

Before Play starts, the host chooses one of four flat, outcome-labeled rows: Paddle Stack, Mix It Up, Court Climb, or Team Round Robin. Paddle Stack progressively reveals queue rules and Partner style; Keep pairs together then reveals a compact pair builder. Team Round Robin requires fixed pairs and schedules every pair against every other pair once, using byes when the team count is odd. Unsupported rosters explain the exact player/court requirement inline rather than failing after selection.

- Scores dominate and remain readable from several feet. The standard scoreboard fills its available court column; multiple courts stack instead of squeezing into narrow desktop cards.
- The neutral outer shell follows the planning UI while the deep court field carries teams, scores, and controls. Its dark field and court lines inherit the game’s curated accent without weakening white-score contrast. Player names remain intact and fixed partners stack as two explicit names.
- Every scoreboard offers an expanded, viewport-filling view for courtside use. It preserves score state and permissions, closes with Escape or a labeled control, and works for read-only public viewers.
- Teams align directly above their score.
- Minus and plus controls have separate 64px zones.
- Live state combines a coral mark with the word “Live.”
- Score mutations temporarily disable repeat input and explain concurrency conflicts.
- A finished match collapses into history; it does not linger as an active card.
- Fixed partners appear as one team row in the queue and remain together across future assignments. Pair identity is explicit session data, never inferred from adjacent paddles.

### Collections

Game history defaults to a compact, Notion-like list for scanning. Users may switch to a two- or three-column grid or a familiar month calendar spanning live, upcoming, and past sessions. Groups use the same count-and-view toolbar with list and grid options, so recurring crews behave like the Games collection rather than a separate mini-product. Each choice is explicit, accessible, saved locally (`relay-games-view` and `relay-groups-view`), and never changes the underlying sort or information hierarchy.

### Global search

Search responds after a short debounce to every non-empty keystroke; Enter is never required. Idle search shows on-device recent searches. Results remain flat rows grouped by Games, Players, Groups, and Venues, with underlined filters and incremental loading rather than cards or a discovery feed. Search preserves session colors as identity markers and exposes only content authorized for the viewer.

### Groups

Groups are a retention shortcut, never onboarding. A completed standalone session may become a group through “Save this crew”; Play Again preserves an existing group; and any member may start a group session using the crew’s latest practical defaults. Group pages prioritize members, the next game, and shared session memories. They do not introduce feeds, club administration, or competitive identity.

### Host readiness

Readiness appears in the authenticated host overview and compactly on hosted game collection objects. It measures only roster, booking, and repayment setup. The overview owns the actionable checklist; Home and Games show only the resulting percentage or Ready state so the signal is not duplicated.

### Payments

A payment split is framed as repayment to a host who already covered the expense. The host appears first as “paid upfront” and is excluded from player shares and proof submission. Host receipts and player payment screenshots use the same neutral custom image field with filename, preview, removal, format guidance, and no native browser file-button styling.

### Queue and standings

Queue order uses tabular numbers and rows, not pills. Standings are a compact table with right-aligned numeric columns. Neither imitates a professional rating system.

### Session chat

Chat occupies the remaining viewport below session navigation. The message history scrolls inside that region while the composer stays anchored to its bottom edge, above mobile safe areas and app navigation. New messages scroll the thread—not the page—and reduced-motion users never receive smooth auto-scrolling. Photo messages render as bounded thumbnails; selecting one opens a focused, keyboard-dismissable viewer instead of expanding the conversation width.

## Motion

Product motion communicates state in 140–220ms using ease-out-quart. Marketing motion has a separate editorial pace: native touch scrolling, gently eased wheel input, and one 650–900ms reveal as each major chapter enters.

- Product: score change, queue reorder, RSVP confirmation, payment confirmation, sheet transition, and match completion.
- Marketing: small rise-and-mask, paired horizontal entrances, or short child sequences chosen to match the section’s composition. A section animates once; nearby elements move as one orchestrated moment.
- Navigation and button feedback may use subtle color and 1–2px press movement.
- Avoid ambient motion, bounce, decorative loops, scroll hijacking on touch devices, and identical effects repeated down an entire page.
- `prefers-reduced-motion` restores native scrolling, removes transforms, and shortens feedback to near-instant.

## Accessibility and platform behavior

- WCAG 2.2 AA minimum.
- Visible 3px focus halo with offset.
- Interactive controls meet WCAG 2.2 target sizing; standard actions are 36–40px and score controls are 64px.
- Native share, date, time, file, and authentication behavior where available.
- Semantic headings, lists, tables, forms, and live regions.
- Light and dark modes are designed separately.
- Loading skeletons match real layout; Play skeletons preserve the scoreboard shell, two score sides, host controls when applicable, and adjacent queue. Offline/reconnecting state is explicit in collaborative routes.

## Anti-slop review

Before shipping a surface, remove anything that does not encode hierarchy, state, action, or sport structure. Reject:

- generic dashboard metric grids
- repeated icon/heading/paragraph cards
- giant gradients, glow, glass content cards, and decorative blobs
- oversized radii or every object inside a card
- tiny uppercase labels used as decoration
- arbitrary sport imagery, pickleball doodles, and fake broadcast graphics
- inconsistent control shapes, excessive pills, and shadows used as polish
- “premium” expressed through low contrast or thin unreadable type

The final check: a fluent consumer should trust the interface immediately, while the court geometry and live scoring make it unmistakably Relay.
