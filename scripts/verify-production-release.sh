#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
E2E_BASE_URL="${E2E_BASE_URL:-https://relay-pickleball.vercel.app}"
BASE_URL="$E2E_BASE_URL"

: "${E2E_AUTH_EMAIL:?Set E2E_AUTH_EMAIL to a disposable production test account}"
: "${E2E_AUTH_PASSWORD:?Set E2E_AUTH_PASSWORD for the disposable account}"
: "${E2E_AUTH_EXISTING:=true}"
export E2E_BASE_URL E2E_AUTH_EMAIL E2E_AUTH_PASSWORD E2E_AUTH_EXISTING

printf '\n[1/4] Production browser workflow (serial to avoid manufacturing edge abuse)\n'
pnpm exec playwright test --project mobile-chromium
printf 'Cooling down before the mutation-heavy authenticated workflow…\n'
sleep 60
pnpm exec playwright test --project desktop-authenticated

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
    "$BASE_URL/api/health?deep=1" >/dev/null
  printf 'PASS private database readiness\n'
else
  printf 'SKIP private readiness (set HEALTHCHECK_SECRET to verify)\n'
fi

printf '\nProduction release verification passed. Record the run in docs/PUBLIC_RELEASE_AUDIT.md.\n'
