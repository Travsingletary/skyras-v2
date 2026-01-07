import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
);

console.log('Inserting test record with all possible fields...\n');

// Try to insert with the correct field names based on error message
const { data, error } = await supabase
  .from('reference_library')
  .insert({
    user_id: '00000000-0000-0000-0000-000000000000',
    project_id: '00000000-0000-0000-0000-000000000001',
    reference_url: 'https://example.com/test.jpg',
    reference_type: 'mood',
    description: 'Test reference',
    is_approved: false,
    metadata: {},
  })
  .select();

if (error) {
  console.log('❌ Insert failed:', error.message);
  console.log('Details:', error.details);
} else {
  console.log('✅ Insert succeeded!');
  console.log('Columns:', Object.keys(data[0]).sort());
  console.log('\nFull record:', data[0]);

  // Clean up
  await supabase.from('reference_library').delete().eq('id', data[0].id);
  console.log('\n✅ Cleaned up test record');
}
