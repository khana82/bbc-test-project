#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${BASE_URL:-http://localhost:${NGINX_PORT:-8081}}
REALM=${KEYCLOAK_REALM:-wordpress}

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

echo "Checking WordPress REST endpoint..."
if ! curl -fsS "$BASE_URL/wp-json/" >/dev/null; then
  fail "WordPress REST endpoint not reachable"
fi

echo "Checking Keycloak base via NGINX..."
if ! curl -fsS "$BASE_URL/auth/" >/dev/null; then
  fail "Keycloak base route not reachable"
fi

echo "Checking OIDC discovery document..."
if ! curl -fsS "$BASE_URL/auth/realms/$REALM/.well-known/openid-configuration" >/dev/null; then
  fail "OIDC discovery document not reachable"
fi

echo "Checking wp-login redirect to Keycloak..."
headers=$(curl -fsSI "$BASE_URL/wp-login.php" || true)
if ! echo "$headers" | grep -Eqi "location: .*/auth/realms/"; then
  fail "wp-login.php did not redirect to Keycloak"
fi

echo "OIDC smoke tests passed."
