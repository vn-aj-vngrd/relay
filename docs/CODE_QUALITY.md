# Code quality gate

Read this before adding dependencies, changing TypeScript or Ultracite/Biome conventions, or preparing a production change.

## Source of truth

- Ultracite defines the quality policy through the pinned Biome presets in `biome.jsonc`.
- Biome owns formatting, linting, import organization, and other safe source assists.
- TypeScript runs in strict mode through `tsconfig.json`; it remains the type-aware gate so Biome can keep its subsecond repository scan.
- Vitest uses a Node project for logic tests and a jsdom project for component tests.
- Playwright validates complete browser workflows manually.

Generated SQL, Drizzle snapshots, the lockfile, build output, reports, public assets, and binary assets are excluded from Biome. Review generated migrations directly instead of rewriting them mechanically.

## Validation timing

Follow the Development loop in `AGENTS.md`: automated validation is deferred to pre-commit unless the user explicitly requests it earlier.

Before committing code, run `pnpm check:full`. Documentation-only changes use `pnpm check:fast`. Fix failures before committing; rerun affected checks after fixes, without repeating unchanged passing checks.

## Targeted validation

When the user requests earlier validation or a pre-commit failure needs investigation, use the smallest check that can falsify the change:

1. Run `pnpm check:fast` for changed-file Ultracite/Biome validation. It never starts tests.
2. For isolated behavior, run the directly affected test file with `pnpm exec vitest run <test-file>`.
3. Add `pnpm typecheck` when TypeScript contracts, imports, server/client boundaries, or generated types could be affected.
4. Add `pnpm test:related` when a change has meaningful import fan-out and one direct test is insufficient. It never falls back to the full suite.
5. Use `pnpm check:fix` only when fixes are needed; review the resulting diff.

At handoff, report which validation ran and which checks remain deferred to pre-commit or CI.

## Full gate

`pnpm check:full` runs the complete Ultracite/Biome check, strict typecheck, full test suite, and production build. CI independently runs this coverage.

At pre-commit, also run `pnpm test:e2e` when a route, form, authorization rule, responsive workflow, or browser interaction changes. If required credentials or services are unavailable, report the blocker rather than claiming verification.

**Complete when:** validation is proportional to risk, changed behavior has useful targeted tests, no suppression hides a fixable problem, and the handoff names any checks deferred to CI.

## Import discipline

Biome is the only import-order mechanism. Use `pnpm check:fix`; avoid hand-maintained ordering or a second formatter plugin. Type-only imports remain explicit. Remove unused imports rather than suppressing the rule.

## Hooks

Lefthook validates staged supported files without modifying them. Commit subjects use a Conventional Commit prefix. The agent's pre-commit validation above is separate from the installed hooks; the hooks do not run the full gate. Keep hooks enabled; CI remains authoritative.

## CI contract

Every pull request and push to `master` runs Ultracite/Biome, strict type checks, unit/integration tests, and a production build. E2E has a separate manual workflow because authenticated runs require disposable credentials and may mutate test data. A change is not releasable while the latest automated CI run is red.
