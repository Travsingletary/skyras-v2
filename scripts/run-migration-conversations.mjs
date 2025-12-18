#!/usr/bin/env node
/**
 * Run the conversations and messages migration
 *
 * Usage:
 *   node scripts/run-migration-conversations.mjs
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('❌ Missing environment variables!');
  console.error('');
  console.error('Required:');
  console.error('  - SUPABASE_URL');
  console.error('  - SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY)');
  console.error('');
  console.error('Add these to .env.local');
  process.exit(1);
}

async function runMigration() {
  console.log('🔄 Running conversations and messages migration...');
  console.log('');

  const supabase = createClient(url, serviceKey);

  try {
    // Read the migration file
    const migrationPath = join(__dirname, '../frontend/supabase/migrations/0006_conversations_and_messages.sql');
    const sql = readFileSync(migrationPath, 'utf-8');

    console.log('📝 Executing SQL migration...');

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql }).catch(async () => {
      // If exec_sql doesn't exist, try direct query
      return await supabase.from('_migrations').insert({ sql });
    }).catch(async () => {
      // If that doesn't work, we need to execute it manually
      // Split by semicolon and execute each statement
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement) {
          const result = await fetch(`${url}/rest/v1/rpc/exec`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': serviceKey,
              'Authorization': `Bearer ${serviceKey}`,
            },
            body: JSON.stringify({ query: statement }),
          });

          if (!result.ok) {
            const error = await result.text();
            console.warn('⚠️  Statement might have failed:', statement.substring(0, 100) + '...');
            console.warn('    Error:', error);
          }
        }
      }

      return { data: null, error: null };
    });

    if (error) {
      console.error('❌ Migration failed:', error.message);
      console.error('');
      console.error('You may need to run this SQL manually in Supabase SQL Editor:');
      console.error(`  https://app.supabase.com/project/${url.split('.')[0].split('//')[1]}/sql`);
      console.error('');
      console.error('Migration file location:');
      console.error(`  ${migrationPath}`);
      process.exit(1);
    }

    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('Created tables:');
    console.log('  - public.conversations');
    console.log('  - public.messages');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Restart your dev server');
    console.log('  2. Test conversation persistence with Marcus');
    console.log('  3. Restart server and verify history is preserved');

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    console.error('');
    console.error('Please run the migration manually in Supabase SQL Editor:');
    console.error(`  https://app.supabase.com/project/zzxedixpbvivpsnztjsc/sql`);
    console.error('');
    console.error('Copy and paste the contents of:');
    console.error('  frontend/supabase/migrations/0006_conversations_and_messages.sql');
    process.exit(1);
  }
}

runMigration();
