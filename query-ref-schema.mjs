import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
);

console.log('Querying reference_library columns via information_schema...\n');

// Query the information schema to get column names
const { data, error } = await supabase.rpc('get_table_columns', {
  table_name: 'reference_library'
});

if (error) {
  console.log('RPC not available, trying direct query...\n');

  // Try to insert a minimal record to see what columns are required
  const { data: testData, error: insertError } = await supabase
    .from('reference_library')
    .insert({
      id: '00000000-0000-0000-0000-000000000001',
      user_id: '00000000-0000-0000-0000-000000000000',
    })
    .select();

  if (insertError) {
    console.log('Insert error details:', insertError);
    console.log('\nLet me try selecting from an empty table to see columns...');

    const { data: selectData, error: selectError } = await supabase
      .from('reference_library')
      .select('*')
      .limit(1);

    if (selectError) {
      console.log('Select error:', selectError);
    } else {
      console.log('Sample data (if any):', selectData);
      if (selectData && selectData.length > 0) {
        console.log('Columns found:', Object.keys(selectData[0]));
      }
    }
  } else {
    console.log('Insert succeeded! Columns:', Object.keys(testData[0]));
    // Clean up
    await supabase.from('reference_library').delete().eq('id', '00000000-0000-0000-0000-000000000001');
  }
} else {
  console.log('Columns:', data);
}
