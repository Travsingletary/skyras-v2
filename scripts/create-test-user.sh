#!/bin/bash

# Create test user with real email
# Usage: ./scripts/create-test-user.sh <your-email@example.com>

EMAIL="${1}"
PASSWORD="${2:-testpass123}"
BASE_URL="${3:-https://skyras-v2.vercel.app}"

if [ -z "$EMAIL" ]; then
  echo "Usage: $0 <your-email@example.com> [password] [base-url]"
  echo ""
  echo "Example:"
  echo "  $0 your-email@gmail.com"
  exit 1
fi

echo "=== Creating Test User ==="
echo "Email: $EMAIL"
echo "Password: $PASSWORD"
echo "Base URL: $BASE_URL"
echo ""

SIGNUP_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

echo "Signup Response:"
echo "$SIGNUP_RESPONSE" | jq '.' 2>/dev/null || echo "$SIGNUP_RESPONSE"
echo ""

if echo "$SIGNUP_RESPONSE" | grep -q '"success":true'; then
  echo "✅ Signup successful!"
  echo ""
  echo "📧 Next steps:"
  echo "1. Check your email inbox: $EMAIL"
  echo "2. Find email from Supabase with subject 'Confirm your signup'"
  echo "3. Click the confirmation link"
  echo "4. Link should redirect to: $BASE_URL/auth/callback then $BASE_URL/studio"
  echo ""
  echo "After clicking the link, run:"
  echo "  ./scripts/verify-callback-and-login.sh $BASE_URL $EMAIL $PASSWORD"
else
  echo "❌ Signup failed"
  echo "Response: $SIGNUP_RESPONSE"
  exit 1
fi