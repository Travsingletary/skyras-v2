#!/bin/bash

# Test Auth Redirect Matrix
# Tests redirect behavior for logged out and logged in users

set -e

BASE_URL="${1:-http://localhost:3000}"
echo "Testing auth redirects at: $BASE_URL"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_redirect() {
  local url=$1
  local expected_location=$2
  local description=$3
  
  echo -n "Testing: $description ... "
  
  # Follow redirects and get final location
  response=$(curl -s -o /dev/null -w "%{http_code}|%{redirect_url}" -L "$BASE_URL$url" 2>/dev/null || echo "ERROR")
  
  if [[ "$response" == "ERROR" ]]; then
    echo -e "${RED}FAIL${NC} - Could not connect"
    return 1
  fi
  
  http_code=$(echo "$response" | cut -d'|' -f1)
  redirect_url=$(echo "$response" | cut -d'|' -f2)
  
  # Extract path from redirect URL
  if [[ -n "$redirect_url" && "$redirect_url" != "http://"* ]]; then
    # If redirect_url is relative, use it as-is
    final_path="$redirect_url"
  else
    # Extract path from full URL
    final_path=$(echo "$redirect_url" | sed -E 's|https?://[^/]+||' || echo "")
  fi
  
  # Normalize: remove trailing slash, handle empty
  final_path=$(echo "$final_path" | sed 's|/$||' || echo "/")
  if [[ -z "$final_path" ]]; then
    final_path="/"
  fi
  
  expected_path=$(echo "$expected_location" | sed 's|/$||' || echo "/")
  if [[ -z "$expected_path" ]]; then
    expected_path="/"
  fi
  
  if [[ "$final_path" == "$expected_path" ]]; then
    echo -e "${GREEN}PASS${NC} (→ $final_path)"
    return 0
  else
    echo -e "${RED}FAIL${NC} (expected → $expected_path, got → $final_path, HTTP $http_code)"
    return 1
  fi
}

echo "=========================================="
echo "LOGGED OUT USER TESTS"
echo "=========================================="
echo ""

# Logged out: / stays, /studio -> /, /login stays, /signup stays
test_redirect "/" "/" "Logged out: / stays"
test_redirect "/studio" "/" "Logged out: /studio -> /"
test_redirect "/login" "/login" "Logged out: /login stays"
test_redirect "/signup" "/signup" "Logged out: /signup stays"

echo ""
echo "=========================================="
echo "LOGGED IN USER TESTS"
echo "=========================================="
echo ""
echo -e "${YELLOW}NOTE: These tests require manual login first${NC}"
echo "Please log in at $BASE_URL/login, then run:"
echo "  curl -L -b cookies.txt -c cookies.txt $BASE_URL/login"
echo ""
echo "Or test manually in browser:"
echo "  1. Log in at $BASE_URL/login"
echo "  2. Visit each URL and verify redirects:"
echo "     - / → should redirect to /studio"
echo "     - /login → should redirect to /studio"
echo "     - /signup → should redirect to /studio"
echo "     - /studio → should stay on /studio"
echo ""

echo "=========================================="
echo "TEST COMPLETE"
echo "=========================================="