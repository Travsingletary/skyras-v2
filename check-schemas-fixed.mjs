import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
);

console.log('Creating test project first...\n');

// Create a real project for foreign key constraints
const { data: project, error: projError } = await supabase
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

if (projError) {
  console.log('Failed to create project:', projError.message);
  process.exit(1);
}

console.log(`✅ Created project: ${project.id}\n`);

// Check style_cards
console.log('='.repeat(60));
console.log('Checking style_cards...');
console.log('='.repeat(60));

const { data: styleCard, error: scError } = await supabase
  .from('style_cards')
  .insert({
    user_id: '00000000-0000-0000-0000-000000000000',
    project_id: project.id,
    name: 'Test Style',
  })
  .select();

if (scError) {
  console.log(`❌ Insert failed: ${scError.message}`);
} else {
  console.log(`✅ Insert succeeded`);
  console.log(`\nColumns (${Object.keys(styleCard[0]).length}):`);
  Object.keys(styleCard[0]).sort().forEach(col => console.log(`  - ${col}`));

  // Clean up
  await supabase.from('style_cards').delete().eq('id', styleCard[0].id);
}

// Check storyboard_frames - try without prompt
console.log('\n' + '='.repeat(60));
console.log('Checking storyboard_frames...');
console.log('='.repeat(60));

const { data: frame, error: frameError } = await supabase
  .from('storyboard_frames')
  .insert({
    user_id: '00000000-0000-0000-0000-000000000000',
    project_id: project.id,
    shot_number: 1,
  })
  .select();

if (frameError) {
  console.log(`❌ Insert failed: ${frameError.message}`);
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

console.log('\n' + '='.repeat(60));
console.log('Schema inspection complete');
console.log('='.repeat(60) + '\n');
