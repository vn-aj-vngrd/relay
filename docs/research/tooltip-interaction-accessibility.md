# App-wide tooltip behavior

## Decision

Centralize all rendering and behavior in `src/components/ui/tooltip.tsx`, without a new dependency. `IconTooltip` and `SidebarItemTooltip` become adapters. The sidebar collapse control and all React-owned native-title hover help use the same primitive. `DomTooltips` bridges MapLibre-owned titles (markers and navigation/fullscreen controls) without inventing another tooltip renderer. Content and metadata props named `title` are not tooltips. The primitive combines the prior sidebar’s portal/description ownership with IconTooltip’s delay/hover bridge and the existing `usePopoverTransition` animation contract.

- Open after **300 ms of pointer hover**; cancel when the pointer passes through.
- Open **immediately on keyboard focus**, without an extra tab stop or moving focus.
- Keep a **150 ms pointer-leave grace** and a padded, hoverable bridge between control and tooltip. Never auto-expire while the control or tooltip remains hovered, or the control remains focused.
- Escape cancels pending opens and dismisses visible content without moving focus. Continued hover/focus must not immediately reopen it. Activating the control also dismisses it; touch activation must not create a sticky tooltip.
- Preserve the control’s accessible name and existing description references. Link supplemental content with `aria-describedby` and `role="tooltip"`. Tooltip content remains plain text, without interactive children.
- Reuse Relay’s **180 ms entrance / 120 ms exit** popover motion. Reduced motion uses the existing **opacity-only** treatment, with no movement or scaling. Its nominal 80 ms / 60 ms keyframes are shortened to near-instant by Relay’s global reduced-motion guard. These motion durations and leave grace are Relay decisions, not WCAG mandates or Jira-wide guarantees.
- Suppress the More tooltip while its menu is open. Keep the desktop More control icon-only, 36px square, with the accessible name “More game actions.”

## Primary-source findings

1. [Atlassian Tooltip usage](https://atlassian.design/components/tooltip/usage/) describes brief descriptions of interactive elements on hover or focus. Atlassian’s [implementation](https://bitbucket.org/atlassian/atlassian-frontend-mirror/raw/master/design-system/tooltip/src/tooltip.tsx) and [prop documentation](https://bitbucket.org/atlassian/atlassian-frontend-mirror/raw/master/design-system/tooltip/src/types.tsx) document `delay = 300` for showing and hiding. This is a mutable component-source default, not proof of every deployed Jira interaction. Relay adopts only the hover-open default; immediate focus and a shorter leave grace are deliberate differences.
2. [WAI-ARIA APG Tooltip](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/) describes Escape dismissal, focus remaining on the trigger, hovering both trigger and tooltip, `role="tooltip"`, and `aria-describedby`. APG’s tooltip pattern is marked work in progress; it is guidance, not normative WCAG.
3. [WCAG 2.2 Understanding SC 1.4.13](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html) explains dismissible, hoverable, persistent additional content. It sets no numeric delay. A leave timer alone is not a reliable substitute for a traversable hover region.
4. [APG names and descriptions](https://www.w3.org/WAI/ARIA/apg/practices/names-and-descriptions/) distinguishes a control’s name from supplementary description. An icon-only control needs a stable accessible name even when no tooltip is visible.

## Consistency safeguards

`tooltip-policy.test.ts` rejects native `title` attributes on React-owned HTML and any second `role="tooltip"` renderer. The third-party DOM bridge has a regression test for dynamic labels and removed controls. Adapter coverage checks both sidebar modes and collapse control against the same delay, motion attributes, accessible descriptions, and Escape lifecycle. Fixed portals clamp/flip at viewport edges and render inside dialog/fullscreen top layers when needed. Static labels keep their existing full accessible text; controls and associated inputs get focus-triggered descriptions without extra wrapper tab stops.

## Validation boundary

Primary sources informed implementation; they do not verify it. Regression coverage targets pointer intent, focus, Escape, hover persistence, activation, touch, description preservation, menu suppression, and timer cleanup. Browser geometry, clipping, screen-reader announcements, and reduced-motion rendering still need pre-commit review. Validation deferred to pre-commit.
