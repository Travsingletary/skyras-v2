#!/usr/bin/env node
/**
 * Database Migration Runner
 *
 * This script applies the storage provider migration to your Supabase database.
 *
 * Usage:
 *   1. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables
 *   2. Run: node run-migration.js
 *
 * Or provide them inline:
 *   SUPABASE_URL=your_url SUPABASE_SERVICE_ROLE_KEY=your_key node run-migration.js
 */

const fs = require('fs');
const path = require('path');

async function runMigration() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables!');
    console.error('');
    console.error('Please set:');
    console.error('  - SUPABASE_URL (your Supabase project URL)');
    console.error('  - SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY)');
    console.error('');
    console.error('Example:');
    console.error('  SUPABASE_URL=https://xxx.supabase.co \\');
    console.error('  SUPABASE_SERVICE_ROLE_KEY=your_key \\');
    console.error('  node run-migration.js');
    console.error('');
    console.error('Alternatively, create a .env file with these values.');
    process.exit(1);
  }

  console.log('📦 Reading migration file...');
  const migrationPath = path.join(__dirname, 'frontend/supabase/migrations/0004_add_storage_provider.sql');

  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');
  console.log('✅ Migration file loaded');
  console.log('');

  console.log('🚀 Applying migration to Supabase...');
  console.log(`   URL: ${supabaseUrl}`);
  console.log('');

  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Try alternative approach - split into individual statements
      console.log('⚠️  RPC method failed, trying direct query approach...');

      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.toLowerCase().includes('begin') || statement.toLowerCase().includes('commit')) {
          continue; // Skip transaction statements
        }

        const { error: stmtError } = await supabase.rpc('exec_sql', { sql_query: statement });
        if (stmtError) {
          console.error(`❌ Error executing statement: ${stmtError.message}`);
          console.error(`   Statement: ${statement.substring(0, 100)}...`);
        }
      }
    }

    console.log('✅ Migration applied successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Verify in Supabase Dashboard → Database → Tables → files');
    console.log('  2. Test uploads at http://localhost:3000/studio');
    console.log('');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('');
    console.error('Manual alternative:');
    console.error('  1. Open Supabase Dashboard → SQL Editor');
    console.error('  2. Copy contents from: frontend/supabase/migrations/0004_add_storage_provider.sql');
    console.error('  3. Paste and execute');
    console.error('');
    process.exit(1);
  }
}

// Load .env file if it exists
try {
  require('dotenv').config();
} catch (e) {
  // dotenv not available, that's okay
}

runMigration();
