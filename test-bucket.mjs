import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env.local') });

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;

console.log('Testing Supabase Storage bucket...');
console.log('URL:', url);
console.log('Key:', key ? `${key.substring(0, 20)}...` : 'NOT SET');

const client = createClient(url, key);

// Try to list buckets
const { data: buckets, error: bucketsError } = await client.storage.listBuckets();

if (bucketsError) {
  console.error('❌ Error listing buckets:', bucketsError);
} else {
  console.log('✅ Buckets found:', buckets.map(b => b.name).join(', '));

  const hasUserUploads = buckets.some(b => b.name === 'user-uploads');
  if (hasUserUploads) {
    console.log('✅ user-uploads bucket exists');
  } else {
    console.log('❌ user-uploads bucket NOT FOUND');
    console.log('Available buckets:', buckets.map(b => `- ${b.name} (${b.public ? 'public' : 'private'})`).join('\n'));
  }
}
