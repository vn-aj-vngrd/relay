#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
E2E_BASE_URL="${E2E_BASE_URL:-https://relay.vanajvanguardia.tech}"
BASE_URL="$E2E_BASE_URL"

export E2E_BASE_URL

printf '\n[1/4] Public production browser workflow (authenticated coverage is separate)\n'
pnpm exec playwright test e2e/smoke.spec.ts --project mobile-chromium

printf '\n[2/4] Public release endpoints\n'
for path in / /login /play /courts /robots.txt /sitemap.xml /.well-known/security.txt /api/health; do
  status="$(curl --silent --show-error --output /dev/null --write-out '%{http_code}' "$BASE_URL$path")"
  if [[ "$status" != "200" ]]; then
    printf 'FAIL %s returned %s\n' "$path" "$status" >&2
    exit 1
  fi
  printf 'PASS %s\n' "$path"
done

printf '\n[3/4] Enforced CSP\n'
headers="$(curl --silent --show-error --head "$BASE_URL/home")"
grep -qi '^content-security-policy:' <<<"$headers"
grep -qi "strict-dynamic" <<<"$headers"
if grep -qi '^content-security-policy-report-only:' <<<"$headers"; then
  echo 'FAIL CSP is still report-only' >&2
  exit 1
fi
printf 'PASS strict enforced policy present\n'

printf '\n[4/4] Shared-IP navigation burst\n'
printf 'Cooling down before the bounded burst probe…\n'
sleep 60
tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT
for _ in {1..8}; do
  curl --silent --show-error --output /dev/null --write-out '%{http_code}\n' "$BASE_URL/login" >>"$tmp" &
done
wait
if grep -qv '^200$' "$tmp"; then
  echo 'FAIL ordinary login navigation was rate-limited:' >&2
  sort "$tmp" | uniq -c >&2
  exit 1
fi
printf 'PASS 8 concurrent login navigations\n'

if [[ -n "${HEALTHCHECK_SECRET:-}" ]]; then
  curl --fail --silent --show-error \
    -H "Authorization: Bearer $HEALTHCHECK_SECRET" \
    "$BASE_URL/api/health?deep=1" |
    jq --exit-status --slurp 'length == 1 and .[0].status == "ok" and .[0].database == "reachable"' >/dev/null
  printf 'PASS private database readiness\n'
else
  printf 'SKIP private readiness (set HEALTHCHECK_SECRET to verify)\n'
fi

printf '\nPublic production checks passed. RELEASE INCOMPLETE: real authentication and an uninterrupted host/guest lifecycle require separate dated evidence. See docs/CRITICAL_USER_JOURNEYS.md.\n' >&2
exit 2
