# Development workflow

This is the source of truth for branch, commit, PR, and merge conventions for humans and agents. Code, UI, and testing rules remain in their linked runbooks.

## Branches

1. Inspect the current branch and working tree, then fetch `origin/master`.
2. Start each independent task from that freshly fetched ref on `van/<short-kebab-case-description>`, for example `van/game-tab-spacing`. When a real ticket exists, use `van/RELAY-123/game-tab-spacing`; preserve its actual key and number rather than inventing one.
3. Continue review fixes on the existing PR branch. Keep unrelated work on separate branches/worktrees and preserve uncommitted changes before switching.

`master` is the production integration branch. Changes reach it through PRs; never push commits directly to it. Hotfixes follow the same flow. Existing bot-managed branches keep their generated names. Avoid a permanent development branch or branches named after release versions.

## Commits

Keep each commit focused on one coherent change. Use an imperative, sentence-case subject with no trailing period, ideally at most 72 characters. Explain non-obvious reasons in the body and reference related issues there.

Without a ticket in the branch, use `<type>(<optional-scope>): <Summary>`:

| Type | Use |
| --- | --- |
| `feat` | New user-facing capability |
| `fix` | Correct existing behavior |
| `perf` | Improve performance without changing behavior |
| `refactor` | Restructure code without changing behavior |
| `test` | Add or improve tests |
| `docs` | Documentation only |
| `style` | Formatting only; a visual bug fix uses `fix` |
| `build` | Build tooling or packaging |
| `ci` | CI workflows and automation |
| `chore` | Dependency updates and other maintenance |
| `revert` | Revert an earlier change |

Use a short existing domain for scopes when useful, such as `games`, `payments`, `auth`, or `deps`; omit it when the change spans domains. Examples: `fix(games): Align Play tab spacing`, `docs: Define contribution standards`.

On `<user>/<TICKET>/<slug>` branches, use `<TICKET>: <Summary>`, for example `RELAY-123: Align Play tab spacing`. The commit hook accepts the exact ticket derived from the current branch. Keep the release type in the eventual squash commit; ticket-prefixed branch commits are not the release input.

Mark incompatible changes in the squash subject with `!` and include a `BREAKING CHANGE: <impact and migration>` footer. Generated Git merge/revert messages remain accepted for branch maintenance.

## Pull requests and review

1. Implement the scoped change using existing components and the relevant runbooks. Maintain regression coverage under [Reliability](RELIABILITY.md).
2. When committing or opening a PR is authorized, complete [the code quality gate](CODE_QUALITY.md), fix failures, and commit with hooks enabled. Push the feature branch explicitly, for example `git push -u origin van/game-tab-spacing`, and target `master`.
3. Use an imperative, sentence-case PR title, ideally at most 72 characters: `Fix game tab spacing`. With a ticket: `RELAY-123: Fix game tab spacing`. The PR title is a review label; set the Conventional Commit squash subject separately at merge time.
4. Fill in the PR template with final behavior, concrete test evidence, and material risks. Keep screenshots for visual changes when captured; label unrun checks and synthetic fixtures accurately. Use `None` for sections without applicable details.
5. Read every review finding against the current code. Fix valid findings, reply with the resolution and evidence, and resolve addressed threads. Explain why an inapplicable finding does not apply. Recheck new comments and checks after pushing fixes.
6. Leave the PR open for review. Creating a PR does not authorize merging it.

## Merge and release

Merge only with explicit user authorization, passing required CI on the current PR head, an up-to-date base, and resolved review blockers. Update a published branch by merging `origin/master`; resolve conflicts while preserving both intended changes, then validate the resulting revision. Rewriting a published branch requires explicit authorization. Never bypass hooks or required checks.

Squash-merge with `<type>(<optional-scope>): <Summary>`, including the ticket in the body when applicable. Example: PR `RELAY-123: Fix game tab spacing` becomes squash subject `fix(games): Align Play tab spacing` with `Refs: RELAY-123` in the body. Inspect the generated squash message before confirming; GitHub's default title may not be release-compatible.

The release configuration in `.releaserc.json` is authoritative: breaking changes produce a major release, `feat` a minor release, and other supported types a patch release, including documentation and maintenance. Version tags and release notes are automated; follow [Deployment and releases](DEPLOYMENT_AND_RELEASES.md) rather than manually bumping package versions or creating tags.

After merge, verify master CI and the production Vercel deployment separately. Release creation alone is not deployment evidence. Delete the merged feature branch when it has no remaining work; start the next task from freshly fetched `origin/master`.

## Existing engineering standards

- [Code quality](CODE_QUALITY.md): formatting, TypeScript, dependencies, hooks, and pre-commit validation. Read scripts/configuration for exact tool versions and commands.
- [Reliability](RELIABILITY.md): regression coverage, manual browser suites, and evidence boundaries.
- [UI quality](UI_QUALITY.md) and [design](../DESIGN.md): shared components, tokens, accessibility, and product states.
- [Session parity](SESSION_SURFACE_PARITY.md): consistent authenticated/shared game surfaces.
- [Integrations](integrations.md): configuration, credentials, and migration procedures. Keep secrets and disposable-account credentials out of commits, PRs, and screenshots.

## Enforcement and handoff

The local commit-message hook enforces accepted subject syntax, not prose quality. Branch naming, PR titles, and squash subjects are review conventions. GitHub requires a PR with the current `Format, lint, types, tests, and build` check passing against an up-to-date base. The rule applies to administrators; force pushes and master deletion are disabled. This solo-maintainer repository does not require an additional reviewer count; agent merge authorization remains separate.

**Complete when:** work is on its own branch, names and messages follow this guide, the handoff identifies changes and passed/failed/deferred checks, and any authorized PR targets `master` and is linked. Validation is deferred to pre-commit unless requested earlier. Report publication or deployment only when verified.
