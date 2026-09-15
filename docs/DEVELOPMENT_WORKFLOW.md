# Development workflow

This is the source of truth for branch, commit, PR, and merge conventions for humans and agents. Code, UI, and testing rules remain in their linked runbooks.

## Authorization

A user request to create a PR authorizes the scoped commit, push, review fixes, squash merge and normal production rollout once the gates below pass. Continue through production verification without asking again. An explicit request for a draft, review-only work, or leaving the PR open overrides this default. A code-edit request alone still stops before committing.

Pause only for a blocker that needs user input, such as unavailable credentials, a product decision or an operation outside the authorized scope. State the blocker and complete independent work first. Keep branch protection, required checks and hooks enabled.

## Branches

1. Inspect the current branch and working tree, then fetch `origin/master`.
2. Start each independent task from that freshly fetched ref on `van/<short-kebab-case-description>`, for example `van/game-tab-spacing`. When a real ticket exists, use `van/RELAY-123/game-tab-spacing`; preserve its actual key and number rather than inventing one.
3. Continue review fixes on the existing PR branch. Keep unrelated work on separate branches/worktrees and preserve uncommitted changes before switching.

`master` is the production integration branch. Changes reach it through PRs; never push commits directly to it. Hotfixes follow the same flow. Existing bot-managed branches keep their generated names. Avoid a permanent development branch or branches named after release versions.

## Commits

Keep each commit focused on one coherent change. Use an imperative, sentence-case subject with no trailing period, ideally at most 72 characters. Explain non-obvious reasons in the body and reference related issues there.

For every branch, including ticket branches, use `<type>(<optional-scope>): <Summary>`:

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

Keep ticket references in the commit body, for example `Refs: RELAY-123`. Ticket branches still use a Conventional Commit subject; `RELAY-123: Summary` is not accepted.

Mark incompatible changes in the squash subject with `!` and include a `BREAKING CHANGE: <impact and migration>` footer. Generated Git merge/revert messages remain accepted for branch maintenance.

## Pull requests and review

1. Implement the scoped change using existing components and the relevant runbooks. Maintain regression coverage under [Reliability](RELIABILITY.md).
2. When committing or opening a PR is authorized, complete [the code quality gate](CODE_QUALITY.md), fix failures, and commit with hooks enabled. Push the feature branch explicitly, for example `git push -u origin van/game-tab-spacing`, and target `master`.
3. Use `<type>(<optional-scope>): <Summary>` for every PR title, ideally at most 72 characters, with an imperative, sentence-case summary. Example: `feat(story): Add photo memories`. Keep ticket references in the PR body. Choose the type for the final combined change: new functionality uses `feat`, corrections use `fix`, and incompatible changes use `!` plus a `BREAKING CHANGE:` footer in the squash body. Do not copy the last fix commit type when the PR as a whole adds a feature. The required CI check validates titles on opening, new commits, reopening, title edits and readiness changes.
4. Fill in the PR template with final behavior, concrete test evidence, and material risks. Keep screenshots for visual changes when captured; label unrun checks and synthetic fixtures accurately. Use `None` for sections without applicable details.
5. Inspect PR conversation comments, submitted reviews and every unresolved inline thread, including bot findings and outdated threads. Read each finding against current code. Fix valid findings, reply with the resolution and evidence, and resolve addressed threads. Explain inapplicable findings before resolving them. Complete when every actionable finding is addressed and every remaining blocker is identified.
6. After each push, wait for required CI, security analysis, deployment checks and requested reviews to finish on the latest head. Record an optional reviewer’s quota or service failure as unavailable; a required review remains a blocker. Fix failures and repeat the affected validation. Immediately before merging, refresh the head SHA, base status, comments, reviews and unresolved threads; proceed only when the same head is current, checks pass and review blockers are resolved.

## Merge and release

Under the authorization above, merge once required CI and deployment checks pass on the current PR head, the base is up to date, requested reviews have finished or are documented as unavailable when optional, and review blockers are resolved. Update a published branch by merging `origin/master`; resolve conflicts while preserving both intended changes, then validate the resulting revision. Rewriting a published branch requires explicit authorization. Never bypass hooks or required checks.

GitHub is configured to default squash subjects to the PR title (`PR_TITLE`), even for single-commit PRs. Squash-merge using the validated PR title unchanged as the commit subject. Keep ticket references and breaking-change details in the body. Inspect the generated squash message before confirming. Semantic-release sees the single squash commit, not the original PR commits; generated notes summarize that subject rather than expanding every body bullet. Use a clear product-facing summary and do not assume the PR description becomes release notes.

The release configuration in `.releaserc.json` is authoritative: breaking changes produce a major release, `feat` a minor release, and other supported types a patch release, including documentation and maintenance. Version tags and release notes are automated; follow [Deployment and releases](DEPLOYMENT_AND_RELEASES.md) rather than manually bumping package versions or creating tags.

After merge, verify master CI, release status and the production Vercel deployment separately. Confirm the production build identity matches the merged commit and open the requested production surface. Report credential or authenticated-journey gaps explicitly; release creation alone is not deployment evidence. Delete the merged feature branch when it has no remaining work; start the next task from freshly fetched `origin/master`.

## Existing engineering standards

- [Code quality](CODE_QUALITY.md): formatting, TypeScript, dependencies, hooks, and pre-commit validation. Read scripts/configuration for exact tool versions and commands.
- [Reliability](RELIABILITY.md): regression coverage, manual browser suites, and evidence boundaries.
- [UI quality](UI_QUALITY.md) and [design](../DESIGN.md): shared components, tokens, accessibility, and product states.
- [Session parity](SESSION_SURFACE_PARITY.md): consistent authenticated/shared game surfaces.
- [Integrations](integrations.md): configuration, credentials, and migration procedures. Keep secrets and disposable-account credentials out of commits, PRs, and screenshots.

## Enforcement and handoff

The local commit-message hook and required PR CI share one subject validator. Generated Git merge/revert commits are accepted for branch maintenance only; PR titles must always use Conventional Commits. Title edits rerun CI so a previously valid title cannot silently become invalid. Branch naming, prose quality and the final squash dialog remain review responsibilities. GitHub requires a PR with the current `Format, lint, types, tests, and build` check passing against an up-to-date base. The rule applies to administrators; force pushes and master deletion are disabled. This solo-maintainer repository does not require an additional reviewer count; follow the Authorization section for agent scope.

**Complete when:** the handoff links the PR, accounts for review findings and current-head checks, and reports the verified merge, master CI, release and production build identity. For an explicit draft/review-only request or a blocker, state exactly where work stopped. Validation is deferred to pre-commit unless requested earlier; publication and deployment claims require observed evidence.
