# Code quality gate

Read this before adding dependencies, changing TypeScript or Ultracite/Biome conventions, or preparing a production change.

## Source of truth

- Ultracite defines the quality policy through the pinned Biome presets in `biome.jsonc`.
- Biome owns formatting, linting, import organization, and other safe source assists.
- TypeScript runs in strict mode through `tsconfig.json`; it remains the type-aware gate so Biome can keep its subsecond repository scan.
- Vitest uses a Node project for logic tests and a jsdom project for component tests.
- Playwright validates complete browser workflows manually.

Generated SQL, Drizzle snapshots, the lockfile, build output, reports, public assets, and binary assets are excluded from Biome. Review generated migrations directly instead of rewriting them mechanically.

## Tight agent loop

During implementation, run:

```bash
pnpm check:fast
```

This checks changed files and runs tests related to changed source. Use `pnpm check:changed` for quality checks only, `pnpm check:fix` to apply explicit fixes, and `pnpm test:related` for related tests only. Run `pnpm typecheck` at logical checkpoints. Prefer a directly affected test file while diagnosing a failure.

Production builds and the full test suite belong at handoff rather than after every edit.

## Complete gate

Before handoff, run:

```bash
pnpm check:full
```

This runs the full Ultracite/Biome check, strict typecheck, complete test suite, and production build. Run `pnpm test:e2e` manually when a route, form, authorization rule, responsive workflow, or browser interaction changes.

**Complete when:** the full gate passes, changed behavior has useful tests, no suppression hides a fixable problem, and browser-facing changes have manual E2E evidence.

## Import discipline

Biome is the only import-order mechanism. Use `pnpm check:fix`; avoid hand-maintained ordering or a second formatter plugin. Type-only imports remain explicit. Remove unused imports rather than suppressing the rule.

## Hooks

Lefthook validates staged supported files without modifying them. Commit subjects use a Conventional Commit prefix. Hooks provide early feedback; CI remains authoritative.

## CI contract

Every pull request and push to `master` runs Ultracite/Biome, strict type checks, unit/integration tests, and a production build. E2E has a separate manual workflow because authenticated runs require disposable credentials and may mutate test data. A change is not releasable while the latest automated CI run is red.
