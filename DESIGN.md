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

Dark mode uses neutral blue-black architecture rather than inverting light colors. The app starts light and stores the user’s explicit Light, Dark, or System choice. Appearance controls stay in authenticated setup and Preferences; public landing, utility, legal, authentication, and shared-game pages do not expose theme controls. Court blue becomes lighter but not fluorescent. `signal` is reserved for queue readiness, match point, and compact live indicators; it never becomes a general CTA color.

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
- Introductory and authentication surfaces use the quiet base surface—near-white in light mode and the designed blue-black surface in dark mode. Sport character comes from court geometry, the optic ball, and precise blue actions rather than oversized promotional panels.
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
- Every product destination uses the same centered 1152px content canvas. Home, Games, Groups, Search, Create, Notifications, Help Center, profiles, game tabs, shared game links, and Admin Console share the same outer edges. Forms, prose, filters, and empty messages may be narrower inside that canvas for usability, but breadcrumbs, page headings, primary content sections, and loading states never shift to a different page width. Tables and multi-column session layouts may use the full canvas so desktop space carries useful information rather than empty margins.
- Authenticated shells stay fixed to the dynamic viewport. The content surface is the sole vertical scroll container, keeping the desktop rail and mobile chrome stable without locking nested feature scroll areas such as chat. Visible scrollbars use one narrow neutral trackless treatment across themes; horizontal tab rails remain visually hidden.
- Mobile: a compact bottom tab bar exposes Home, Games, Create, Court, and Groups. Profile moves to the top header as the player’s avatar beside Search and Notifications, preserving a familiar account affordance without crowding primary destinations. The tab bar uses the opaque surface token inside the safe area—white in light mode and the designed dark surface in dark mode—with high-contrast navigation states and 44px touch targets. Scrolling content never shows through it at phone or tablet widths.
- Navigation chrome may float and blur; content remains opaque and structurally flat.
- Vertical rhythm uses 8, 12, 16, 24, 32, 48, and 64px steps.
- Desktop never stretches mobile cards; it introduces useful adjacency.

### Marketing highlights

The landing page explains Relay twice: first as a concise promise, then as an early lifecycle highlight rail before the detailed chapters. The rail follows Find → Plan → Invite → Organize → Play → Repay → Stay in sync → Remember. Find is the optional Court Finder branch and clearly states that coverage is limited to the Philippines and that the reviewed inventory is still growing. Each large horizontal card makes one claim, names the concrete capability set, and uses a crisp component snapshot of the real Relay interface rather than a scaled screenshot. Touch users swipe; keyboard and pointer users receive explicit previous/next controls. The rail never auto-advances. Detailed sections below provide evidence rather than repeating the card copy.

## Session surfaces

The shared game link and authenticated session workspace are two access paths to the same session, not separate products. They use one canonical Overview, Players, Play, Chat, Payments, and Story navigation throughout the session. Play becomes the factual recap after completion rather than adding another destination. Both paths share the same session hero and session vocabulary. Shared information keeps the same order and labels on both surfaces. Guest RSVP, personal actions, and host management are contextual additions—not alternate page structures.

- Overview: the at-a-glance session home—plan, roster and waitlist state, current play, payment state, and the viewer’s next useful action.
- Play: the courtside workspace for assignments, paddle stack, rotations, scores, and session standings.
- Shared game link: optimized for understanding the invitation and joining as an account player or guest player. It uses the authenticated app’s 1152px content canvas, left-aligned game tabs, destination title hierarchy, section rhythm, and opaque surface rather than presenting a separate microsite aesthetic. A full game says **Join waitlist** before mutation. Every link carries a session-specific Open Graph image and Event JSON-LD; link-only games remain `noindex` while retaining rich message previews. On desktop, RSVP and a five-person roster preview share the right rail, matching the authenticated Overview; on mobile, both stay in the main reading flow and Overview exposes an immediate Join game shortcut. Full rosters belong in Players.
- Account player workspace: the shared experience inside Relay’s app shell, plus personal chat, payment, history, and participation actions. Signed-in invitees and Open games viewers stay on this route; capabilities progressively unlock after RSVP or host approval instead of sending them to the shared-link shell.
- Host workspace: the same account player workspace with contextual edit, roster, payment-review, court, scoring, and completion controls.
- Platform administration never appears as a session role.

