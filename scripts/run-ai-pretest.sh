#!/bin/bash

# Phase 1 AI Pre-Validation Harness Runner
# Runs the TypeScript test script using tsx or ts-node

set -e

# Check if tsx is available (preferred)
if command -v tsx &> /dev/null; then
  echo "Running with tsx..."
  tsx scripts/ai-pretest-phase1.ts
# Check if ts-node is available
elif command -v ts-node &> /dev/null; then
  echo "Running with ts-node..."
  ts-node scripts/ai-pretest-phase1.ts
# Try npx tsx
elif command -v npx &> /dev/null; then
  echo "Running with npx tsx..."
  npx tsx scripts/ai-pretest-phase1.ts
else
  echo "Error: tsx or ts-node required. Install with: npm install -g tsx"
  exit 1
fi
