#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

printf '\n[1/7] Dependency policy\n'
node --input-type=module <<'NODE'
import { readFile } from "node:fs/promises";
const pkg = JSON.parse(await readFile("package.json", "utf8"));
const floating = Object.entries({ ...pkg.dependencies, ...pkg.devDependencies }).filter(([, version]) => version === "latest" || version === "*");
if (floating.length) throw new Error(`Floating dependency versions: ${floating.map(([name]) => name).join(", ")}`);
NODE
pnpm audit --prod

printf '\n[2/7] Formatting\n'
pnpm format:check
printf '\n[3/7] Lint\n'
pnpm lint
printf '\n[4/7] Types\n'
pnpm typecheck
printf '\n[5/7] Unit and integration tests\n'
pnpm test
printf '\n[6/7] Production build\n'
pnpm build
printf '\n[7/7] Public browser smoke tests\n'
pnpm test:e2e --grep-invert "authenticated host and guest"

printf '\nRelease code gate passed. Run scripts/verify-production-release.sh before public traffic.\n'