Authenticated destinations begin with one compact breadcrumb trail that anchors the current surface in Home or Admin Console. Ancestors are links, the current destination is text, and database identifiers never appear as labels. On phone and tablet game workspaces, local game tabs replace the redundant breadcrumb; desktop keeps the stable `Home / Games / [game name]` trail. Trails scroll quietly on narrow screens rather than wrapping into a second navigation row.

Authenticated game chrome is persistent across navigation: the tab rail stays left, while Edit game (host/co-host) and Share game sit beside the session name. The session name, destination title, and destination subtitle render before the data boundary; only each tab’s content becomes a layout-accurate skeleton. This prevents navigation, actions, and headings from flashing between tabs.

Management controls sit beside the information they change and render only for hosts or co-hosts. Sharing is the persistent session action, so inviting someone never requires returning to another tab. Player screens remain readable and action-light; they are not disabled host dashboards.

## Onboarding

Profile setup uses three short stages: a welcome with recognizable identity, optional playing context plus device-local theme and density, then an optional discovery-source question and concise product promise. The following five-step product tour runs over the real authenticated shell rather than a slideshow: Welcome, Create, Home, Court, and Profile. It selects the visible desktop-sidebar or mobile-header/bottom-bar control automatically. Groups, search, notifications, payments, and advanced Play behavior remain contextual rather than becoming front-loaded instruction. The rest of the interface is inert while the accessible tour dialog is open. Players may skip immediately, finish at Home, or create their first game; Help Center can replay the tour without resetting account data.

## Notifications

Notifications are a contextual inbox, not an activity feed. Group updates by recency, distinguish unread items with one quiet dot and stronger icon treatment, and route every row directly to the relevant session surface. The sidebar shows a compact numeric unread count and updates through one user-scoped realtime subscription. Notification color remains restrained; urgency comes from specific copy and destination, not red badges or promotional cards.

## Admin console

Admin **Insights** reports aggregate acquisition source, setup and tour completion, and the 30-day core product loop without exposing chat, payments, or score content. Individual user detail shows the player’s optional discovery answer and onboarding status. The admin directory uses **Courts**, matching the player-facing Court Finder; `venue` remains an internal data and audit term only. Admin collections render one server-side 30-record page, then append stable cursor pages as the bottom sentinel approaches. Existing rows and table geometry stay fixed while a compact progress status loads the next page; incremental failure stays below existing rows with one Retry action. Completion names the exact number loaded and never implies a fixed cap. Search and filters reset the collection rather than mixing cursors from different result sets.

## Product feedback

Feedback is one support workflow with three clear intents: bug report, feature request, and general feedback. Players choose the affected product area, provide specific context, and see only the public review status of their own submissions. Private triage notes stay in the admin console. The admin inbox groups work by lifecycle—New, Reviewing, Planned, Resolved, and Closed—without implying that Planned is a public delivery commitment. Feedback surfaces use rows, dividers, and the standard form system rather than support-ticket dashboards or voting mechanics.

## Core components

### Buttons

One solid action per decision area. Primary buttons use court blue and a subtle inner highlight; secondary buttons use a white surface and keyline; quiet actions have no container until hover. Standard buttons are 36px with restrained horizontal padding, 13px labels, centered icon-label alignment, and one shared radius; use the 40px large size only for a dominant mobile action. RSVP choices use the same 36px rhythm as adjacent Update response and Share game actions. Labels describe outcomes and remain consistent across surfaces (for example, always “Share game,” never a mix of “Share” and “Share game”). Disabled controls retain legible labels.

### Inputs

Text and numeric controls use a 44–48px white surface, cool keyline, and court-blue focus halo. Labels sit above inputs. Date, time, and select fields use Relay-owned accessible popovers rather than browser-native pickers so their hierarchy, spacing, and error treatment remain consistent across iOS, Android, and desktop. Mobile popovers become compact bottom sheets; desktop popovers stay anchored to their trigger. Field validation appears inline and names the corrective action. Form-level errors and success messages use the shared `Alert` banner immediately above the form; they never appear as loose colored text below the final field.

### Navigation

