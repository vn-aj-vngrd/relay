# Relay

A mobile-first social pickleball session app built with Next.js, TypeScript, Supabase, PostgreSQL, and Drizzle.

## What is implemented

- Product, information architecture, authorization, domain, and design blueprints
- Responsive app shell and mobile navigation
- Useful authenticated home, games history, groups, profile, and notifications
- Fast create-session flow with progressive disclosure
- Polished public invite page with guest-friendly RSVP interaction and Open Graph metadata
- Session overview, roster, coordinated payment view, and courtside Play
- Paddle Stack with mixed or fixed partners, Mix It Up, Court Climb, and Team Round Robin
- Accessible touch scoring controls and queue presentation
- Explicit Drizzle schema for the complete V1 domain
- Tested RSVP/waitlist, expense split, queue assignment, standings, cloning, and permission rules
- Supabase server/browser client boundaries and strict environment validation

Core consumer workflows are database-backed: authentication, session creation, public guest RSVP with transactional capacity handling, rosters, live queue setup, match creation, persistent scoring, match completion, standings, chat, and profiles. Supabase Realtime publication is configured; client subscriptions and the remaining venue/group/payment/memory management slices continue from the same domain model.

## Run locally

```bash
corepack pnpm install
./scripts/setup-integrations.sh
corepack pnpm dev
```

Without Supabase credentials, the demo UI still builds because clients are instantiated only when a data-backed route uses them.

## Quality commands

```bash
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm test:e2e
corepack pnpm build
corepack pnpm db:generate
```

## Documentation

- [`PRODUCT.md`](./PRODUCT.md) — product context and principles
- [`DESIGN.md`](./DESIGN.md) — visual system
- [`docs/UI_QUALITY.md`](./docs/UI_QUALITY.md) — implementation and anti-slop quality gate
- [`docs/product-blueprint.md`](./docs/product-blueprint.md) — requirements, flows, routes, IA, domain, authorization, architecture, and milestones
- [`docs/integrations.md`](./docs/integrations.md) — Supabase, Vercel, Auth, Storage, Realtime, and credential operations
- [`docs/research/competitor-patterns.md`](./docs/research/competitor-patterns.md) — primary-source product research and scoped decisions
- [`docs/audits/2026-08-15-ui-audit.md`](./docs/audits/2026-08-15-ui-audit.md) — UI audit and remediation evidence
- [`drizzle/0000_initial_relay_schema.md`](./drizzle/0000_initial_relay_schema.md) — initial migration intent and verification

## Architecture

Business rules live with their feature in `src/features`. Pages are Server Components unless browser interaction is required. Database and Supabase clients are server-only by default. Live views should reconcile a server-rendered snapshot with narrow Supabase channels and versioned compare-and-swap mutations; the schema includes version fields for this purpose.
