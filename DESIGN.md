# Relay Design System

## Design thesis

Relay should feel like checking a beautifully made sports instrument: immediate, precise, and calm until play becomes live. Light mode is the deliberate default for bright venues and daytime planning; dark mode is an explicit, persistent user choice. The visual world combines **hard-court geometry** with **Apple-like product discipline**—native-feeling typography, strong hierarchy, polished materials, and controls that behave exactly as expected.

Apple is a quality reference, not a skin. Relay does not imitate macOS windows, traffic-light controls, frosted cards, or desktop chrome. The influence appears through legibility, restraint, platform-native behavior, material used only for navigation, and careful state feedback.

## Physical scene

Players stand under bright court lights and share one phone between rallies. The interface must read in glare, from several feet away, with one hand, while people are moving. Planning surfaces stay quiet; courts, scores, and the queue become visually forceful.

## Signature

**The digital court.** Session heroes and match surfaces use a deep blue-black field, crisp white divisions, court-blue action areas, tabular scores, and a single optic-yellow signal. The geometry encodes actual structure—sides, courts, queue order, and live state. It is never a decorative pattern.

The Relay mark is a top-down court in motion: court boundaries, a contrasting net, and one optic ball crossing into the next side. It expresses pickleball and relay without relying on a generic letter, paddle silhouette, or social-app glyph.

## Color strategy

Restrained foundation with a stronger sport mode. Court blue occupies less than 10% of planning surfaces and expands only in session identity, selected state, and Live Mode.

```css
/* Light */
--canvas: oklch(.975 .006 250);
--surface: oklch(1 0 0);
--surface-raised: oklch(.948 .01 250);
--ink: oklch(.19 .025 255);
--muted: oklch(.44 .025 252);
--line: oklch(.875 .012 250);

--primary: oklch(.55 .205 255);      /* court blue */
--primary-hover: oklch(.49 .205 255);
--primary-soft: oklch(.94 .04 252);
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

## Typography

Relay uses the platform UI stack first:

```css
font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text",
  var(--font-geist-sans), "Segoe UI", sans-serif;
```

This gives Apple devices native SF typography while retaining Geist elsewhere. Geist Mono is reserved for scores, times, currency, queue numbers, and standings.

- Page title: 30/36 mobile, 36/42 desktop, 720 weight, `-0.025em` tracking.
- Session title: 28/34 mobile, 36/42 desktop, 720 weight.
- Section title: 18/24, 680 weight.
- Body: 15–16/24.
- Utility: 13–14/18.
- Data/score: Geist Mono with tabular numerals; large scores use tighter `-0.045em` tracking.
- Headings balance; prose wraps prettily and stays below 70ch.
- Avoid all-caps except court labels, dates, and live scoreboard utilities where the compact scan pattern is functional.

## Materials and elevation

- Canvas is a cool near-white; content surfaces are true white.
- Navigation chrome may use `backdrop-filter` because it floats above scrolling content. Content cards never use blur.
- Elevation is expressed by surface contrast, a 1px keyline, and at most an 8px blur shadow for floating chrome.
- No gradient fills, glow, glass cards, border-plus-wide-shadow cards, or decorative transparency.

## Shape

- Controls: 10–12px radius.
- Discrete session/match objects: 14–16px radius.
- Compact identity/status: full circle or pill only when its semantics justify the shape.
- Inputs are 48px high; primary touch controls are at least 44px.
- Use rows, dividers, and whitespace before cards. Nested cards are not allowed.

## Layout

- Mobile: 16px page gutter, edge-to-edge data sections, safe-area bottom navigation.
- Desktop: centered 1180px shell; overview/roster and courts/queue become deliberate two-column compositions.
- Header and bottom navigation are sticky navigation materials, not page decoration.
- Vertical rhythm uses 8, 12, 16, 24, 32, 48, and 64px steps.
- Desktop never stretches mobile cards; it introduces useful adjacency.

## Core components

### Buttons

One solid action per decision area. Primary buttons use court blue and a subtle inner highlight; secondary buttons use a white surface and keyline; quiet actions have no container until hover. Labels describe outcomes. Disabled controls retain legible labels.

### Inputs

Native controls with 48px height, white surface, cool keyline, and a court-blue focus halo. Labels sit above inputs. Validation appears inline and names the corrective action.

### Navigation

Sticky top and bottom chrome uses a slightly translucent canvas plus controlled blur. Current sections use primary text and a compact indicator; inactive sections remain quiet. Live Mode prioritizes local Courts navigation over global navigation.

### Session identity

A deep court field carries date, title, plan, capacity, and status. White court divisions organize the object. The CTA occupies a distinct court-blue zone rather than floating as another rounded button.

### Live court

- Scores dominate and remain readable from several feet.
- Teams align directly above their score.
- Minus and plus controls have separate 64px zones.
- Live state combines a coral mark with the word “Live.”
- Score mutations temporarily disable repeat input and explain concurrency conflicts.
- A finished match collapses into history; it does not linger as an active card.

### Queue and standings

Queue order uses tabular numbers and rows, not pills. Standings are a compact table with right-aligned numeric columns. Neither imitates a professional rating system.

## Motion

Motion communicates state in 140–220ms using ease-out-quart.

- Allowed: score change, queue reorder, RSVP confirmation, payment confirmation, sheet transition, match completion.
- Navigation and button feedback may use subtle color and 1–2px press movement.
- No page-load choreography, ambient motion, bounce, or decorative looping.
- `prefers-reduced-motion` removes transforms and shortens feedback to near-instant.

## Accessibility and platform behavior

- WCAG 2.2 AA minimum.
- Visible 3px focus halo with offset.
- 44px touch minimum; score controls are 64px.
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