Top chrome may use a slightly translucent canvas plus controlled blur. Desktop navigation uses compact quiet rows, smaller Phosphor icons, and a neutral selected surface; mobile uses an opaque, standard edge-to-edge bottom tab bar. The desktop rail’s expanded/icon-only choice is saved locally and restored before paint; it does not alter the mobile bar or content density. Navigation icons never become loading spinners. Appearance lives in the owner’s Profile settings rather than daily navigation. Active Play prioritizes local game navigation over global navigation. On short phone landscapes, the global top header steps away, the bottom bar compacts, and safe-area-aware game tabs remain available so courtside controls keep usable vertical space.

### Session identity

A deep court field carries date, title, plan, capacity, and status. White court divisions organize the object. The game color appears as a restrained cover tint, edge, selected state, and action color—not a decorative wash. Shared links and authenticated workspaces use the same quiet underlined tab row so the six session destinations remain legible and spatially consistent across both access paths.

### Live court

Before Play starts, the host chooses one of five flat, outcome-labeled rows: Paddle Stack, Mix It Up, Balanced Mix, Court Climb, or Team Round Robin. Paddle Stack progressively reveals queue rules and Partner style; Keep pairs together then reveals a compact pair builder. Team Round Robin requires fixed pairs and schedules every pair against every other pair once, using byes when the team count is odd. Unsupported rosters explain the exact player/court requirement inline rather than failing after selection.

- Arrival is progressive: before Play starts, the roster exposes a quiet **Who’s here** check-in. With no check-ins, all going players remain eligible; once anyone checks in, only players marked here enter the first rotation. Players update themselves and hosts may override the crew. Arrival state changes availability, not RSVP or history.
- Round-based modes may add one optional 5–60 minute shared timer. It derives from persisted match start time, survives refresh, appears above every active court, and never completes a score automatically when time expires.
- Scores dominate and remain readable from several feet. The standard scoreboard fills its available court column; every active court gets its own scoreboard and multiple courts stack instead of squeezing into narrow desktop cards.
- Score taps update immediately and debounce into one version-checked write. Host, co-host, or a signed-in player assigned to that court may score; all other viewers remain read-only.
- The neutral outer shell follows the planning UI while the deep court field carries teams, scores, and controls. Its dark field and court lines inherit the game’s curated accent without weakening white-score contrast. Player names remain intact and fixed partners stack as two explicit names.
- Every scoreboard offers a clearly labeled, viewport-filling view for courtside use. On phones it supports portrait and landscape, prompts portrait users to rotate, and lets people move directly between active courts without closing the view. It preserves live score state and permissions, closes with Escape or a labeled control, and works for read-only public viewers.
- Teams align directly above their score.
- Minus and plus controls have separate 64px zones.
- Live state combines a coral mark with the word “Live.”
- Score mutations temporarily disable repeat input and explain concurrency conflicts.
- A finished match collapses into history; it does not linger as an active card.
- Fixed partners appear as one team row in the queue and remain together across future assignments. Pair identity is explicit session data, never inferred from adjacent paddles.

### Collections

Game history defaults to a compact, Notion-like list for scanning. Games has two underlined sections: **My games** retains list, grid, and calendar history; **Open games** is an authenticated, mobile-first directory of public sessions rather than a social feed. My games filters are **Upcoming**, **Invites**, and **Past**. Unanswered Invites also appear above Upcoming so they cannot be missed, and the global Games destination carries a compact invite count. Invite objects state host, schedule, court, cost expectation, availability, and approval behavior before equal-width Going, Maybe, and Can’t go actions. Once answered, a game leaves Invites and appears in Upcoming with Going, Maybe, Awaiting approval, or Waitlisted status. Open-game rows state host, schedule, court, Free or estimated cost, roster capacity, available/waitlist state, approval requirement, and the viewer’s RSVP state. Filters cover date, court/location text, and available spots; filtering resets stable cursor pagination. Open Games never adds popularity, reactions, follower counts, rankings, or device-location claims. Users may switch My games to a two- or three-column grid or a familiar month calendar spanning live, upcoming, and past sessions. Groups use the same count-and-view toolbar with list and grid options, so recurring crews behave like the Games collection rather than a separate mini-product. Each choice is explicit, accessible, saved locally (`relay-games-view` and `relay-groups-view`), and never changes the underlying sort or information hierarchy.

### Global search

