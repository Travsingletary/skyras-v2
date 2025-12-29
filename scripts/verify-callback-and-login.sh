#!/bin/bash

# Verification script for email confirmation E2E test
# Run this AFTER clicking the confirmation link in the email

BASE_URL="${1:-https://skyras-v2.vercel.app}"
TEST_EMAIL="${2}"
TEST_PASSWORD="${3:-testpass123}"

if [ -z "$TEST_EMAIL" ]; then
  echo "Usage: $0 [BASE_URL] <TEST_EMAIL> [TEST_PASSWORD]"
  echo ""
  echo "Example:"
  echo "  $0 https://skyras-v2.vercel.app e2e-final-1766990250@gmail.com testpass123"
  exit 1
fi

echo "=== Email Confirmation E2E Verification ==="
echo "Base URL: $BASE_URL"
echo "Test Email: $TEST_EMAIL"
echo ""

# Step 1: Test Login After Confirmation
echo "Step 1: Testing Login After Confirmation..."
echo ""

LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

echo "Login Response:"
echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGIN_RESPONSE"
echo ""

# Check if login succeeded
if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
  echo "✅ Login successful after confirmation"
  
  # Check for email confirmed
  if echo "$LOGIN_RESPONSE" | grep -q '"emailConfirmed":true'; then
    echo "✅ Email confirmed status: true"
  else
    echo "⚠️  Email confirmed status not found in response"
  fi
  
  # Check for error message
  if echo "$LOGIN_RESPONSE" | grep -q "Email not confirmed"; then
    echo "❌ ERROR: Still showing 'Email not confirmed'"
    exit 1
  else
    echo "✅ No 'Email not confirmed' error"
  fi
else
  if echo "$LOGIN_RESPONSE" | grep -q "Email not confirmed"; then
    echo "❌ Login failed: Email not confirmed"
    echo ""
    echo "This means the confirmation link was not processed correctly."
    echo "Check:"
    echo "1. Did you click the confirmation link in the email?"
    echo "2. Did it redirect to /auth/callback?"
    echo "3. Check Vercel logs for /auth/callback function"
    exit 1
  else
    echo "❌ Login failed for unknown reason"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
  fi
fi

echo ""
echo "=== Verification Complete ==="
echo ""
echo "Next steps:"
echo "1. Check Vercel logs for /auth/callback function:"
echo "   - Should show: [Auth] Callback received params"
echo "   - Should show: [Auth] TEMPORARY: exchangeCodeForSession succeeded"
echo ""
echo "2. Check Vercel logs for /api/auth/login function:"
echo "   - Should show: [Auth] Login successful"
echo "   - Should show: emailConfirmed: true"
echo ""
echo "3. Verify in Supabase Dashboard:"
echo "   - Go to: Authentication → Users"
echo "   - Find user: $TEST_EMAIL"
echo "   - Check: email_confirmed_at should NOT be null"