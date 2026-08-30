#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
TMP=$(mktemp -d "${TMPDIR:-/tmp}/relay-signup-cap.XXXXXX")
PORT=$(python3 - <<'PY'
import socket
with socket.socket() as s:
    s.bind(("127.0.0.1", 0))
    print(s.getsockname()[1])
PY
)

cleanup() {
  pg_ctl -D "$TMP/data" -m immediate stop >/dev/null 2>&1 || true
  rm -rf "$TMP"
}
trap cleanup EXIT

initdb -D "$TMP/data" -A trust --no-locale >/dev/null
pg_ctl -D "$TMP/data" -o "-F -p $PORT -k $TMP" -w start >/dev/null
createdb -h "$TMP" -p "$PORT" relay_signup_cap_test

PSQL=(psql -X -v ON_ERROR_STOP=1 -h "$TMP" -p "$PORT" -d relay_signup_cap_test)

"${PSQL[@]}" >/dev/null <<'SQL'
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN;
CREATE ROLE supabase_auth_admin NOLOGIN;
CREATE SCHEMA auth;
CREATE TABLE public.users (id uuid PRIMARY KEY);
CREATE TABLE auth.users (email text PRIMARY KEY);
GRANT USAGE ON SCHEMA auth TO supabase_auth_admin;
GRANT SELECT ON auth.users TO supabase_auth_admin;
SQL

"${PSQL[@]}" -f "$ROOT/drizzle/0023_signup_account_cap.sql" >/dev/null

"${PSQL[@]}" >/dev/null <<'SQL'
DO $$
DECLARE result jsonb;
BEGIN
  SET LOCAL ROLE supabase_auth_admin;
  result := public.hook_enforce_signup_account_cap('{"user":{"email":"first@example.com"}}'::jsonb);
  IF result <> '{}'::jsonb THEN
    RAISE EXCEPTION 'expected signup below the cap to be allowed, got %', result;
  END IF;
END
$$;

UPDATE public.signup_settings SET account_cap = 1 WHERE id = 'global';
INSERT INTO auth.users (email) VALUES ('existing@example.com');

DO $$
DECLARE result jsonb;
BEGIN
  SET LOCAL ROLE supabase_auth_admin;
  result := public.hook_enforce_signup_account_cap('{"user":{"email":"blocked@example.com"}}'::jsonb);
  IF result #>> '{error,http_code}' <> '403' THEN
    RAISE EXCEPTION 'expected signup at the cap to be rejected, got %', result;
  END IF;
END
$$;

DELETE FROM public.signup_settings WHERE id = 'global';

DO $$
DECLARE result jsonb;
BEGIN
  SET LOCAL ROLE supabase_auth_admin;
  result := public.hook_enforce_signup_account_cap('{"user":{"email":"closed@example.com"}}'::jsonb);
  IF result #>> '{error,http_code}' <> '503' THEN
    RAISE EXCEPTION 'expected missing settings to fail closed, got %', result;
  END IF;
END
$$;

INSERT INTO public.signup_settings (id, account_cap) VALUES ('global', 5);
TRUNCATE auth.users;

CREATE OR REPLACE FUNCTION public.test_attempt_signup(candidate_email text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE result jsonb;
BEGIN
  result := public.hook_enforce_signup_account_cap(
    jsonb_build_object('user', jsonb_build_object('email', candidate_email))
  );
  IF result ? 'error' THEN
    RETURN false;
  END IF;
  PERFORM pg_sleep(0.05);
  INSERT INTO auth.users (email) VALUES (candidate_email);
  RETURN true;
END
$$;
SQL

pids=()
for index in $(seq 1 20); do
  "${PSQL[@]}" -Atqc "select public.test_attempt_signup('player-${index}@example.com')" >/dev/null &
  pids+=("$!")
done
for pid in "${pids[@]}"; do
  wait "$pid"
done

count=$("${PSQL[@]}" -Atqc "select count(*) from auth.users")
if [[ "$count" != "5" ]]; then
  echo "expected exactly 5 concurrent signups, found $count" >&2
  exit 1
fi

echo "signup account cap database tests passed"
