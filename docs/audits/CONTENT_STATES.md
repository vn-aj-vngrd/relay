# Loading and empty-state polish

Scope: application-wide shared presentation, following the reviewed Quick Play
player-list refinements. Existing data, permissions, route boundaries and saved
state behavior remain authoritative.

## Findings and implementation

| Surface | Improvement |
| --- | --- |
| Quick Play | Animated device-opening indicator with visible explanation; player and result empty states |
| Games and invitations | Subject-specific icons, centered titles and guidance, retained creation/filter actions |
| Groups | Consistent empty groups, schedule and memories; labeled data placeholders |
| Notifications | Clear caught-up/first-use states; visible loading label |
| Search and pickers | Consistent no-results presentation; existing search guidance and escape paths |
| Courts | Labeled map loading; empty-results Clear filters action; suggestion history |
| Chat and Agent history | First-conversation and saved-history guidance; labeled restoration and route loading |
| Play and session overview | Shared public/private loading feedback; roster and waitlist empty states |
| Story and recap | Album/result states and loading labels; contribution permissions retained |
| Billing and storage | Plan/payment history and media states; visible loading labels |
| Feedback and admin | Shared record/history states with existing filters and permissions |
| Shared motion | Reduced-motion handling in loading indicators, skeletons and pending buttons |

`content-state.tsx` centralizes the layout. Compact states fit section and picker
contexts; full states center the icon, label, guidance, and action. Existing
Button/ButtonLink controls and semantic theme tokens are reused. Empty states
are static; animation only signals loading. Existing status regions suppress
nested announcements through `announce={false}`.

Inline payment facts, zero metrics, validation and permission messages retain
their contextual presentation. They are not missing-content screens. Server
data skeletons keep route-specific geometry; loading indicators do not promise
completion percentages or invent game results.

## Coverage and review boundary

- Shared component regressions cover visible guidance, decorative icons,
  recovery actions, server rendering, reduced motion and status announcements.
- Quick Play hydration coverage still covers empty storage and a saved recap.
- Court Finder coverage includes clearing filters from the empty result.
- The local review gallery renders illustrative states using the real shared
  components and application CSS. It contains no account data and is not an
  application route or a production artifact.
- Manual browser review: light and dark gallery, including mobile; Court Finder
  search reached the empty state and Clear filters restored the court list.
- Pre-commit validation: formatting and strict TypeScript passed; all
  2,605 unit tests passed across 361 files.
  The default Turbopack build hit a local worker-port restriction; the Webpack
  production build passed with cached font responses. Normal CI remains the
  authority for the default build. Automated E2E execution remains opt-in.
- Local visual review does not establish authenticated/admin end-to-end coverage.
