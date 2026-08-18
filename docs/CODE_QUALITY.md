# Code quality gate

Read this before adding dependencies, changing TypeScript conventions, editing lint or format configuration, or preparing a production change.

## Source of truth

- Prettier owns whitespace, wrapping, quotes, and punctuation through `.prettierrc.json`.
- ESLint owns correctness and import order through `eslint.config.mjs`.
- TypeScript runs in strict mode through `tsconfig.json`.
- Vitest covers domain and integration behavior; Playwright validates complete browser workflows manually.
- Configuration files are authoritative. Keep this document focused on workflow and decisions rather than copying every option.

Generated SQL, Drizzle snapshots, the lockfile, build output, reports, and binary assets are excluded from Prettier. Review generated migrations directly instead of rewriting them mechanically.

## Change workflow

1. Write explicit TypeScript at the feature seam. Keep domain rules beside their feature and validate every untrusted boundary with Zod.
2. Add or update tests for meaningful behavior. Prefer testing the same small interface used by callers.
3. Run `pnpm lint:fix` to normalize imports, then `pnpm format` to normalize code layout.
4. Run the complete local gate:

   ```bash
   pnpm format:check
   pnpm lint
   pnpm typecheck
   pnpm test
   pnpm build
   ```

5. Run `pnpm test:e2e` manually when a route, form, authorization rule, responsive workflow, or browser interaction changes.

**Complete when:** the full local gate passes, changed behavior has useful tests, imports are automatically sorted, no lint suppression hides a fixable problem, and browser-facing changes have manual E2E evidence.

## Import discipline

`eslint-plugin-simple-import-sort` is the only import-order mechanism. Use `pnpm lint:fix`; avoid hand-maintained ordering rules or a second formatter plugin. Type-only imports remain explicit. Remove unused imports rather than suppressing the rule.

## CI contract

Every pull request and push to `master` runs formatting, lint, strict type checks, unit/integration tests, and a production build. E2E has a separate manual workflow because authenticated runs require disposable credentials and may mutate test data. A change is not releasable while the latest automated CI run is red.
