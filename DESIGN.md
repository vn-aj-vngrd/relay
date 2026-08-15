# Relay Design System

## Overview

Relay is a bright, courtside utility for recreational pickleball. The system is quiet around planning and assertive during live play. Its visual reference is the geometry and glanceability of a real court—not sports-broadcast decoration.

## Theme

Light-first with a true white canvas. Dark mode uses neutral near-black surfaces rather than inverted tinted colors. The palette is restrained: mineral teal is functional, coral is rare, and semantic states remain recognizable.

## Color

```css
--canvas: oklch(1 0 0);
--surface: oklch(.975 .004 170);
--surface-strong: oklch(.94 .008 170);
--ink: oklch(.19 .018 185);
--muted: oklch(.48 .018 185);
--line: oklch(.89 .01 170);
--primary: oklch(.48 .105 170);
--primary-hover: oklch(.42 .11 170);
--primary-soft: oklch(.94 .035 170);
--accent: oklch(.68 .15 35);
--success: oklch(.52 .13 145);
--warning: oklch(.69 .14 75);
--danger: oklch(.56 .18 25);
```

Primary and saturated semantic fills use white text. Secondary text maintains AA contrast. Status always pairs color with a label or icon.

## Typography

Geist Sans covers product copy, controls, and headings. Geist Mono is reserved for scores, times, currency, court numbers, and standings. The scale is compact and fixed: 12, 14, 16, 18, 22, 28, and 36px. Headings use weight and spacing rather than decorative color.

## Shape and spacing

The base unit is 4px. Common gaps are 8, 12, 16, 24, 32, and 48px. Controls have 8–12px radii, object cards 12–16px, and pills only when the shape communicates a compact status. Use dividers, whitespace, lists, and edge-to-edge mobile sections before reaching for cards.

## Layout

Mobile content is edge-to-edge with 16px gutters and persistent bottom navigation. Desktop uses a centered 1180px shell, two-column session layouts, and side-by-side courts/queue in Live Mode. Desktop density increases structurally; type does not inflate.

## Components

- Buttons: 44px minimum, solid primary for the one main action, neutral outline/quiet variants otherwise.
- Fields: labels above controls, visible focus rings, inline errors, 48px inputs.
- Session cards: reserved for discrete games; identity, plan, status, and one action.
- Avatars: use images when present and stable initials otherwise; overlapping only for compact roster summaries.
- Status: icon + plain-language label, not color alone.
- Scores: oversized tabular numerals; increment and decrement have distinct accessible labels and safe spacing.
- Navigation: global bottom bar on mobile; session-local navigation replaces emphasis during Live Mode.

## Motion

150–220ms state transitions using ease-out. Animate score changes, queue movement, RSVP confirmation, sheet transitions, and match completion only. Reduced-motion mode removes transforms and shortens transitions to near-instant.

## Signature

Court-line composition: thin mineral rules, split score fields, court labels, and queue ordering provide a consistent physical metaphor. The geometry communicates hierarchy and play state; it is never a decorative background pattern.
