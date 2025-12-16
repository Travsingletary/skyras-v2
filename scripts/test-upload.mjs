/**
 * Usage:
 *   node scripts/test-upload.mjs /path/to/file.png user_123 http://localhost:3000
 *
 * Notes:
 * - This does NOT start your dev server for you.
 * - It posts to /api/upload with multipart/form-data.
 */

import fs from 'node:fs';
import path from 'node:path';

const filePath = process.argv[2];
const userId = process.argv[3] || 'user_test';
const baseUrl = process.argv[4] || 'http://localhost:3000';

if (!filePath) {
  console.error('Missing file path. Example: node scripts/test-upload.mjs ./public/vercel.svg user_123 http://localhost:3000');
  process.exit(1);
}

const abs = path.resolve(process.cwd(), filePath);
if (!fs.existsSync(abs)) {
  console.error(`File not found: ${abs}`);
  process.exit(1);
}

const fileName = path.basename(abs);
const buf = fs.readFileSync(abs);

const form = new FormData();
form.append('userId', userId);
form.append('files', new Blob([buf]), fileName);

const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/upload`, {
  method: 'POST',
  body: form,
});

const text = await res.text();
console.log(`Status: ${res.status}`);
try {
  console.log(JSON.stringify(JSON.parse(text), null, 2));
} catch {
  console.log(text);
}


