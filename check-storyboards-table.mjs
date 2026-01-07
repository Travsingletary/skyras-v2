import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
);

// Create a real project
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

console.log('Checking if storyboards table exists...\n');

const { data: storyboard, error: sbError } = await supabase
  .from('storyboards')
  .insert({
    user_id: '00000000-0000-0000-0000-000000000000',
    project_id: project.id,
  })
  .select();

if (sbError) {
  console.log(`❌ Storyboards table error: ${sbError.message}`);
} else {
  console.log(`✅ Storyboards table exists!`);
  console.log(`\nColumns (${Object.keys(storyboard[0]).length}):`);
  Object.keys(storyboard[0]).sort().forEach(col => console.log(`  - ${col}`));

  const storyboardId = storyboard[0].id;

  // Now try storyboard_frames with the storyboard_id
  console.log('\n' + '='.repeat(60));
  console.log('Now checking storyboard_frames with storyboard_id...');
  console.log('='.repeat(60) + '\n');

  const { data: frame, error: frameError } = await supabase
    .from('storyboard_frames')
    .insert({
      user_id: '00000000-0000-0000-0000-000000000000',
      project_id: project.id,
      storyboard_id: storyboardId,
    })
    .select();

  if (frameError) {
    console.log(`❌ Frame insert failed: ${frameError.message}`);
  } else {
    console.log(`✅ Frame insert succeeded!`);
    console.log(`\nColumns (${Object.keys(frame[0]).length}):`);
    Object.keys(frame[0]).sort().forEach(col => console.log(`  - ${col}`));

    // Clean up
    await supabase.from('storyboard_frames').delete().eq('id', frame[0].id);
  }

  // Clean up storyboard
  await supabase.from('storyboards').delete().eq('id', storyboardId);
}

// Clean up project
await supabase.from('projects').delete().eq('id', project.id);
