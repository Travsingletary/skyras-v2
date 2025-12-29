#!/bin/bash

# Email Confirmation Flow Test Script
# Tests the complete signup -> email -> confirm -> login flow

BASE_URL="${1:-https://skyras-v2.vercel.app}"
TEST_EMAIL="test-confirm-$(date +%s)@example.com"
TEST_PASSWORD="testpass123"

echo "=== Email Confirmation Flow Test ==="
echo "Base URL: $BASE_URL"
echo "Test Email: $TEST_EMAIL"
echo ""

# Step 1: Sign up
echo "Step 1: Signing up..."
SIGNUP_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

echo "Signup Response: $SIGNUP_RESPONSE"
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
  echo "  curl -X POST $BASE_URL/api/auth/login \\"
  echo "    -H 'Content-Type: application/json' \\"
  echo "    -d '{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}'"
else
  echo "❌ Signup failed"
  echo "Response: $SIGNUP_RESPONSE"
  exit 1
fi