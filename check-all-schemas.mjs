import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
);

async function checkTable(tableName, minimalRecord) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Checking ${tableName}...`);
  console.log('='.repeat(60));

  const { data, error } = await supabase
    .from(tableName)
    .insert(minimalRecord)
    .select();

  if (error) {
    console.log(`❌ Insert failed: ${error.message}`);
    return null;
  } else {
    console.log(`✅ Insert succeeded`);
    console.log(`\nColumns (${Object.keys(data[0]).length}):`);
    Object.keys(data[0]).sort().forEach(col => console.log(`  - ${col}`));

    // Clean up
    await supabase.from(tableName).delete().eq('id', data[0].id);
    return Object.keys(data[0]).sort();
  }
}

// Check reference_library
await checkTable('reference_library', {
  user_id: '00000000-0000-0000-0000-000000000000',
  reference_url: 'https://example.com/test.jpg',
});

// Check style_cards
await checkTable('style_cards', {
  user_id: '00000000-0000-0000-0000-000000000000',
  project_id: '00000000-0000-0000-0000-000000000001',
  name: 'Test Style',
});

// Check storyboard_frames
await checkTable('storyboard_frames', {
  user_id: '00000000-0000-0000-0000-000000000000',
  project_id: '00000000-0000-0000-0000-000000000001',
  shot_number: 1,
  prompt: 'Test prompt',
});

console.log('\n' + '='.repeat(60));
console.log('Schema inspection complete');
console.log('='.repeat(60) + '\n');
