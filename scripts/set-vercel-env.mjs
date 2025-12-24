#!/usr/bin/env node

/**
 * Vercel Environment Variables Setup Script
 * 
 * This script sets all required environment variables for the skyras-v2 project
 * using the Vercel API.
 * 
 * Prerequisites:
 * 1. Install dependencies: npm install
 * 2. Set VERCEL_TOKEN environment variable or login via CLI
 * 
 * Usage: 
 *   node scripts/set-vercel-env.mjs
 *   or
 *   VERCEL_TOKEN=your-token node scripts/set-vercel-env.mjs
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROJECT_ID = 'prj_5xYMkgDW2DrQDwABZMoZMGpsXbBv';
const TEAM_ID = 'team_xohfELtiNusYTFzAbUzJ0V2R';

// Environment variables to set
const ENV_VARS = {
  // Supabase (Backend - Private)
  SUPABASE_URL: 'https://zzxedixpbvivpsnztjsc.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6eGVkaXhwYnZpdnBzbnp0anNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzODkyMTksImV4cCI6MjA3ODk2NTIxOX0.xDUS_lPMxQvI-J1ZaafWOhaAhqwRW-whr-PrYFQh1RQ',
  SUPABASE_SECRET_KEY: 'sb_secret_a_N4Wj4CLe2bFqgMbLIIJg_gSab7Wwy',
  
  // Supabase (Frontend - Public)
  NEXT_PUBLIC_SUPABASE_URL: 'https://zzxedixpbvivpsnztjsc.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6eGVkaXhwYnZpdnBzbnp0anNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzODkyMTksImV4cCI6MjA3ODk2NTIxOX0.xDUS_lPMxQvI-J1ZaafWOhaAhqwRW-whr-PrYFQh1RQ',
  
  // Storage
  DEFAULT_STORAGE_PROVIDER: 'supabase',
  SIGNED_URL_DEFAULT_EXPIRY: '3600',
  
  // RBAC
  RBAC_ENFORCE: 'true',
  
  // App URL
  NEXT_PUBLIC_APP_URL: 'https://skyras-v2.vercel.app',
  CORS_ORIGINS: 'https://skyras-v2.vercel.app,https://skyras-v2-travis-singletarys-projects.vercel.app',
  
  // TTS
  TTS_PROVIDER: 'openai',
  TTS_DEFAULT_VOICE: 'nova',
  TTS_DEFAULT_SPEED: '1.0',
  
  // Image Generation
  IMAGE_STORAGE_BUCKET: 'generated-images',
  IMAGE_PROVIDER_PRIORITY: 'runway,stable-diffusion',
  IMAGE_PROVIDER_NAME: 'replicate-stable-diffusion',
  IMAGE_PROVIDER_BASE_URL: 'https://api.replicate.com/v1',
  REPLICATE_MODEL_ID: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
  RUNWAY_API_BASE_URL: 'https://api.dev.runwayml.com',
  RUNWAY_API_VERSION: '2024-11-06',
};

// Environments to set variables for
const ENVIRONMENTS = ['production', 'preview', 'development'];

/**
 * Set an environment variable using Vercel CLI
 */
function setEnvVar(key, value, environments = ENVIRONMENTS) {
  console.log(`\n📝 Setting: ${key}`);
  
  for (const env of environments) {
    try {
      // Use Vercel CLI to set the variable
      const command = `vercel env add ${key} ${env} --yes`;
      execSync(`echo "${value}" | ${command}`, { 
        stdio: 'pipe',
        encoding: 'utf-8'
      });
      console.log(`  ✓ Set for ${env}`);
    } catch (error) {
      // If variable already exists, try to update it
      if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        console.log(`  ⚠️  Already exists for ${env}, skipping...`);
        // Note: Vercel CLI doesn't have a direct update command, 
        // you'd need to delete and re-add, or use the API
      } else {
        console.error(`  ✗ Failed to set for ${env}: ${error.message}`);
        throw error;
      }
    }
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Setting up Vercel environment variables for skyras-v2...\n');
  console.log(`Project ID: ${PROJECT_ID}`);
  console.log(`Team ID: ${TEAM_ID}\n`);
  
  // Check if Vercel CLI is installed
  try {
    execSync('vercel --version', { stdio: 'pipe' });
  } catch (error) {
    console.error('❌ Vercel CLI is not installed. Please install it first:');
    console.error('   npm i -g vercel');
    process.exit(1);
  }
  
  // Check if logged in
  try {
    execSync('vercel whoami', { stdio: 'pipe' });
  } catch (error) {
    console.error('❌ Not logged in to Vercel. Please login first:');
    console.error('   vercel login');
    process.exit(1);
  }
  
  // Set all environment variables
  for (const [key, value] of Object.entries(ENV_VARS)) {
    try {
      setEnvVar(key, value);
    } catch (error) {
      console.error(`\n❌ Failed to set ${key}`);
      console.error('   You may need to set this manually in the Vercel dashboard');
    }
  }
  
  console.log('\n✅ Environment variables setup complete!\n');
  console.log('⚠️  IMPORTANT: You still need to set these manually (they contain secrets):');
  console.log('   - ANTHROPIC_API_KEY');
  console.log('   - OPENAI_API_KEY');
  console.log('   - REPLICATE_API_TOKEN (if using image generation)');
  console.log('   - RUNWAY_API_KEY (if using Runway)');
  console.log('   - ELEVENLABS_API_KEY (if using premium TTS)');
  console.log('\nTo set these, run:');
  console.log('   vercel env add ANTHROPIC_API_KEY production preview development');
  console.log('   vercel env add OPENAI_API_KEY production preview development');
  console.log('\nTo verify, run:');
  console.log('   vercel env ls');
}

main().catch(console.error);


