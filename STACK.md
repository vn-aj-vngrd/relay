# Relay technology stack

This document records the technologies currently used to build, run, test, and deploy Relay. Package versions are the resolved versions in `pnpm-lock.yaml`; `package.json` remains the dependency source of truth.

## Application platform

| Layer           | Technology         | Version / role                                                             |
| --------------- | ------------------ | -------------------------------------------------------------------------- |
| Runtime         | Node.js            | Node 22 in CI and browser-test workflows; Node 24 for releases             |
| Package manager | pnpm               | 10.12.1                                                                    |
| Language        | TypeScript         | 5.9.3, strict mode                                                         |
| Web framework   | Next.js App Router | 16.3.5, React Server Components, Server Actions, route handlers, Turbopack |
| UI runtime      | React / React DOM  | 19.3.0                                                                     |
| Hosting         | Vercel             | Application functions pinned to Singapore (`sin1`)                         |
| Analytics       | Vercel Analytics   | 2.0.1                                                                      |

## Frontend

- **Tailwind CSS 4.3.3** through `@tailwindcss/postcss` for utility styling and design tokens.
- **Custom Relay component system** in `src/components`; the app does not depend on a packaged UI kit.
- **Phosphor Icons 2.1.10** for client and server-rendered icons.
- **Next Font** with Inter for the primary interface and Geist Mono for numeric/monospaced accents.
- **MapLibre GL 6.10.0** for the Philippines court finder.
- **Geoapify raster tiles**, with OpenMapTiles and OpenStreetMap attribution, proxied through a server route so the provider key stays private.
- **Lenis 1.3.26** for reduced-motion-aware smooth scrolling on the marketing surface.
- **QRCode 1.5.4** for game-sharing QR codes.
- Responsive light, dark, and system themes plus comfortable and compact density modes are implemented with CSS custom properties and device-local preferences.

## Backend and data

| Concern             | Technology                                                                                                      |
| ------------------- | --------------------------------------------------------------------------------------------------------------- |
| Application backend | Next.js Server Components, Server Actions, and route handlers                                                   |
| Database            | PostgreSQL hosted by Supabase                                                                                   |
| ORM and query layer | Drizzle ORM 0.45.2                                                                                              |
| Migrations          | Drizzle Kit 0.31.10 and SQL migrations in `drizzle/`                                                            |
| PostgreSQL driver   | `postgres` 3.4.9, using the Supabase transaction pooler with prepared statements disabled                       |
| Validation          | Zod 4.6.5 at action, API, and environment boundaries                                                            |
| Authentication      | Supabase Auth through `@supabase/ssr` 0.12.7 and `@supabase/supabase-js` 2.116.0                                |
| File storage        | Supabase Storage for avatars, group photos, chat images, payment assets, booking receipts, and session memories |
| Realtime            | Supabase Broadcast for session invalidations and Postgres Changes for user notifications                        |
| Scheduled work      | Supabase Cron for session reminders and maintenance jobs                                                        |
| Rate limiting       | PostgreSQL-backed fixed-window limiter with application-level guards                                            |

Supabase runs in Singapore (`ap-southeast-1`). Public and private storage boundaries, realtime topics, environment variables, and provisioning steps are documented in [`docs/integrations.md`](docs/integrations.md).

## Agent and rich text

- **Vercel AI SDK 7.0.105** and **`@ai-sdk/react` 4.0.108** for streaming Agent responses and chat transport.
- **OpenRouter** through **`@openrouter/ai-sdk-provider` 3.0.0**, with an administrator-selected model and server-side provider configuration.
- **Tiptap 3.31.3**, using Starter Kit, ProseMirror, and Markdown support for the Agent composer.
- **React Markdown 10.1.0** and **remark-gfm 4.0.1** for Agent answers, with raw HTML disabled and links restricted to supported Relay source routes.
- User-scoped tools query existing application services and Help Center content. Creation requires explicit first-party confirmation; model output cannot authorize mutations.
- Provider credentials are encrypted with Node.js `crypto` using AES-256-GCM. Agent configuration and capabilities are documented in [`docs/agent/README.md`](docs/agent/README.md) and [`docs/agent/CAPABILITIES.md`](docs/agent/CAPABILITIES.md).

## Authentication and notification integrations

- **Cloudflare Turnstile**, through **`@marsidev/react-turnstile` 1.6.1**, supplies CAPTCHA tokens to Supabase Auth for signup, password login, and recovery.
- **Resend SMTP** handles Supabase Auth email; application notification email uses the **Resend HTTPS API** separately.
- **Web Push 3.6.7** delivers per-device notifications using VAPID credentials and the service worker.
- A PostgreSQL outbox queues external notification delivery. The GitHub Actions notification-dispatch workflow calls the protected dispatch endpoint; delivery depends on configured credentials and the notification delivery flag.

## Progressive Web App

- Next.js-generated web app manifest with standard and maskable icons.
- Root-scoped service worker in `public/sw.js`.
- Install prompt integration where the browser exposes `beforeinstallprompt`.
- Standalone display mode, offline fallback, and a deliberately bounded cache that excludes authenticated pages, RSC payloads, APIs, map tiles, and private media.
- Next.js `experimental.useOffline` support for interrupted navigation and Server Actions.

## Quality and testing

| Tool                | Version / purpose                                             |
| ------------------- | ------------------------------------------------------------- |
| Ultracite           | 7.12.0, authoritative Biome quality policy                    |
| Biome               | 2.5.14, formatting, linting, and import organization          |
| Lefthook            | 2.1.14, staged-file and Conventional Commit validation        |
| Vitest              | 4.1.10, Node logic tests and jsdom component tests            |
| Testing Library     | React 16.3.3 and jest-dom 7.0.1                               |
| Playwright          | 1.63.0, mobile and desktop Chromium end-to-end tests          |
| axe-core Playwright | 4.13.0, browser accessibility checks                          |
| TypeScript compiler | Strict static checking with `tsc --noEmit`                    |

Validation is deferred during development. Before committing, `pnpm check:full` runs repository lint/format checks, strict typechecking, the full unit suite, and a production build. Browser E2E and reliability workflows are opt-in.

The production quality gate is documented in [`docs/CODE_QUALITY.md`](docs/CODE_QUALITY.md). The standard commands are:

```bash
pnpm check:fast
pnpm typecheck
pnpm check:full
pnpm test:e2e
```

## CI and releases

- **GitHub Actions** runs the code quality gate for pull requests and pushes to `master`; browser E2E and reliability checks have separate manual workflows.
- **CodeQL** provides automated security analysis.
- **semantic-release 25.0.9** uses Conventional Commits on `master` to create version tags and GitHub releases.
- **Vercel** hosts preview and production deployments. Release and production verification requirements live in [`docs/DEVELOPMENT_WORKFLOW.md`](docs/DEVELOPMENT_WORKFLOW.md).

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
- `scripts` — validation, migrations support, imports, backups, and release verification tooling.
- `.github/workflows` — CI, security analysis, release automation, manual browser checks, notification dispatch, and health monitoring.
