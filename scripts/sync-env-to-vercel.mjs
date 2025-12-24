#!/usr/bin/env node

/**
 * Sync .env.local to Vercel Environment Variables
 * 
 * This script reads from frontend/.env.local and sets all variables in Vercel
 * for Production, Preview, and Development environments.
 * 
 * Usage: node scripts/sync-env-to-vercel.mjs
 */

import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const envLocalPath = join(projectRoot, 'frontend', '.env.local');

// Variables to skip (local-only or redundant)
const SKIP_VARS = [
  'SUPABASE_SERVICE_ROLE_KEY', // Old format, we use SUPABASE_SECRET_KEY
  'NEXT_PUBLIC_API_BASE_URL', // Might point to localhost
];

// Variables that need different values for production
const PROD_OVERRIDES = {
  'RBAC_ENFORCE': 'true', // Should be true in production, false in local
  'NEXT_PUBLIC_APP_URL': 'https://skyras-v2.vercel.app', // Production URL
};

// Environments to set variables for
const ENVIRONMENTS = ['production', 'preview', 'development'];

/**
 * Parse .env.local file
 */
function parseEnvFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const vars = {};
    
    content.split('\n').forEach(line => {
      line = line.trim();
      // Skip comments and empty lines
      if (!line || line.startsWith('#')) return;
      
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        
        vars[key] = value;
      }
    });
    
    return vars;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Set environment variable in Vercel
 */
function setEnvVar(key, value, environments = ENVIRONMENTS) {
  console.log(`\n📝 Setting: ${key}`);
  
  for (const env of environments) {
    try {
      // Use production override if available
      const finalValue = PROD_OVERRIDES[key] || value;
      
      // Use Vercel CLI to set the variable
      // Note: This will prompt for each variable, but we can pipe the value
      const command = `echo "${finalValue}" | vercel env add ${key} ${env} --yes 2>&1`;
      const output = execSync(command, { 
        encoding: 'utf-8',
        stdio: 'pipe'
      });
      
      if (output.includes('already exists') || output.includes('duplicate')) {
        console.log(`  ⚠️  Already exists for ${env}, skipping...`);
      } else {
        console.log(`  ✓ Set for ${env}`);
      }
    } catch (error) {
      const errorMsg = error.message || error.toString();
      if (errorMsg.includes('already exists') || errorMsg.includes('duplicate')) {
        console.log(`  ⚠️  Already exists for ${env}, skipping...`);
      } else {
        console.error(`  ✗ Failed to set for ${env}: ${errorMsg.split('\n')[0]}`);
        // Continue with other environments
      }
    }
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Syncing .env.local to Vercel...\n');
  
  // Check if .env.local exists
  try {
    readFileSync(envLocalPath, 'utf-8');
  } catch (error) {
    console.error(`❌ File not found: ${envLocalPath}`);
    console.error('   Make sure frontend/.env.local exists');
    process.exit(1);
  }
  
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
  
  // Parse .env.local
  console.log(`📖 Reading: ${envLocalPath}`);
  const envVars = parseEnvFile(envLocalPath);
  
  if (!envVars || Object.keys(envVars).length === 0) {
    console.error('❌ No environment variables found in .env.local');
    process.exit(1);
  }
  
  console.log(`✅ Found ${Object.keys(envVars).length} variables\n`);
  
  // Set each variable
  let successCount = 0;
  let skipCount = 0;
  
  for (const [key, value] of Object.entries(envVars)) {
    if (SKIP_VARS.includes(key)) {
      console.log(`⏭️  Skipping: ${key} (local-only or redundant)`);
      skipCount++;
      continue;
    }
    
    if (!value || value.trim() === '') {
      console.log(`⏭️  Skipping: ${key} (empty value)`);
      skipCount++;
      continue;
    }
    
    try {
      setEnvVar(key, value);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to set ${key}: ${error.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Sync complete!');
  console.log(`   ✓ Set: ${successCount} variables`);
  console.log(`   ⏭️  Skipped: ${skipCount} variables`);
  console.log('\n⚠️  Note: Variables that already existed were skipped.');
  console.log('   To update existing variables, delete them first in Vercel dashboard.');
  console.log('\n📋 Next steps:');
  console.log('   1. Verify: vercel env ls');
  console.log('   2. Fix SUPABASE_SECRET_KEY for Development (if needed)');
  console.log('   3. Delete redundant variables (see VERCEL_ENV_STILL_NEEDED.md)');
  console.log('   4. Update RBAC_ENFORCE to "true" for production (if needed)');
}

main().catch(console.error);


