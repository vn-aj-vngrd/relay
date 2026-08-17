# Relay Design System

## Design thesis

Relay should feel like checking a beautifully made sports instrument: immediate, precise, and calm until play becomes live. Light mode is the deliberate default for bright venues and daytime planning; dark mode is an explicit, persistent user choice. The visual world combines **hard-court geometry** with **Apple-like product discipline**—native-feeling typography, strong hierarchy, polished materials, and controls that behave exactly as expected.

Linear is the current product-UI baseline for hierarchy, density, alignment, icons, theme discipline, and component behavior; see `docs/LINEAR_UI_REFERENCE.md`. It is a temporary foundation, not Relay’s final identity. Apple remains a quality reference for platform-native behavior and careful state feedback.

## Physical scene

Players stand under bright court lights and share one phone between rallies. The interface must read in glare, from several feet away, with one hand, while people are moving. Planning surfaces stay quiet; courts, scores, and the queue become visually forceful.

## Signature

**The digital court.** Session heroes and match surfaces use a deep blue-black field, crisp white divisions, court-blue action areas, tabular scores, and a single optic-yellow signal. The geometry encodes actual structure—sides, courts, queue order, and live state. It is never a decorative pattern.

The Relay mark is one irreducible pickleball: an optic yellow-green circular silhouette with six asymmetric negative-space holes. It remains freestanding—no border, enclosing tile, decorative background, miniature court, paddle, or motion effect. The same mark is used across themes, and the full mark-plus-wordmark lockup is preferred whenever space allows.

## Color strategy

Restrained foundation with a stronger sport mode. Court blue occupies less than 10% of planning surfaces and expands only in session identity, selected state, and Live Mode.

```css
/* Light */
--canvas: oklch(.965 .002 75);
--surface: oklch(.992 .001 75);
--surface-raised: oklch(.935 .003 75);
--ink: oklch(.22 .008 275);
--muted: oklch(.48 .012 275);
--line: oklch(.875 .005 75);

--primary: oklch(.57 .18 275);       /* temporary Linear-like accent */
--primary-hover: oklch(.52 .18 275);
--primary-soft: oklch(.93 .04 275);
--court: oklch(.18 .045 252);        /* scoreboard/court field */
--court-line: oklch(.84 .095 220);
--signal: oklch(.89 .18 105);        /* optic ball; sparse */
--live: oklch(.64 .20 32);

--success: oklch(.52 .14 150);
--warning: oklch(.69 .15 78);
--danger: oklch(.56 .20 26);
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

A host may choose one game color from the curated palette in `src/features/sessions/accent.ts`. It scopes the authenticated game workspace and public invite only; global Relay navigation and semantic status colors remain unchanged. The raw selection is mixed toward the current theme’s ink for readable controls and text, while soft fills are mixed into the current surface. Unknown stored values fall back to violet.

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
- Desktop: a quiet 240px left rail keeps primary actions in a stable, familiar position; content uses the remaining space for overview/roster and courts/queue compositions.
- Mobile: a compact floating tab bar stays inside the safe area and preserves 44px touch targets without obscuring content.
- Navigation chrome may float and blur; content remains opaque and structurally flat.
- Vertical rhythm uses 8, 12, 16, 24, 32, 48, and 64px steps.
- Desktop never stretches mobile cards; it introduces useful adjacency.

## Session surfaces

The shared game link and authenticated session workspace are two access paths to the same session, not separate products. They use one canonical Overview, Players, Play, Chat, and Payments navigation; the same session hero; and the same session vocabulary. Shared information keeps the same order and labels on both surfaces. Guest RSVP, personal actions, and host management are contextual additions—not alternate page structures.

- Overview: the at-a-glance session home—plan, roster and waitlist state, current play, payment state, and the viewer’s next useful action.
- Play: the courtside workspace for assignments, paddle stack, rotations, scores, and session standings.
- Shared game link: optimized for understanding the invitation and joining as an account player or guest player.
- Account player workspace: the shared experience inside Relay’s app shell, plus personal chat, payment, history, and participation actions.
- Host workspace: the same account player workspace with contextual edit, roster, payment-review, court, scoring, and completion controls.
- Platform administration never appears as a session role.

Management controls sit beside the information they change and render only for hosts or co-hosts. Player screens remain readable and action-light; they are not disabled host dashboards.

## Core components

### Buttons

One solid action per decision area. Primary buttons use court blue and a subtle inner highlight; secondary buttons use a white surface and keyline; quiet actions have no container until hover. Standard buttons are 36px with restrained horizontal padding and 13px labels; use the 40px large size only for a dominant mobile or full-width action. Labels describe outcomes. Disabled controls retain legible labels.

### Inputs

Native controls with 48px height, white surface, cool keyline, and a court-blue focus halo. Labels sit above inputs. Validation appears inline and names the corrective action.

### Navigation

Sticky chrome uses a slightly translucent canvas plus controlled blur. Desktop navigation uses compact quiet rows, smaller Phosphor icons, and a neutral selected surface; mobile uses a standard edge-to-edge tab bar. Navigation icons never become loading spinners. Appearance lives in the owner’s Profile settings rather than daily navigation. Live Mode prioritizes local Play navigation over global navigation.

### Session identity

A deep court field carries date, title, plan, capacity, and status. White court divisions organize the object. The game color appears as a restrained edge, selected state, and action color—not a decorative wash. Shared links and authenticated workspaces use the same quiet underlined tab row so the five session destinations remain legible and spatially consistent across both access paths.

### Live court

- Scores dominate and remain readable from several feet.
- Teams align directly above their score.
- Minus and plus controls have separate 64px zones.
- Live state combines a coral mark with the word “Live.”
- Score mutations temporarily disable repeat input and explain concurrency conflicts.
- A finished match collapses into history; it does not linger as an active card.

### Collections

Game history defaults to a compact, Notion-like list for scanning. Users may switch to a two- or three-column grid or a familiar month calendar spanning live, upcoming, and past sessions. The choice is explicit, accessible, and saved locally as `relay-games-view`; it never changes the underlying sort or information hierarchy.

### Queue and standings

Queue order uses tabular numbers and rows, not pills. Standings are a compact table with right-aligned numeric columns. Neither imitates a professional rating system.

### Session chat

Chat occupies the remaining viewport below session navigation. The message history scrolls inside that region while the composer stays anchored to its bottom edge, above mobile safe areas and app navigation. New messages scroll the thread—not the page—and reduced-motion users never receive smooth auto-scrolling. Photo messages render as bounded thumbnails; selecting one opens a focused, keyboard-dismissable viewer instead of expanding the conversation width.

## Motion

Motion communicates state in 140–220ms using ease-out-quart.

- Allowed: score change, queue reorder, RSVP confirmation, payment confirmation, sheet transition, match completion.
- Navigation and button feedback may use subtle color and 1–2px press movement.
- No page-load choreography, ambient motion, bounce, or decorative looping.
- `prefers-reduced-motion` removes transforms and shortens feedback to near-instant.

## Accessibility and platform behavior

- WCAG 2.2 AA minimum.
- Visible 3px focus halo with offset.
- Interactive controls meet WCAG 2.2 target sizing; standard actions are 36–40px and score controls are 64px.
- Native share, date, time, file, and authentication behavior where available.
- Semantic headings, lists, tables, forms, and live regions.
- Light and dark modes are designed separately.
- Loading skeletons match real layout; offline/reconnecting state is explicit in collaborative routes.

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
