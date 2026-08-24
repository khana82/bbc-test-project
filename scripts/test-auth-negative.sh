#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${BASE_URL:-http://localhost:${NGINX_PORT:-8081}}
AUTH_LOG_PREFIX=${AUTH_LOG_PREFIX:-[oidc-only]}

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

assert_status() {
  local expected="$1"
  local actual="$2"
  local message="$3"
  if [[ "$actual" != "$expected" ]]; then
    fail "$message (expected $expected, got $actual)"
  fi
}

echo "Checking wp-login redirects to Keycloak..."
login_headers=$(curl -fsSI "$BASE_URL/wp-login.php" || true)
if ! echo "$login_headers" | grep -Eqi "location: .*/auth/realms/"; then
  fail "wp-login.php did not redirect to Keycloak"
fi

system_time=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "Checking wp-login password POST is blocked..."
login_status=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$BASE_URL/wp-login.php" \
  -d "log=localuser&pwd=localpass&wp-submit=Log+In&testcookie=1" || true)
if [[ "$login_status" != "403" ]]; then
  fail "wp-login.php POST was not blocked"
fi

sleep 2

if ! docker compose logs wordpress --since "$system_time" | grep -Fq "${AUTH_LOG_PREFIX} Blocked wp-login password attempt"; then
  fail "Blocked login attempt was not logged"
fi

echo "Checking XML-RPC is disabled..."
xmlrpc_response=$(curl -s -o /tmp/xmlrpc_response.txt -w "%{http_code}" \
  -X POST "$BASE_URL/xmlrpc.php" \
  -d '<methodCall><methodName>system.listMethods</methodName></methodCall>' || true)
if [[ "$xmlrpc_response" == "200" ]]; then
  if ! grep -Eq "XML-RPC services are disabled" /tmp/xmlrpc_response.txt; then
    fail "XML-RPC appears enabled"
  fi
fi

if ! docker compose logs wordpress --since "$system_time" | grep -Fq "${AUTH_LOG_PREFIX} Blocked XML-RPC"; then
  fail "XML-RPC block was not logged"
fi

echo "Checking application passwords are disabled..."
app_pw_status=$(curl -s -o /dev/null -w "%{http_code}" \
  -u "localuser:localpass" \
  "$BASE_URL/wp-json/wp/v2/users/me/application-passwords" || true)
if [[ "$app_pw_status" == "200" ]]; then
  fail "Application passwords endpoint returned 200"
fi

echo "Checking REST auth bypass is blocked..."
rest_status=$(curl -s -o /dev/null -w "%{http_code}" \
  -u "localuser:localpass" \
  "$BASE_URL/wp-json/wp/v2/users/me" || true)
if [[ "$rest_status" == "200" ]]; then
  fail "REST basic auth unexpectedly succeeded"
fi

if ! docker compose logs wordpress --since "$system_time" | grep -Fq "${AUTH_LOG_PREFIX} Blocked REST API authentication"; then
  fail "REST auth block was not logged"
fi

echo "Checking Keycloak is not exposed on localhost:8080..."
if curl -fsS "http://localhost:8080" >/dev/null 2>&1; then
  fail "Keycloak appears to be exposed on localhost:8080"
fi

echo "Negative auth tests passed."
