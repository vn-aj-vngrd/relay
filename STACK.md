# Relay technology stack

This document records the technologies currently used to build, run, test, and deploy Relay. Versions are the locally resolved versions in `pnpm-lock.yaml`; `package.json` remains the dependency source of truth.

## Application platform

| Layer | Technology | Version / role |
| --- | --- | --- |
| Runtime | Node.js | Node 22 for local development and tooling |
| Package manager | pnpm | 10.12.1 |
| Language | TypeScript | 5.9.3, strict mode |
| Web framework | Next.js App Router | 16.3.1, React Server Components, Server Actions, route handlers, Turbopack |
| UI runtime | React / React DOM | 19.2.8 |
| Hosting | Vercel | Application functions pinned to Singapore (`sin1`) |
| Analytics | Vercel Analytics | 2.0.1 |

## Frontend

- **Tailwind CSS 4.3.3** through `@tailwindcss/postcss` for utility styling and design tokens.
- **Custom Relay component system** in `src/components`; the app does not depend on a packaged UI kit.
- **Phosphor Icons 2.1.10** for client and server-rendered icons.
- **Next Font** with Inter for the primary interface and Geist Mono for numeric/monospaced accents.
- **MapLibre GL 6.4.1** for the Cebu court map.
- **Geoapify raster tiles**, with OpenMapTiles and OpenStreetMap attribution, proxied through a server route so the provider key stays private.
- **Lenis 1.3.26** for reduced-motion-aware smooth scrolling on the marketing surface.
- Responsive light, dark, and system themes plus comfortable and compact density modes are implemented with CSS custom properties and device-local preferences.

## Backend and data

| Concern | Technology |
| --- | --- |
| Application backend | Next.js Server Components, Server Actions, and route handlers |
| Database | PostgreSQL hosted by Supabase |
| ORM and query layer | Drizzle ORM 0.45.2 |
| Migrations | Drizzle Kit 0.31.10 and SQL migrations in `drizzle/` |
| PostgreSQL driver | `postgres` 3.4.9, using the Supabase transaction pooler with prepared statements disabled |
| Validation | Zod 4.4.3 at action, API, and environment boundaries |
| Authentication | Supabase Auth through `@supabase/ssr` and `@supabase/supabase-js` |
| File storage | Supabase Storage for avatars, group photos, chat images, payment assets, booking receipts, and session memories |
| Realtime | Supabase Broadcast for session invalidations and Postgres Changes for user notifications |
| Scheduled work | Supabase Cron for session reminders and maintenance jobs |
| Rate limiting | PostgreSQL-backed fixed-window limiter with application-level guards |

Supabase runs in Singapore (`ap-southeast-1`). Public and private storage boundaries, realtime topics, environment variables, and provisioning steps are documented in [`docs/integrations.md`](docs/integrations.md).

## Progressive Web App

- Next.js-generated web app manifest with standard and maskable icons.
- Root-scoped service worker in `public/sw.js`.
- Install prompt integration where the browser exposes `beforeinstallprompt`.
- Standalone display mode, offline fallback, and a deliberately bounded cache that excludes authenticated pages, RSC payloads, APIs, map tiles, and private media.
- Next.js `experimental.useOffline` support for interrupted navigation and Server Actions.

## Quality and testing

| Tool | Version / purpose |
| --- | --- |
| Vitest | 4.1.10, unit and component tests in jsdom |
| Testing Library | React 16.3.2 and jest-dom 7.0.1 |
| Playwright | 1.62.1, mobile and desktop Chromium end-to-end tests |
| axe-core Playwright | 4.13.0, browser accessibility checks |
| ESLint | 9.39.5 with Next.js rules and simple import sorting |
| Prettier | 3.9.6 |
| TypeScript compiler | Strict static checking with `tsc --noEmit` |

The production quality gate is documented in [`docs/CODE_QUALITY.md`](docs/CODE_QUALITY.md). The standard commands are:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

## Repository structure

- `src/app` — Next.js routes, layouts, loading states, and route handlers.
- `src/features` — feature-owned UI, actions, queries, and domain rules.
- `src/components` — shared navigation, primitives, and interface components.
- `src/db` — Drizzle client and PostgreSQL schema.
- `drizzle` — ordered SQL migrations and migration metadata.
- `supabase` — local and hosted Supabase configuration.
- `e2e` — Playwright workflows.
- `public` — PWA assets, service worker, and static media.
- `docs` — runbooks, quality standards, research, and architecture guidance.