Search responds after a short debounce to every non-empty keystroke; Enter is never required. Idle search shows on-device recent searches. Results remain flat rows grouped by Games, Players, Groups, and Venues, with underlined filters and incremental loading rather than cards or a discovery feed. Game ranking favors exact title, title prefix, venue prefix, then trigram similarity and upcoming relevance. Public results state cost, availability, approval, and the viewer’s RSVP state. Completed, link-only, and private games remain searchable only for authorized hosts or participants. Search preserves session colors as identity markers and exposes only content authorized for the viewer.

### Groups

Groups are a retention shortcut, never onboarding. A completed standalone session may become a group through “Save this crew”; Play Again preserves an existing group; and any member may start a group session using the crew’s latest practical defaults. Group pages prioritize members, the next game, and shared session memories. They do not introduce feeds, club administration, or competitive identity.

### Court discovery

Court is a concise desktop-sidebar destination and a contextual branch of Create on mobile, not a booking marketplace. Its label stays distinct from global Search. The finder opens directly on search, filters, results, and map without a redundant page intro. **Suggest a court** sits with the desktop sidebar’s secondary destinations and remains available after the mobile results. The coverage boundary is the **Philippines only**: one interactive map anchors a searchable, community-reviewed court list. The first verified inventory is strongest in Cebu, while submissions and map coverage accept the whole country. Search covers court name, neighborhood, setting, structured price, parking, operating hours, and amenities; compact setting, parking, starting-price, and availability popovers stay visible without opening a filter drawer. Parking has two verified states—Available and Not available—while missing source data remains visibly Not listed rather than being silently omitted or treated as no parking. Availability stays concise: Any availability, Open now, Open 24 hours, and Open during a time range. Choosing the last option reveals compact From and Until time popovers, and only returns courts operating throughout that booking window. Results derive from the court’s structured per-day operating periods in Philippine time and never imply live court availability. **Use my location** is optional, remains on-device, marks the approximate position, and sorts rather than hiding courts. Desktop uses a full-height locator workspace with an independently scrollable results rail on the left and the dominant map on the right; mobile keeps the map before a bounded results list. Selecting a pin or row synchronizes both surfaces and opens one concise, closable court overlay on the map with distance, practical details, and one dominant Create game action. The map supports restrained pan, pinch/wheel zoom, explicit zoom controls, and fullscreen while cooperative touch gestures preserve page scrolling. The defining action is **Create game**; directions, court details, copy location, and external booking are secondary. The player-facing directory shows verified courts only, with a blue **Verified by Relay** marker. Imported and player-suggested courts stay private until an admin verifies and publishes them. Philippines-only scope remains clear in metadata, search language, and submission guidance rather than a persistent banner. Relay never implies live availability, and manual venue entry remains available so discovery cannot block session creation. Server-proxied Philippines-bounded tiles preserve Geoapify/OpenMapTiles/OpenStreetMap attribution without exposing the provider key. The landing page may embed a small, real Court Finder preview with representative listings so the feature is understood before signup; it preserves attribution and clearly labels the country boundary and growing inventory.

### Create game

Creation is one mobile-first form revealed through four meaningful stages: **Plan**, **Players and access**, **Details**, then **Review**. A labeled semantic progress indicator announces Step X of 4 and marks the current step. Continue validates only visible work; final publication repeats complete server validation and returns the host to the first invalid stage. Back and Edit preserve values, and step changes focus the stage heading. Visibility and cost stay together because public discovery requires an informed choice: Free or an estimated per-player amount. Link-only and private games may leave cost unspecified. Details is explicitly optional and states that everything there can be added later; it contains color, court labels, player notes, booking status, booking reference, booking total, and booking notes. Review is read-only and provides Edit actions back to each stage.

### Host readiness

Readiness appears in the authenticated host overview and compactly on hosted game collection objects. It measures only roster, booking, and repayment setup. The overview owns the actionable checklist; Home and Games show only the resulting percentage or Ready state so the signal is not duplicated.

### Payments

A payment split is framed as repayment to a host who already covered the expense. The host appears first as “paid upfront” and is excluded from player shares and proof submission. Host receipts and player payment screenshots use the same neutral custom image field with filename, preview, removal, format guidance, and no native browser file-button styling.

### Queue and standings

