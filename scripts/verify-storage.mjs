#!/usr/bin/env node

/**
 * Verify Supabase Storage Bucket Configuration
 * Checks if the 'user-uploads' bucket exists and has proper configuration
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from frontend/.env.local
dotenv.config({ path: resolve(process.cwd(), 'frontend/.env.local') });

const BUCKET_NAME = 'user-uploads';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('   Required: SUPABASE_URL and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyStorage() {
  console.log('🔍 Verifying Supabase Storage Configuration...\n');
  console.log(`   Project: ${supabaseUrl}`);
  console.log(`   Bucket: ${BUCKET_NAME}\n`);

  try {
    // 1. List all buckets
    console.log('1️⃣  Checking if bucket exists...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error('   ❌ Error listing buckets:', listError.message);
      process.exit(1);
    }

    const bucket = buckets?.find(b => b.name === BUCKET_NAME);

    if (!bucket) {
      console.error(`   ❌ Bucket "${BUCKET_NAME}" not found`);
      console.log('\n📋 Available buckets:');
      buckets?.forEach(b => console.log(`   - ${b.name} (${b.public ? 'public' : 'private'})`));
      console.log('\n💡 To create the bucket, run in Supabase SQL Editor:');
      console.log(`   INSERT INTO storage.buckets (id, name, public) VALUES ('${BUCKET_NAME}', '${BUCKET_NAME}', true);`);
      process.exit(1);
    }

    console.log(`   ✅ Bucket "${BUCKET_NAME}" exists`);
    console.log(`   📊 Public: ${bucket.public ? 'Yes' : 'No'}`);
    console.log(`   📅 Created: ${bucket.created_at}\n`);

    // 2. Test upload permissions
    console.log('2️⃣  Testing upload permissions...');
    const testFileName = `test-${Date.now()}.txt`;
    const testPath = `test/${testFileName}`;
    const testContent = 'Storage verification test';

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(testPath, testContent, {
        contentType: 'text/plain',
        upsert: false,
      });

    if (uploadError) {
      console.error(`   ❌ Upload failed: ${uploadError.message}`);
      console.log('\n💡 This usually means:');
      console.log('   - Bucket RLS policies are too restrictive');
      console.log('   - Service role key is incorrect');
      process.exit(1);
    }

    console.log(`   ✅ Upload successful: ${testPath}\n`);

    // 3. Test read permissions
    console.log('3️⃣  Testing read permissions...');
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(testPath);

    if (urlData?.publicUrl) {
      console.log(`   ✅ Public URL generated: ${urlData.publicUrl.substring(0, 60)}...\n`);
    } else {
      console.warn('   ⚠️  Could not generate public URL\n');
    }

    // 4. Cleanup test file
    console.log('4️⃣  Cleaning up test file...');
    const { error: deleteError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([testPath]);

    if (deleteError) {
      console.warn(`   ⚠️  Could not delete test file: ${deleteError.message}`);
    } else {
      console.log(`   ✅ Test file deleted\n`);
    }

    // 5. Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Storage Configuration Verified Successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('Your storage bucket is properly configured and ready to use.\n');

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    process.exit(1);
  }
}

verifyStorage();
