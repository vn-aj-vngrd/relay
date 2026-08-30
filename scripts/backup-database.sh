#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
: "${DATABASE_URL:?Set DATABASE_URL to the production transaction-pooler URI}"
BACKUP_DIR="${BACKUP_DIR:-$HOME/Relay Backups}"
repo="$(pwd -P)"
mkdir -p "$BACKUP_DIR"
backup_dir="$(cd "$BACKUP_DIR" && pwd -P)"
if [[ "$backup_dir" == "$repo"* ]]; then
  echo "Refusing to store a production backup inside the repository." >&2
  exit 1
fi

stamp="$(date -u +%Y%m%dT%H%M%SZ)"
archive="$backup_dir/relay-$stamp.dump"
manifest="$archive.sha256"

umask 077
server_major="$(psql "$DATABASE_URL" --no-psqlrc --tuples-only --no-align --command="show server_version_num" | awk '{ print int($1 / 10000) }')"
requested_pg_dump="${PG_DUMP:-}"
pg_dump_bin=""
for candidate in \
  "$requested_pg_dump" \
  "$(command -v pg_dump 2>/dev/null || true)" \
  "/opt/homebrew/opt/postgresql@${server_major}/bin/pg_dump" \
  "/usr/local/opt/postgresql@${server_major}/bin/pg_dump" \
  "/opt/homebrew/opt/libpq/bin/pg_dump" \
  "/usr/local/opt/libpq/bin/pg_dump"; do
  [[ -n "$candidate" && -x "$candidate" ]] || continue
  client_major="$($candidate --version | sed -E 's/.*PostgreSQL\) ([0-9]+).*/\1/')"
  [[ "$client_major" =~ ^[0-9]+$ ]] || continue
  if (( client_major >= server_major )); then
    pg_dump_bin="$candidate"
    break
  fi
done
if [[ -z "$pg_dump_bin" || ! -x "$pg_dump_bin" ]]; then
  echo "PostgreSQL ${server_major}+ client tools are required to back up this PostgreSQL ${server_major} server." >&2
  exit 1
fi
pg_restore_bin="$(dirname "$pg_dump_bin")/pg_restore"
"$pg_dump_bin" "$DATABASE_URL" --format=custom --no-owner --no-acl --file="$archive"
"$pg_restore_bin" --list "$archive" >/dev/null
if command -v shasum >/dev/null 2>&1; then
  shasum -a 256 "$archive" >"$manifest"
else
  sha256sum "$archive" >"$manifest"
fi
chmod 600 "$archive" "$manifest"
printf 'Backup created and structurally verified:\n  %s\n  %s\n' "$archive" "$manifest"
printf 'Store it in encrypted private storage and run the isolated restore drill in docs/PUBLIC_RELEASE_AUDIT.md.\n'
