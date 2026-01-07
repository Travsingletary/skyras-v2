import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
);

console.log('Trying minimal insert...\n');

const { data, error } = await supabase
  .from('reference_library')
  .insert({
    user_id: '00000000-0000-0000-0000-000000000000',
    reference_url: 'https://example.com/test.jpg',
  })
  .select();

if (error) {
  console.log('❌ Insert failed:', error.message);
  console.log('Details:', error.details);
  console.log('Code:', error.code);
} else {
  console.log('✅ Insert succeeded!');
  console.log('\nColumns found:');
  Object.keys(data[0]).sort().forEach(col => console.log(`  - ${col}`));
  console.log('\nFull record:', JSON.stringify(data[0], null, 2));

  // Clean up
  await supabase.from('reference_library').delete().eq('id', data[0].id);
  console.log('\n✅ Cleaned up test record');
}
