#!/bin/bash

# Phase 1 Human Validation Helper Script
# Interactive tool for recording validation sessions

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VALIDATION_SCRIPT="$SCRIPT_DIR/phase1-human-validation.ts"

echo "=========================================="
echo "Phase 1 Human Validation Helper"
echo "=========================================="
echo ""

# Check if session exists
if [ -z "$SESSION_ID" ]; then
  echo "Creating new validation session..."
  read -p "User ID: " USER_ID
  read -p "User Type (first-time/returning/unknown): " USER_TYPE
  read -p "Is user logged out? (true/false): " IS_LOGGED_OUT
  
  SESSION_ID=$(npx tsx "$VALIDATION_SCRIPT" create-session "$USER_ID" "$USER_TYPE" "$IS_LOGGED_OUT")
  echo "Session ID: $SESSION_ID"
  export SESSION_ID
  echo ""
fi

echo "Session: $SESSION_ID"
echo ""

# Record prompt
read -p "Prompt text: " PROMPT_TEXT
read -p "Response: " RESPONSE
read -p "Clarity (Y/N): " CLARITY
read -p "Will do now (Y/N): " WILL_DO_NOW
read -p "Confidence (0-10): " CONFIDENCE
read -p "Signup after value (Y/N/N/A): " SIGNUP_AFTER_VALUE
read -p "Template ID (optional): " TEMPLATE_ID

npx tsx "$VALIDATION_SCRIPT" add-prompt "$SESSION_ID" "$PROMPT_TEXT" "$RESPONSE" "$CLARITY" "$WILL_DO_NOW" "$CONFIDENCE" "$SIGNUP_AFTER_VALUE" "$TEMPLATE_ID"

echo ""
echo "Prompt recorded!"
echo ""
echo "To record another prompt for this session, run:"
echo "  SESSION_ID=$SESSION_ID $0"
echo ""
echo "To view report, run:"
echo "  npx tsx $VALIDATION_SCRIPT report"