Queue order uses tabular numbers and rows, not pills. Standings are a compact table with right-aligned numeric columns. Neither imitates a professional rating system.

### Session chat

Chat occupies the remaining viewport below session navigation. The message history scrolls inside that region while the composer stays anchored to its bottom edge, above mobile safe areas and app navigation. New messages scroll the thread—not the page—and reduced-motion users never receive smooth auto-scrolling. Photo messages render as bounded thumbnails; selecting one opens a focused, keyboard-dismissable viewer instead of expanding the conversation width.

## Session recap and story

**Play** owns the game’s full lifecycle. Before play it explains what will appear; during play it runs courts and marks provisional highlights; when the host ends the session, the same Play URL becomes **Recap** and locks the final results. The recap opens with one deep-court result surface, then reveals only defensible highlights from persisted data: match and point totals, court time, top session standing, strongest repeated pair, closest finish, and busiest court. Full Session Standings remain below. With no completed scores, Recap says so rather than inventing a winner. Legacy Recap URLs redirect to Play.

**Story** is the expressive destination. It opens after the host ends the session and groups the social story composer and game photos. Before completion it explains what will unlock without exposing inactive controls. Public and authenticated URLs use the same Story label and order.

A participant may turn the night into a manually controlled 9:16 story. Available focuses include Night recap, My game, Winning team, Top of the table, Session Standings, Closest finish, Busiest court, Points played, Court time, The crew, and a photo-first custom story; a focus renders only when persisted session data supports it. The portrait never auto-advances and supports swipe, Previous/Next controls, keyboard arrows, and direct selection.

Customization is broad but bounded: four structural layouts, Relay palettes, persisted session photos, a local device photo, vertical crop, text contrast, a short custom headline, and one personal line. Local background photos stay on-device unless separately added to the session. Preview and exported 1080 × 1920 PNG must carry the same focus, layout, crop, contrast, and words. Native file sharing is used only when supported; explicit PNG download remains available. Story never becomes a competitive report or an unconstrained drag-and-drop editor that can fabricate results or break export parity.

## Motion

Product motion communicates state in 140–220ms using ease-out-quart. Marketing motion has a separate editorial pace: native touch scrolling, gently eased wheel input, and one 650–900ms reveal as each major chapter enters.

- Product: score change, queue reorder, RSVP confirmation, payment confirmation, sheet transition, and match completion.
- Marketing: small rise-and-mask, paired horizontal entrances, or short child sequences chosen to match the section’s composition. A section animates once; nearby elements move as one orchestrated moment.
- Navigation and button feedback may use subtle color and 1–2px press movement.
- Avoid ambient motion, bounce, decorative loops, scroll hijacking on touch devices, and identical effects repeated down an entire page.
- `prefers-reduced-motion` restores native scrolling, removes transforms, and shortens feedback to near-instant.

## Accessibility and platform behavior

- `/courts` is the public Philippines finder; `/court` is the signed-in app version. `/play` is public, device-local Play with manual players, the same rotation modes, multi-court full-screen scoring, and versioned browser persistence. It requires no account or network write. Public court CTAs preserve the selected court through signup and onboarding, then open a prefilled game.
- Relay is installable as a standalone PWA with the same light-first theme, ball mark, and responsive app shell. Preferences owns the install affordance; browsers without a programmatic prompt receive platform-appropriate manual guidance.
- Offline state is explicit and restrained. Network-backed navigation and mutations remain pending when supported, live data never pretends to be current, and a full offline load shows one branded recovery page rather than cached private content.
- WCAG 2.2 AA minimum.
- Visible 3px focus halo with offset.
- Interactive controls meet WCAG 2.2 target sizing; standard actions are 36–40px and score controls are 64px.
- Native share, date, time, file, and authentication behavior where available.
- Semantic headings, lists, tables, forms, and live regions.
- Light and dark modes are designed separately.
- Loading boundaries cover only content that actually depends on pending server data. Static titles, descriptions, breadcrumbs, tabs, filters, and navigation render as real UI or wait for the route; they are never replaced by skeleton blocks. Data skeletons match the exact rows, records, maps, scoreboards, or media they replace. Play skeletons preserve the scoreboard shell, two score sides, host controls when applicable, and adjacent queue. Offline/reconnecting state is explicit in collaborative routes.

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
