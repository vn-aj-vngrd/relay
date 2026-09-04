# Code quality gate

Read this before adding dependencies, changing TypeScript or Ultracite/Biome conventions, or preparing a production change.

## Source of truth

- Ultracite defines the quality policy through the pinned Biome presets in `biome.jsonc`.
- Biome owns formatting, linting, import organization, and other safe source assists.
- TypeScript runs in strict mode through `tsconfig.json`; it remains the type-aware gate so Biome can keep its subsecond repository scan.
- Vitest uses a Node project for logic tests and a jsdom project for component tests.
- Playwright validates complete browser workflows manually.

Generated SQL, Drizzle snapshots, the lockfile, build output, reports, public assets, and binary assets are excluded from Biome. Review generated migrations directly instead of rewriting them mechanically.

## Efficient agent validation

Use the smallest check that can falsify the current change. Run each check after a logical checkpoint, and do not repeat an unchanged passing check.

1. Run `pnpm check:fast` for changed-file Ultracite/Biome validation. It never starts tests.
2. For isolated behavior, run the directly affected test file with `pnpm exec vitest run <test-file>`.
3. Add `pnpm typecheck` when TypeScript contracts, imports, server/client boundaries, or generated types could be affected.
4. Add `pnpm test:related` when a change has meaningful import fan-out and one direct test is insufficient. It never falls back to the full suite.
5. Use `pnpm check:fix` only when fixes are needed; review the resulting diff.

Documentation-only and formatting-only work usually stops after the changed-file check. At handoff, report which validation ran and which broader checks were intentionally deferred to CI.

## Full gate

Run `pnpm check:full` for cross-cutting changes to shared configuration, dependencies, schemas, build behavior, or release-critical paths. It runs the complete Ultracite/Biome check, strict typecheck, full test suite, and production build. CI runs this coverage for every push, so isolated low-risk work does not need to duplicate it locally.

Run `pnpm test:e2e` manually when a route, form, authorization rule, responsive workflow, or browser interaction changes.

**Complete when:** validation is proportional to risk, changed behavior has useful targeted tests, no suppression hides a fixable problem, and the handoff names any checks deferred to CI.

## Import discipline

Biome is the only import-order mechanism. Use `pnpm check:fix`; avoid hand-maintained ordering or a second formatter plugin. Type-only imports remain explicit. Remove unused imports rather than suppressing the rule.

## Hooks

Lefthook validates staged supported files without modifying them. Commit subjects use a Conventional Commit prefix. Hooks provide early feedback; CI remains authoritative.

## CI contract

Every pull request and push to `master` runs Ultracite/Biome, strict type checks, unit/integration tests, and a production build. E2E has a separate manual workflow because authenticated runs require disposable credentials and may mutate test data. A change is not releasable while the latest automated CI run is red.
