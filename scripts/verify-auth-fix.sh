#!/bin/bash

# Auth Fix Verification Script
# Tests all auth endpoints to verify JSON responses

BASE_URL="${1:-https://skyras-v2.vercel.app}"
echo "Testing auth endpoints at: $BASE_URL"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expected_status=$5
    
    echo -n "Testing $name... "
    
    if [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data" 2>&1)
    else
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint" 2>&1)
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    # Check if response is valid JSON
    if echo "$body" | jq . > /dev/null 2>&1; then
        json_valid=true
    else
        json_valid=false
    fi
    
    # Check status code
    if [ "$http_code" = "$expected_status" ] || [ "$expected_status" = "any" ]; then
        status_ok=true
    else
        status_ok=false
    fi
    
    # Check if body is not empty
    if [ -n "$body" ] && [ "$body" != "null" ]; then
        body_ok=true
    else
        body_ok=false
    fi
    
    if [ "$json_valid" = true ] && [ "$status_ok" = true ] && [ "$body_ok" = true ]; then
        echo -e "${GREEN}✓ PASS${NC}"
        echo "  Status: $http_code"
        echo "  Body: $(echo "$body" | jq -c . 2>/dev/null || echo "$body")"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗ FAIL${NC}"
        echo "  Status: $http_code (expected: $expected_status)"
        echo "  Valid JSON: $json_valid"
        echo "  Body empty: $([ "$body_ok" = false ] && echo "YES" || echo "NO")"
        echo "  Body: $body"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    echo ""
}

echo "=== Test 1: Invalid Signup (Missing Fields) ==="
test_endpoint "Signup - Missing Email/Password" \
    "POST" \
    "/api/auth/signup" \
    '{}' \
    "400"

echo "=== Test 2: Invalid Signup (Short Password) ==="
test_endpoint "Signup - Short Password" \
    "POST" \
    "/api/auth/signup" \
    '{"email":"test@example.com","password":"123"}' \
    "400"

echo "=== Test 3: Invalid Signup (Invalid JSON) ==="
test_endpoint "Signup - Invalid JSON Body" \
    "POST" \
    "/api/auth/signup" \
    '{"invalid":json}' \
    "400"

echo "=== Test 4: Login - Missing Fields ==="
test_endpoint "Login - Missing Email/Password" \
    "POST" \
    "/api/auth/login" \
    '{}' \
    "400"

echo "=== Test 5: Login - Invalid Credentials ==="
test_endpoint "Login - Wrong Credentials" \
    "POST" \
    "/api/auth/login" \
    '{"email":"nonexistent@example.com","password":"wrongpass123"}' \
    "401"

echo ""
echo "=== Summary ==="
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed! Auth fix is working correctly.${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed. Please check the output above.${NC}"
    exit 1
fi