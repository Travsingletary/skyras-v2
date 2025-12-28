#!/usr/bin/env node
/**
 * Apply Marcus Manager Migration
 * 
 * Applies the marcus_manager_state table migration to Supabase
 * 
 * Usage:
 *   node scripts/apply-marcus-manager-migration.mjs
 * 
 * Requires:
 *   - SUPABASE_URL environment variable
 *   - SUPABASE_SERVICE_ROLE_KEY environment variable
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function applyMigration() {
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
    console.error('  node scripts/apply-marcus-manager-migration.mjs');
    console.error('');
    process.exit(1);
  }

  console.log('📦 Reading migration file...');
  const migrationPath = join(__dirname, '../frontend/supabase/migrations/0013_marcus_manager_state.sql');

  let sql;
  try {
    sql = readFileSync(migrationPath, 'utf8');
    console.log('✅ Migration file loaded');
  } catch (error) {
    console.error(`❌ Migration file not found: ${migrationPath}`);
    console.error('');
    console.error('Make sure the migration file exists at:');
    console.error('  frontend/supabase/migrations/0013_marcus_manager_state.sql');
    process.exit(1);
  }

  console.log('');
  console.log('🔗 Connecting to Supabase...');
  console.log(`   URL: ${supabaseUrl}`);
  console.log('');

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.match(/^\s*$/));

    console.log(`📝 Executing ${statements.length} SQL statements...`);
    console.log('');

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const statementPreview = statement.substring(0, 60).replace(/\n/g, ' ');

      try {
        // Use rpc if available, otherwise direct query
        const { error: rpcError } = await supabase.rpc('exec_sql', { sql_query: statement });
        
        if (rpcError) {
          // Try direct query via REST API
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({ sql_query: statement }),
          });

          if (!response.ok) {
            // Last resort: try using Supabase's query builder (limited)
            // For CREATE TABLE, we'll need to use the SQL editor or direct connection
            console.log(`⚠️  Statement ${i + 1}/${statements.length}: Using alternative method...`);
            console.log(`   ${statementPreview}...`);
            
            // Note: Supabase JS client doesn't support raw SQL execution
            // This migration needs to be applied via SQL Editor or pgAdmin
            console.log('');
            console.log('⚠️  Direct SQL execution not available via Supabase JS client.');
            console.log('');
            console.log('Please apply this migration manually:');
            console.log('  1. Go to https://supabase.com/dashboard');
            console.log('  2. Select your project');
            console.log('  3. Click SQL Editor → + New query');
            console.log('  4. Copy contents from: frontend/supabase/migrations/0013_marcus_manager_state.sql');
            console.log('  5. Paste and click Run');
            console.log('');
            process.exit(0);
          }
        }

        successCount++;
        if (i < 5 || i === statements.length - 1) {
          console.log(`✅ Statement ${i + 1}/${statements.length}: ${statementPreview}...`);
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ Statement ${i + 1}/${statements.length} failed: ${error.message}`);
        console.error(`   ${statementPreview}...`);
      }
    }

    console.log('');
    if (errorCount === 0) {
      console.log('✅ Migration applied successfully!');
      console.log('');
      console.log('Next steps:');
      console.log('  1. Verify in Supabase Dashboard → Database → Tables → marcus_manager_state');
      console.log('  2. Test Marcus Manager API: POST /api/agents/marcus-manager');
      console.log('');
    } else {
      console.log(`⚠️  Migration completed with ${errorCount} error(s)`);
      console.log('');
      console.log('Some statements may have failed. Please check Supabase logs.');
      console.log('You may need to apply the migration manually via SQL Editor.');
      console.log('');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('');
    console.error('Manual alternative:');
    console.error('  1. Open Supabase Dashboard → SQL Editor');
    console.error('  2. Copy contents from: frontend/supabase/migrations/0013_marcus_manager_state.sql');
    console.error('  3. Paste and execute');
    console.error('');
    process.exit(1);
  }
}

applyMigration().catch(console.error);



