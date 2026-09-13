# Development workflow

1. Inspect the current branch and working tree, then fetch `origin/master`. For new work, create a descriptive `van/<change>` branch from that remote ref. Preserve unrelated changes in their existing branch/worktree; carry pending changes only when they belong to the requested PR. Continue an existing task on its branch instead of restarting from master.
2. Implement the scoped change using the relevant project runbooks. Maintain regression and journey coverage through [Reliability](RELIABILITY.md).
3. When committing or opening a PR is authorized, complete [the code quality gate](CODE_QUALITY.md), fix failures, and commit with hooks enabled. Push the feature branch and open a PR targeting `master`. Include the problem, final behavior, validation evidence and remaining limitations.
4. Leave the PR open for review. Merge only when the user explicitly authorizes it, the current PR head has passing CI, and review blockers are resolved. If master changes conflict with the branch, preserve both changes, resolve the conflict and validate the resulting revision before merging. Never bypass required checks.
5. Squash-merge with a Conventional Commit title so automated release notes and versioning describe the change. After merge, verify master CI and the Vercel deployment; release creation alone is not deployment evidence. Base the next new task on freshly fetched `origin/master`.

**Complete when:** the work is on its own branch, the PR targets `master`, the handoff links the PR and identifies passed/failed/pending checks, and no direct push to master was used. Opening a PR is the normal handoff; merging requires separate authorization.

Vercel previews and CI validate PRs. Merging to master triggers the existing production deployment and automated release process described in [Deployment and releases](DEPLOYMENT_AND_RELEASES.md). Heavy browser reliability suites remain manual under the reliability runbook.

## Master protection

GitHub requires a pull request with the current `Format, lint, types, tests, and build` check passing against an up-to-date base. The rule applies to administrators; force pushes and branch deletion are disabled. No additional reviewer count is required for this solo-maintainer repository. Agent merge authorization remains separate from GitHub's reviewer count.
