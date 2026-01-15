#!/bin/bash
# Video Animation Feature Setup Script
# Run this after applying migrations manually in Supabase Dashboard

set -e

echo "🎬 Video Animation Feature Setup"
echo "=================================="
echo ""

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "⚠️  Supabase CLI not found. Install from: https://supabase.com/docs/guides/cli"
    echo ""
    echo "📋 Manual Setup Required:"
    echo "1. Apply migrations via Supabase Dashboard SQL Editor"
    echo "2. Create storage buckets manually"
    echo "3. Set Vercel environment variables"
    echo ""
    echo "See: docs/VIDEO_ANIMATION_SETUP_PREREQUISITES.md"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Check if we're in the right directory
if [ ! -f "frontend/supabase/migrations/0014_video_animation.sql" ]; then
    echo "❌ Error: Migration files not found"
    echo "   Make sure you're in the project root directory"
    exit 1
fi

echo "📦 Applying database migrations..."
echo ""

# Apply migrations
echo "Applying 0014_video_animation.sql..."
supabase db push --file frontend/supabase/migrations/0014_video_animation.sql

echo ""
echo "Applying 0014_video_animation_hardening.sql..."
supabase db push --file frontend/supabase/migrations/0014_video_animation_hardening.sql

echo ""
echo "✅ Migrations applied"
echo ""

# Note: Storage buckets must be created manually via Dashboard
echo "📦 Storage Buckets Setup"
echo "   ⚠️  Storage buckets must be created manually:"
echo "   1. Go to Supabase Dashboard → Storage"
echo "   2. Create 'source-images' bucket (private, 10MB limit)"
echo "   3. Create 'generated-videos' bucket (private, 100MB limit)"
echo "   4. Apply RLS policies (see docs/VIDEO_ANIMATION_SETUP_PREREQUISITES.md)"
echo ""

# Check environment variables
echo "🔑 Environment Variables Check"
echo ""

if [ -z "$FAL_KEY" ]; then
    echo "   ⚠️  FAL_KEY not set in environment"
    echo "      Set it in Vercel Dashboard → Settings → Environment Variables"
else
    echo "   ✅ FAL_KEY is set"
fi

if [ -z "$VIDEO_DAILY_LIMIT" ]; then
    echo "   ℹ️  VIDEO_DAILY_LIMIT not set (using default: 20)"
else
    echo "   ✅ VIDEO_DAILY_LIMIT = $VIDEO_DAILY_LIMIT"
fi

echo ""
echo "✅ Setup script completed"
echo ""
echo "📋 Next Steps:"
echo "   1. Create storage buckets in Supabase Dashboard"
echo "   2. Set FAL_KEY in Vercel environment variables"
echo "   3. Deploy to Vercel"
echo "   4. Test the animation feature"
echo ""
