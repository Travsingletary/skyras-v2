#!/bin/bash

# Vercel Environment Variables Setup Script
# This script sets all required environment variables for the skyras-v2 project
# 
# Prerequisites:
# 1. Install Vercel CLI: npm i -g vercel
# 2. Login: vercel login
# 3. Link project: vercel link (or use --yes flag)
#
# Usage: ./scripts/set-vercel-env.sh

set -e

PROJECT_ID="prj_5xYMkgDW2DrQDwABZMoZMGpsXbBv"
TEAM_ID="team_xohfELtiNusYTFzAbUzJ0V2R"

echo "🚀 Setting up Vercel environment variables for skyras-v2..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to set env var for all environments
set_env() {
    local key=$1
    local value=$2
    local description=$3
    
    echo -e "${YELLOW}Setting: ${key}${NC}"
    if [ -n "$description" ]; then
        echo "  Description: $description"
    fi
    
    vercel env add "$key" production preview development <<< "$value" || {
        echo -e "${RED}Failed to set $key${NC}"
        return 1
    }
    echo -e "${GREEN}✓ Set $key${NC}"
    echo ""
}

# Required Supabase Variables (Backend - Private)
echo "📦 Setting Supabase Configuration (Backend)..."
set_env "SUPABASE_URL" "https://zzxedixpbvivpsnztjsc.supabase.co" "Supabase project URL"
set_env "SUPABASE_ANON_KEY" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6eGVkaXhwYnZpdnBzbnp0anNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzODkyMTksImV4cCI6MjA3ODk2NTIxOX0.xDUS_lPMxQvI-J1ZaafWOhaAhqwRW-whr-PrYFQh1RQ" "Supabase anonymous key"
set_env "SUPABASE_SECRET_KEY" "sb_secret_a_N4Wj4CLe2bFqgMbLIIJg_gSab7Wwy" "Supabase secret key (CRITICAL for storage)"

# Required Supabase Variables (Frontend - Public)
echo "📦 Setting Supabase Configuration (Frontend)..."
set_env "NEXT_PUBLIC_SUPABASE_URL" "https://zzxedixpbvivpsnztjsc.supabase.co" "Supabase URL (public)"
set_env "NEXT_PUBLIC_SUPABASE_ANON_KEY" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6eGVkaXhwYnZpdnBzbnp0anNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzODkyMTksImV4cCI6MjA3ODk2NTIxOX0.xDUS_lPMxQvI-J1ZaafWOhaAhqwRW-whr-PrYFQh1RQ" "Supabase anonymous key (public)"

# Storage Configuration
echo "📦 Setting Storage Configuration..."
set_env "DEFAULT_STORAGE_PROVIDER" "supabase" "Default storage provider"
set_env "SIGNED_URL_DEFAULT_EXPIRY" "3600" "Signed URL expiration (seconds)"

# RBAC Configuration
echo "📦 Setting RBAC Configuration..."
set_env "RBAC_ENFORCE" "true" "Enable RBAC enforcement"

# App URL Configuration
echo "📦 Setting App URL Configuration..."
set_env "NEXT_PUBLIC_APP_URL" "https://skyras-v2.vercel.app" "Public app URL"
set_env "CORS_ORIGINS" "https://skyras-v2.vercel.app,https://skyras-v2-travis-singletarys-projects.vercel.app" "Allowed CORS origins"

# TTS Configuration
echo "📦 Setting TTS Configuration..."
set_env "TTS_PROVIDER" "openai" "Text-to-speech provider"
set_env "TTS_DEFAULT_VOICE" "nova" "Default TTS voice"
set_env "TTS_DEFAULT_SPEED" "1.0" "Default TTS speed"

# Image Generation Configuration
echo "📦 Setting Image Generation Configuration..."
set_env "IMAGE_STORAGE_BUCKET" "generated-images" "Image storage bucket"
set_env "IMAGE_PROVIDER_PRIORITY" "runway,stable-diffusion" "Image provider priority"
set_env "IMAGE_PROVIDER_NAME" "replicate-stable-diffusion" "Image provider name"
set_env "IMAGE_PROVIDER_BASE_URL" "https://api.replicate.com/v1" "Image provider base URL"
set_env "REPLICATE_MODEL_ID" "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b" "Replicate model ID"
set_env "RUNWAY_API_BASE_URL" "https://api.dev.runwayml.com" "Runway API base URL"
set_env "RUNWAY_API_VERSION" "2024-11-06" "Runway API version"

echo ""
echo -e "${GREEN}✅ Environment variables setup complete!${NC}"
echo ""
echo "⚠️  IMPORTANT: You still need to set these manually (they contain secrets):"
echo "   - ANTHROPIC_API_KEY"
echo "   - OPENAI_API_KEY"
echo "   - REPLICATE_API_TOKEN (if using image generation)"
echo "   - RUNWAY_API_KEY (if using Runway)"
echo "   - ELEVENLABS_API_KEY (if using premium TTS)"
echo ""
echo "To set these, run:"
echo "  vercel env add ANTHROPIC_API_KEY production preview development"
echo "  vercel env add OPENAI_API_KEY production preview development"
echo ""
echo "To verify, run:"
echo "  vercel env ls"
echo ""


