#!/bin/bash

# Phase 1 Output Quality Test Script
# Tests 10-15 real prompts and scores outputs

set -e

API_URL="${API_URL:-http://localhost:3000/api/chat}"
TEST_COUNT=0
PASS_COUNT=0
FAIL_COUNT=0

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=== Phase 1 Output Quality Test ==="
echo ""
echo "API URL: $API_URL"
echo ""

# Test prompts
declare -a PROMPTS=(
  "I want to write a blog post"
  "I need to create content for my client"
  "I'm working on a video script"
  "I need to organize my workflow"
  "I have too many projects and don't know where to start"
  "I want to plan my content calendar"
  "I'm stuck on my project"
  "I don't know what to work on next"
  "I feel overwhelmed with all my tasks"
  "What should I work on?"
  "I have an idea but don't know how to start"
  "I want to explore new creative directions"
  "I need to email my client about the project"
  "I want to schedule social media posts"
  "I need to finish my presentation"
)

# Function to score output
score_output() {
  local output="$1"
  local prompt="$2"
  
  echo ""
  echo "--- Scoring Output ---"
  echo "Prompt: $prompt"
  echo "Output: $output"
  echo ""
  
  # Ask for manual scoring (we'll automate this later if needed)
  echo "Please score this output (1-4 for each criterion):"
  echo "1. Concrete (specific action, not abstract): "
  read -r concrete_score
  
  echo "2. Specific (clear what to do, not general): "
  read -r specific_score
  
  echo "3. Small (one step, not multiple): "
  read -r small_score
  
  echo "4. Immediately Actionable (can do it now, not later): "
  read -r actionable_score
  
  # Calculate average
  avg=$(echo "scale=2; ($concrete_score + $specific_score + $small_score + $actionable_score) / 4" | bc)
  
  echo ""
  echo "Scores: Concrete=$concrete_score, Specific=$specific_score, Small=$small_score, Actionable=$actionable_score"
  echo "Average: $avg"
  
  # Check if all scores are 4
  if [ "$concrete_score" -eq 4 ] && [ "$specific_score" -eq 4 ] && [ "$small_score" -eq 4 ] && [ "$actionable_score" -eq 4 ]; then
    echo -e "${GREEN}✅ PASS (4/4)${NC}"
    ((PASS_COUNT++))
    return 0
  else
    echo -e "${RED}❌ FAIL (not 4/4)${NC}"
    ((FAIL_COUNT++))
    return 1
  fi
}

# Test each prompt
for prompt in "${PROMPTS[@]}"; do
  ((TEST_COUNT++))
  echo ""
  echo "=== Test $TEST_COUNT/${#PROMPTS[@]} ==="
  echo "Prompt: $prompt"
  echo ""
  
  # Make API call
  response=$(curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d "{
      \"message\": \"$prompt\",
      \"userId\": \"public\"
    }")
  
  # Extract output
  output=$(echo "$response" | jq -r '.data.output // .response // .data.message.content // "No response"')
  
  if [ -z "$output" ] || [ "$output" = "null" ]; then
    echo -e "${RED}❌ ERROR: No output received${NC}"
    echo "Response: $response"
    ((FAIL_COUNT++))
    continue
  fi
  
  # Score the output
  if score_output "$output" "$prompt"; then
    echo "✅ Test $TEST_COUNT passed"
  else
    echo "❌ Test $TEST_COUNT failed"
  fi
  
  echo ""
  echo "Press Enter to continue to next test..."
  read -r
done

# Summary
echo ""
echo "=== Test Summary ==="
echo "Total tests: $TEST_COUNT"
echo -e "${GREEN}Passed: $PASS_COUNT${NC}"
echo -e "${RED}Failed: $FAIL_COUNT${NC}"
echo ""

if [ "$FAIL_COUNT" -eq 0 ]; then
  echo -e "${GREEN}✅ All tests passed! Output quality is 4/4.${NC}"
  exit 0
else
  echo -e "${YELLOW}⚠️  Some tests failed. Output quality needs improvement.${NC}"
  exit 1
fi
