#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-}"
if [[ "$MODE" != "on" && "$MODE" != "off" ]]; then
  echo "Usage: $0 <on|off>" >&2
  exit 64
fi

if ! command -v vercel >/dev/null 2>&1; then
  echo "Vercel CLI is required." >&2
  exit 69
fi

if [[ "$MODE" == "on" ]]; then
  printf 'true\n' | vercel env add RELAY_READ_ONLY_MODE production --force
else
  vercel env rm RELAY_READ_ONLY_MODE production --yes >/dev/null 2>&1 || true
fi

vercel deploy --prod --yes
echo "Production read-only mode is $MODE."
