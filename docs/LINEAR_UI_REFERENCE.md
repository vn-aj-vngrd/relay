# Linear UI baseline

Read this while Relay is using Linear as a temporary product-UI baseline. `DESIGN.md` remains the product-specific source of truth. This reference defines the interaction and component discipline to match before Relay develops a more unique visual identity.

## Primary research

- [How we redesigned the Linear UI](https://linear.app/now/how-we-redesigned-the-linear-ui)
- [A calmer interface for a product in motion](https://linear.app/now/behind-the-latest-design-refresh)
- [Linear preferences](https://linear.app/docs/account-preferences)
- Direct review of `linear.app/login` and Linear’s published interface screenshots.

## Observed system

- The content surface leads; navigation recedes.
- Sidebar rows are compact, precisely aligned, and vertically spaced without becoming oversized.
- Inactive navigation text and icons are muted. The active row uses a quiet neutral surface rather than a saturated tile.
- Icons are small, refined, and sparse. Decorative icon backgrounds are removed.
- Navigation never swaps its icon for a loading spinner. Route loading belongs to the destination surface or a shared progress treatment.
- Main content sits on a foreground panel distinct from the quieter app shell.
- Borders are softened and used only where they explain structure.
- Tabs are compact, rounded, and content-width rather than stretched across the viewport.
- Inter carries the interface. Headings use restrained weight and scale; labels remain regular Inter.
- Themes derive from a base, accent, and contrast relationship in a perceptual color space. Light mode uses a crisp, slightly warm neutral; dark mode uses neutral charcoal.
- Accent color is reserved for selection, focus, and primary action.

## Relay implementation contract

- Use Inter for interface text and Geist Mono only for scores, currency, queue order, and times.
- Desktop sidebar: 232px, 14px labels, 18px Phosphor icons, 36px rows, 6px row radius.
- Mobile tabs: edge-to-edge bottom bar, 21px Phosphor icons, no floating capsule.
- Main foreground panel begins at desktop breakpoint with a subtle keyline and 12px top-left radius.
- Controls use 8px radius by default; session and live-match objects may use 12px.
- Use `--surface-strong` for selected rows and compact segmented controls, not feature-card decoration.
- Keep Relay’s court field, score typography, optic ball, and live state as product-specific exceptions.
- Keep authentication marketing context, but present it as quiet product information rather than a campaign hero.

## Guardrails

Match Linear’s hierarchy, density, alignment, component behavior, and theme discipline—not its logo, copy, proprietary glyphs, or product-specific information architecture. Relay remains a recreational pickleball product.
