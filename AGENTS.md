<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Development loop

- **PR workflow:** Start new work on a `van/` branch from freshly fetched `origin/master`. Read `docs/DEVELOPMENT_WORKFLOW.md` before naming branches or commits, opening or reviewing a PR, or merging; it defines naming, review, and release-message standards. Changes reach `master` through a PR with passing checks; never push commits directly to `master`. Creating a PR does not authorize merging it.

- **Defer validation:** During development, focus on implementation. Do not automatically run linting, formatting checks, typechecking, tests, builds, or hook commands after edits or at ordinary handoff. Run checks earlier only when the user explicitly requests them (including test-first work).
- **Journey coverage:** Maintain relevant E2E coverage when changing critical user behavior. Running E2E or dispatching its workflows remains opt-in and is excluded from pre-commit; follow `docs/RELIABILITY.md`.
- **Unit tests are mandatory:** Unit tests are part of the code quality gate, not opt-in. Add or update them for changed behavior and run the full unit suite before committing code via `pnpm check:full`. Validation timing still follows the rules above.
- **Before committing:** Run the validation gate in `docs/CODE_QUALITY.md`, fix failures, and then commit. Keep Git hooks and CI enabled; never bypass them. A request to edit code is not permission to commit.
- **Handoff:** State “Validation deferred to pre-commit” when checks have not run; do not imply the change is verified.

## Consistency first

Before designing or implementing a change, search the codebase for the closest existing feature and read its implementation. Reuse its components, helpers, and conventions; extend shared code when multiple surfaces need the same behavior.

Match related surfaces in layout, controls, copy, interactions, loading/empty/error states, responsive behavior, and accessibility. Apply the same discipline to APIs, data access, authorization, and tests. Use documented standards to resolve conflicting patterns rather than copying an existing defect.

**Complete when:** the handoff names the existing implementation used as the reference, identifies what was reused, and explains any intentional differences. A new pattern needs a concrete requirement the existing patterns cannot meet. Validation timing remains governed by the Development loop above.

## Project runbooks

- **Reliability:** Read `docs/RELIABILITY.md` when changing user behavior, fixing a product bug, or assessing release readiness. Complete its regression coverage and evidence criteria.

- **Code quality:** Read `docs/CODE_QUALITY.md` before adding dependencies, changing TypeScript or Ultracite/Biome conventions, or preparing a production change. Follow the Development loop above for validation timing; CI remains authoritative.
- **Integrations:** Read `docs/integrations.md` before provisioning, rotating credentials, changing auth/storage/realtime configuration, or applying the baseline migration.
- **UI quality:** Read `DESIGN.md` and `docs/UI_QUALITY.md` before changing UI, interaction copy, tokens, responsive behavior, or product states. Apply every completion criterion and run the anti-slop review before shipping.
- **Session parity:** Read `docs/SESSION_SURFACE_PARITY.md` before changing authenticated game routes, shared RSVP routes, session tabs, Play, roster, payments, chat, or their loading states.
