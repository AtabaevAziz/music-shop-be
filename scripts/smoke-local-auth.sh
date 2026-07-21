#!/usr/bin/env bash

set -euo pipefail

API_BASE_URL="${API_BASE_URL:-http://localhost:8080/api/v1}"
CLIENT_ORIGIN="${CLIENT_ORIGIN:-http://localhost:3000}"
ADMIN_LOGIN="${ADMIN_LOGIN:-admin}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-Secret!1}"

COOKIE_JAR="$(mktemp)"
HEADERS_FILE="$(mktemp)"
BODY_FILE="$(mktemp)"

cleanup() {
  rm -f "$COOKIE_JAR" "$HEADERS_FILE" "$BODY_FILE"
}

trap cleanup EXIT

request() {
  local method="$1"
  local endpoint="$2"
  local body="${3:-}"

  : > "$HEADERS_FILE"
  : > "$BODY_FILE"

  local curl_args=(
    --silent
    --show-error
    --location
    --request "$method"
    --header "Accept: application/json"
    --header "Origin: ${CLIENT_ORIGIN}"
    --cookie "$COOKIE_JAR"
    --cookie-jar "$COOKIE_JAR"
    --dump-header "$HEADERS_FILE"
    --output "$BODY_FILE"
  )

  if [[ -n "$body" ]]; then
    curl_args+=(
      --header "Content-Type: application/json"
      --data "$body"
    )
  fi

  curl "${curl_args[@]}" "${API_BASE_URL}/${endpoint}" --write-out "%{http_code}"
}

assert_status() {
  local expected="$1"
  local actual="$2"
  local context="$3"

  if [[ "$actual" != "$expected" ]]; then
    echo "Smoke check failed for ${context}: expected HTTP ${expected}, got ${actual}." >&2
    echo "Response body:" >&2
    cat "$BODY_FILE" >&2
    exit 1
  fi
}

assert_body_contains() {
  local pattern="$1"
  local context="$2"

  if ! grep -Fq "$pattern" "$BODY_FILE"; then
    echo "Smoke check failed for ${context}: response did not contain ${pattern}." >&2
    echo "Response body:" >&2
    cat "$BODY_FILE" >&2
    exit 1
  fi
}

echo "1/5 Checking health endpoint at ${API_BASE_URL}/health"
status_code="$(request GET "health")"
assert_status "200" "$status_code" "GET /health"
assert_body_contains '"status":"ok"' "GET /health"

echo "2/5 Checking anonymous session"
status_code="$(request GET "auth/session")"
assert_status "200" "$status_code" "GET /auth/session before login"
assert_body_contains '"session":null' "GET /auth/session before login"

echo "3/5 Logging in as ${ADMIN_LOGIN}"
login_payload="$(printf '{"login":"%s","password":"%s"}' "$ADMIN_LOGIN" "$ADMIN_PASSWORD")"
status_code="$(request POST "auth/login" "$login_payload")"
assert_status "200" "$status_code" "POST /auth/login"
assert_body_contains '"session":' "POST /auth/login"
assert_body_contains '"role":"' "POST /auth/login"

if ! grep -Fiq 'set-cookie:' "$HEADERS_FILE"; then
  echo "Smoke check failed for POST /auth/login: missing Set-Cookie header." >&2
  exit 1
fi

echo "4/5 Checking authenticated session via cookie jar"
status_code="$(request GET "auth/session")"
assert_status "200" "$status_code" "GET /auth/session after login"
assert_body_contains "\"name\":" "GET /auth/session after login"
assert_body_contains '"session":{' "GET /auth/session after login"

echo "5/5 Logging out and verifying session reset"
status_code="$(request POST "auth/logout")"
assert_status "204" "$status_code" "POST /auth/logout"

status_code="$(request GET "auth/session")"
assert_status "200" "$status_code" "GET /auth/session after logout"
assert_body_contains '"session":null' "GET /auth/session after logout"

echo "Smoke check passed."
