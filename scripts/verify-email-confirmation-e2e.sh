#!/bin/bash

# End-to-End Email Confirmation Verification Script
# Tests: Signup -> Email -> Confirm -> Login

BASE_URL="${1:-https://skyras-v2.vercel.app}"
TEST_EMAIL="e2e-verify-$(date +%s)@test.com"
TEST_PASSWORD="testpass123"

echo "=== Email Confirmation E2E Test ==="
echo "Base URL: $BASE_URL"
echo "Test Email: $TEST_EMAIL"
echo ""

# Step 1: Sign up
echo "Step 1: Signing up..."
SIGNUP_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

echo "Signup Response:"
echo "$SIGNUP_RESPONSE" | jq '.' 2>/dev/null || echo "$SIGNUP_RESPONSE"
echo ""

# Check if signup succeeded
if echo "$SIGNUP_RESPONSE" | grep -q '"success":true'; then
  echo "✅ Signup successful"
  echo ""
  echo "📧 Next steps:"
  echo "1. Check email inbox for: $TEST_EMAIL"
  echo "2. Click the confirmation link"
  echo "3. Link should redirect to: $BASE_URL/auth/callback"
  echo "4. Then redirect to: $BASE_URL/studio"
  echo ""
  echo "After clicking link, run:"
  echo "  ./scripts/verify-email-confirmation-e2e.sh $BASE_URL verify $TEST_EMAIL $TEST_PASSWORD"
else
  echo "❌ Signup failed"
  echo "Response: $SIGNUP_RESPONSE"
  exit 1
fi

# If verify mode
if [ "$2" = "verify" ] && [ -n "$3" ] && [ -n "$4" ]; then
  TEST_EMAIL="$3"
  TEST_PASSWORD="$4"
  
  echo ""
  echo "=== Step 2: Testing Login After Confirmation ==="
  echo "Email: $TEST_EMAIL"
  echo ""
  
  LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
  
  echo "Login Response:"
  echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGIN_RESPONSE"
  echo ""
  
  if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Login successful after confirmation"
    
    # Check for email confirmed
    if echo "$LOGIN_RESPONSE" | grep -q '"emailConfirmed":true'; then
      echo "✅ Email confirmed status: true"
    else
      echo "⚠️  Email confirmed status not found in response"
    fi
  else
    if echo "$LOGIN_RESPONSE" | grep -q "Email not confirmed"; then
      echo "❌ Login failed: Email not confirmed"
    else
      echo "❌ Login failed"
    fi
    exit 1
  fi
fi