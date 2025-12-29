#!/bin/bash

# Phase 1 Validation - Production
# Runs validate-output-quality.js against production API

set -e

PRODUCTION_URL="https://skyras-v2.vercel.app/api/chat"

echo "=== Phase 1 Output Quality Validation (Production) ==="
echo "API URL: $PRODUCTION_URL"
echo ""

# Run validation script with production URL
API_URL="$PRODUCTION_URL" node scripts/validate-output-quality.js

echo ""
echo "=== Validation Complete ==="
echo "Check output above for pass/fail results."
echo "Target: 15/15 passing (100%)"
