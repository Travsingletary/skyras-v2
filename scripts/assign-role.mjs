#!/usr/bin/env node
/**
 * Assign an RBAC role to a user
 *
 * Usage:
 *   node scripts/assign-role.mjs <userId> <roleName>
 *
 * Example:
 *   node scripts/assign-role.mjs user_123 admin
 *   node scripts/assign-role.mjs test-user-456 user
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const [userId, roleName] = process.argv.slice(2);

if (!userId || !roleName) {
  console.error('❌ Usage: node scripts/assign-role.mjs <userId> <roleName>');
  console.error('');
  console.error('Available roles:');
  console.error('  - admin: Full access to all resources');
  console.error('  - user: Standard user (upload, read files/projects)');
  console.error('');
  console.error('Example:');
  console.error('  node scripts/assign-role.mjs user_123 admin');
  process.exit(1);
}

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('❌ Missing environment variables!');
  console.error('');
  console.error('Required:');
  console.error('  - SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  console.error('');
  console.error('Add these to .env.local');
  process.exit(1);
}

async function assignRole() {
  console.log(`🔐 Assigning role "${roleName}" to user "${userId}"...`);
  console.log('');

  const supabase = createClient(url, serviceKey);

  try {
    // Call the rbac_assign_role function
    const { data, error } = await supabase.rpc('rbac_assign_role', {
      p_user_id: userId,
      p_role_name: roleName,
    });

    if (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }

    console.log(`✅ Successfully assigned role "${roleName}" to user "${userId}"`);
    console.log('');

    // Verify by checking permissions
    const { data: hasPermission, error: checkError } = await supabase.rpc('rbac_user_has_permission', {
      p_user_id: userId,
      p_permission: 'files.upload',
    });

    if (checkError) {
      console.warn('⚠️  Could not verify permissions:', checkError.message);
    } else {
      console.log(`Verification: User ${hasPermission ? 'HAS' : 'DOES NOT HAVE'} "files.upload" permission`);
    }

    console.log('');
    console.log('Next steps:');
    console.log('  1. Set RBAC_ENFORCE=true in .env.local');
    console.log('  2. Restart dev server');
    console.log('  3. Test upload with this userId');

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    process.exit(1);
  }
}

assignRole();
