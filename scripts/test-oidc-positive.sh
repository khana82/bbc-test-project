#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${BASE_URL:-http://localhost:${NGINX_PORT:-8081}}
REALM=${KEYCLOAK_REALM:-wordpress}
ADMIN_USER=${OIDC_ADMIN_USERNAME:-oidc-admin}
ADMIN_PASS=${OIDC_ADMIN_PASSWORD:-${KEYCLOAK_TEST_ADMIN_PASSWORD:-adminpass}}

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

workdir=$(mktemp -d)
cookiejar="$workdir/cookies.txt"
trap 'rm -rf "$workdir"' EXIT

start_response=$(curl -s -D - -o /dev/null -c "$cookiejar" "$BASE_URL/wp-login.php")
login_url=$(echo "$start_response" | awk '/^Location:/ {print $2}' | tr -d '\r')
if [[ -z "$login_url" ]]; then
  fail "wp-login did not redirect to Keycloak"
fi

if [[ "$login_url" == /* ]]; then
  login_url="$BASE_URL$login_url"
fi

if ! echo "$login_url" | grep -q "/auth/realms/$REALM/"; then
  fail "wp-login did not redirect to Keycloak"
fi

login_page=$(curl -s -b "$cookiejar" -c "$cookiejar" "$login_url")
if echo "$login_page" | grep -qi "Invalid parameter: redirect_uri"; then
  fail "Invalid redirect_uri (check OIDC_REDIRECT_BASE_URL)"
fi

if ! echo "$login_page" | grep -qi 'name="username"'; then
  fail "Keycloak login page did not load"
fi

html=$(curl -s -b "$cookiejar" "$login_url")
action=$(echo "$html" | awk -F'action="' '/action="/ {print $2}' | awk -F'"' 'NR==1{print $1}' | sed 's/&amp;/\&/g')
if [[ -z "$action" ]]; then
  fail "Could not find login form action"
fi

post_url="$action"
if [[ "$post_url" == http*://* ]]; then
  post_path=$(python - <<PY
from urllib.parse import urlparse
u = urlparse('''$post_url''')
print(u.path + (('?' + u.query) if u.query else ''))
PY
)
  post_url="$BASE_URL$post_path"
elif [[ "$post_url" == /* ]]; then
  post_url="$BASE_URL$post_url"
fi

post_data="username=$ADMIN_USER&password=$ADMIN_PASS"
response=$(curl -s -D - -o /dev/null -X POST "$post_url" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -b "$cookiejar" -c "$cookiejar" \
  --data "$post_data")
location=$(echo "$response" | awk '/^Location:/ {print $2}' | tr -d '\r')
if [[ -z "$location" ]]; then
  fail "Keycloak login did not return a redirect"
fi

if ! echo "$location" | grep -q "openid-connect-authorize"; then
  fail "Keycloak login did not redirect to OIDC callback"
fi

curl -s -D - -o /dev/null -L -b "$cookiejar" -c "$cookiejar" "$location" >/dev/null
if ! grep -q "wordpress_logged_in" "$cookiejar"; then
  fail "WordPress session cookie not set after OIDC callback"
fi

echo "OIDC positive login flow reached WordPress session."
