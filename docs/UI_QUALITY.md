# UI quality gate

Read this before changing product UI, interaction copy, design tokens, responsive behavior, loading/empty/error states, or shared components. `DESIGN.md` remains the visual source of truth; this document defines the review process that keeps implementation faithful.

## Outcome

A fluent consumer should trust the interface immediately. Every visible choice must improve hierarchy, state comprehension, action clarity, courtside use, or product identity.

## Process

### 1. Ground the surface

Write down the user, physical context, and one job of the surface. For Relay, assume a phone in one hand while messaging, traveling, paying, or standing beside a court. Name the state being designed: first use, planning, full roster, waitlisted, live, completed, loading, offline, denied, or failed.

**Complete when:** the surface has one primary job and every required state is named.

### 2. Use the system

Read `DESIGN.md`. Reuse its tokens, typography, control shapes, spacing rhythm, court geometry, and component vocabulary. Extend a token only when an existing role cannot express real product meaning. Keep Apple influence at the level of hierarchy, material discipline, native behavior, and polish—not imitation.

**Complete when:** colors use semantic tokens, controls use the shared button sizes and existing affordances, and the visual signature encodes session/court structure.

### 3. Build hierarchy before decoration

Order content by the decision a person must make. Use type, alignment, whitespace, rows, and dividers first. Use a card only for a discrete object such as a session or active match. Navigation material may blur because it floats over content; content surfaces stay opaque.

**Complete when:** the screen remains understandable in grayscale and no decoration is carrying product meaning.

### 4. Make interaction explicit

Use links for navigation and buttons for actions. Keep one solid primary action per decision area. Labels name outcomes. Mutations show pending, success, failure, permission, and reconnecting states. Destructive actions require confirmation or undo. Standard actions use the 36–40px button system; score controls remain 64px.

**Complete when:** keyboard, touch, and assistive-technology users can complete the same workflow without guessing.

### 5. Run the anti-slop review

Keep only elements that encode hierarchy, state, action, or real sport structure. The approved Relay signature is a deep court field, crisp divisions, court-blue action areas, optic-yellow readiness cues, live coral, queue rows, and scoreboard numerals.

Hard guardrails:

- Content uses opaque surfaces; blur belongs to navigation chrome.
- Color stays restrained outside session identity and Live Mode.
- Cards represent discrete objects; lists and sections carry the rest.
- Headings use the platform/Geist product stack; display novelty never enters controls.
- Product motion communicates state in 140–220ms. Marketing chapter reveals may use the deliberate 650–900ms editorial pace defined in `DESIGN.md`; every mode honors reduced motion.
- Radius stays 10–16px except circles and semantic pills.
- Shadows are inset highlights or floating-chrome elevation with at most 8px blur.
- Court lines divide real teams, courts, or information regions.
- Copy is direct, specific, and free of promotional filler.

Reject the change when it introduces decorative gradients, glowing blobs, gradient text, glass content cards, repeated icon-card grids, hero metrics, oversized radii, wide ghost shadows, decorative all-caps labels, arbitrary sports art, fake broadcast graphics, or a dashboard of generic statistics.

**Complete when:** every visible element has a product reason and the surface could not be mistaken for a generic SaaS template.

### 6. Verify

Run:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

Use Agent Browser at 390px and 1440px in light and dark mode. Check the accessibility tree, console errors, horizontal overflow, focus order, target sizes, reduced motion, long text, empty data, and a realistic end-to-end workflow.

**Complete when:** automated checks pass, WCAG AA contrast holds, no horizontal overflow exists, controls meet WCAG 2.2 target sizing, every interactive control is labeled, and browser evidence covers the changed workflow.

## Review output

Record issues as `P0` blocking, `P1` major, `P2` minor, or `P3` polish. Include location, user impact, standard, and concrete correction. Fix P0/P1 before release; keep P3 sparse.
