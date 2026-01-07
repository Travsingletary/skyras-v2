import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
);

console.log('Checking database schema...\n');

// Check if reference_library exists
const { data, error } = await supabase
  .from('reference_library')
  .select('*')
  .limit(0);

if (error) {
  console.log('❌ reference_library table error:', error.message);
} else {
  console.log('✅ reference_library table exists');
}

// Check if style_cards exists
const { error: scError } = await supabase
  .from('style_cards')
  .select('*')
  .limit(0);

if (scError) {
  console.log('❌ style_cards table error:', scError.message);
} else {
  console.log('✅ style_cards table exists');
}

// Check if storyboard_frames exists
const { error: sfError } = await supabase
  .from('storyboard_frames')
  .select('*')
  .limit(0);

if (sfError) {
  console.log('❌ storyboard_frames table error:', sfError.message);
} else {
  console.log('✅ storyboard_frames table exists');
}

console.log('\nDone.');
