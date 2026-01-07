import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
);

// Create a real project for foreign key constraints
const { data: project } = await supabase
  .from('projects')
  .insert({
    user_id: '00000000-0000-0000-0000-000000000000',
    name: 'Schema Test Project',
    type: 'campaign',
    status: 'active',
    metadata: {},
  })
  .select()
  .single();

console.log('Checking storyboard_frames with minimal fields...\n');

const { data: frame, error: frameError } = await supabase
  .from('storyboard_frames')
  .insert({
    user_id: '00000000-0000-0000-0000-000000000000',
    project_id: project.id,
  })
  .select();

if (frameError) {
  console.log(`❌ Insert failed: ${frameError.message}`);
  console.log(`Code: ${frameError.code}`);
  console.log(`Details: ${frameError.details}`);
} else {
  console.log(`✅ Insert succeeded`);
  console.log(`\nColumns (${Object.keys(frame[0]).length}):`);
  Object.keys(frame[0]).sort().forEach(col => console.log(`  - ${col}`));

  // Clean up
  await supabase.from('storyboard_frames').delete().eq('id', frame[0].id);
}

// Clean up project
await supabase.from('projects').delete().eq('id', project.id);
