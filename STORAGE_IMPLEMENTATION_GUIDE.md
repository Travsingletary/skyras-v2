# Storage-Agnostic Upload System - Implementation Guide

## Overview

The storage system has been refactored from a direct Supabase implementation to a provider-agnostic architecture using the **Adapter Pattern**. This allows swapping storage backends (Supabase, QNAP, S3, etc.) without code changes.

## Key Features

✅ **Storage Abstraction Layer** - Clean interface for multiple storage providers
✅ **Flexible Access Control** - Per-file public/private flag
✅ **Signed URLs** - Automatic generation and caching with expiration management
✅ **Provider Tracking** - Database tracks which provider stores each file
✅ **Backwards Compatible** - Existing public URLs continue to work
✅ **Vercel Ready** - Works immediately on Vercel without QNAP dependency

## Architecture

### Core Components

```
src/lib/storage/
├── StorageAdapter.ts              # Interface & types
├── StorageFactory.ts              # Adapter registration & retrieval
├── URLService.ts                  # URL generation & caching
└── adapters/
    └── SupabaseStorageAdapter.ts  # Supabase implementation
```

### Storage Adapter Interface

All storage providers implement this interface:

```typescript
interface StorageAdapter {
  readonly name: StorageProvider;
  upload(options: UploadOptions): Promise<UploadResult>;
  delete(path: string): Promise<boolean>;
  exists(path: string): Promise<boolean>;
  getPublicUrl(path: string): string | null;
  getSignedUrl(path: string, expiresIn: number): Promise<string>;
  getMetadata(path: string): Promise<FileMetadata | null>;
  isConfigured(): Promise<boolean>;
}
```

### Database Schema

Three new columns added to the `files` table:

| Column | Type | Description |
|--------|------|-------------|
| `storage_provider` | TEXT | Provider identifier (supabase, qnap, local, s3) |
| `is_public` | BOOLEAN | Whether file has permanent public URL |
| `signed_url_expires_at` | TIMESTAMPTZ | Expiration timestamp for signed URLs |

## Usage

### 1. Environment Configuration

Add to your `.env` file:

```bash
# Storage Configuration
DEFAULT_STORAGE_PROVIDER=supabase  # Options: supabase, qnap, local, s3
SIGNED_URL_DEFAULT_EXPIRY=3600     # 1 hour in seconds

# Supabase (required for Supabase provider)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
```

### 2. Uploading Files

The `/api/upload` endpoint now uses the storage adapter:

```typescript
// POST /api/upload
const formData = new FormData();
formData.append('files', file);
formData.append('userId', userId);
formData.append('projectId', projectId); // optional

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData,
});

const result = await response.json();
// result.data.files[0].url - Signed URL (expires in 1 hour by default)
```

**Default Behavior:**
- Files are **private** by default (`is_public = false`)
- Returns a **signed URL** that expires in 1 hour
- URL is cached in database with expiration timestamp

### 3. Accessing Files

#### Option A: Use the cached URL from database

```typescript
const file = await filesDb.getById(fileId);
const url = file.public_url; // May be expired if it's a signed URL
```

#### Option B: Use URLService for automatic refresh

```typescript
import { URLService } from '@/lib/storage/URLService';

// Get a valid URL (automatically regenerates if expired)
const url = await URLService.getFileUrl(fileId);
```

#### Option C: Use the API endpoint

```typescript
// GET /api/files/[id]/url
const response = await fetch(`/api/files/${fileId}/url`);
const { data } = await response.json();
const url = data.url; // Fresh URL, regenerated if needed
```

### 4. Switching Between Public and Private

```typescript
import { URLService } from '@/lib/storage/URLService';

// Make file public (permanent URL)
await URLService.updateFileAccess(fileId, true);

// Make file private (signed URL with expiration)
await URLService.updateFileAccess(fileId, false);
```

### 5. Batch URL Generation

```typescript
import { URLService } from '@/lib/storage/URLService';

const fileIds = ['file-1', 'file-2', 'file-3'];
const urls = await URLService.getFileUrls(fileIds);

urls.forEach((url, fileId) => {
  console.log(`${fileId}: ${url}`);
});
```

## Storage Providers

### Supabase Storage (Default)

**Status:** ✅ Fully Implemented

**Features:**
- Cloud storage accessible from Vercel
- Signed URLs (max 3600 seconds expiration)
- Public URLs (if bucket is public)
- Automatic content type detection

**Configuration:**
```bash
DEFAULT_STORAGE_PROVIDER=supabase
SUPABASE_URL=your_url
SUPABASE_ANON_KEY=your_key
```

### Future Providers

The interface is designed to support additional providers:

- **QNAP/NAS** - Local network storage
- **AWS S3** - Cloud object storage
- **Local Filesystem** - Development/testing

## Migration Guide

### Step 1: Run Database Migration

```bash
# Apply the migration to add new columns
psql your_database < frontend/supabase/migrations/0004_add_storage_provider.sql
```

Or run in Supabase SQL Editor:
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `0004_add_storage_provider.sql`
3. Execute

### Step 2: Deploy Code

The code is backwards compatible:
- Existing files keep `is_public = true` and public URLs
- New uploads default to `is_public = false` and signed URLs
- No breaking changes to API response format

### Step 3: Verify

```bash
# Test upload
curl -X POST http://localhost:3000/api/upload \
  -F "files=@test.jpg" \
  -F "userId=test-user"

# Check response includes storage_provider
# {
#   "success": true,
#   "data": {
#     "files": [
#       {
#         "id": "...",
#         "url": "https://...signed_url...",
#         ...
#       }
#     ]
#   }
# }
```

## Security Considerations

### Signed URL Expiration

- **Default Expiry:** 1 hour (configurable via `SIGNED_URL_DEFAULT_EXPIRY`)
- **Cache Buffer:** 5 minutes before expiry, URLs are regenerated
- **Database Tracking:** Expiration timestamp stored for efficient cache management

### Access Control

- **Private by Default:** New uploads are `is_public = false`
- **Per-File Control:** Each file can be independently public or private
- **URL Regeneration:** Expired signed URLs are automatically regenerated on access

### Best Practices

1. **Public Files:** Use for assets that need permanent URLs (avatars, public documents)
2. **Private Files:** Use for user-uploaded content that needs access control
3. **Short Expiry:** For sensitive files, use shorter expiration times (e.g., 300 seconds)
4. **Long Expiry:** For frequently accessed files, use longer times (e.g., 3600 seconds)

## API Reference

### Storage Adapter Methods

```typescript
// Upload a file
await adapter.upload({
  buffer: Buffer.from(...),
  path: '2025-01-15/user-123/file-abc.jpg',
  contentType: 'image/jpeg',
  isPublic: false,
});

// Get signed URL (expires after expiresIn seconds)
const signedUrl = await adapter.getSignedUrl(path, 3600);

// Get permanent public URL (if supported)
const publicUrl = adapter.getPublicUrl(path);

// Delete a file
await adapter.delete(path);

// Check if file exists
const exists = await adapter.exists(path);

// Get file metadata
const metadata = await adapter.getMetadata(path);

// Check if configured
const ready = await adapter.isConfigured();
```

### URLService Methods

```typescript
// Get valid URL for a file (auto-refresh if expired)
const url = await URLService.getFileUrl(fileId);

// Batch URL generation
const urls = await URLService.getFileUrls([...fileIds]);

// Invalidate cached URL (force regeneration)
await URLService.invalidateUrl(fileId);

// Change file access mode
await URLService.updateFileAccess(fileId, isPublic);

// Check if URL needs refresh
const needsRefresh = await URLService.needsRefresh(fileId);
```

### API Endpoints

#### Upload Files
```
POST /api/upload
Content-Type: multipart/form-data

Body:
  files: File[] (required)
  userId: string (required)
  projectId: string (optional)

Response:
{
  "success": true,
  "data": {
    "files": [
      {
        "id": "uuid",
        "url": "signed_url",
        "path": "storage_path",
        ...
      }
    ]
  }
}
```

#### Get File URL
```
GET /api/files/[id]/url

Response:
{
  "success": true,
  "data": {
    "url": "signed_url_or_public_url"
  }
}
```

## Troubleshooting

### Files not uploading

1. Check Supabase configuration:
```typescript
const adapter = StorageFactory.getAdapter('supabase');
const isConfigured = await adapter.isConfigured();
console.log('Storage configured:', isConfigured);
```

2. Verify environment variables:
```bash
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY
```

3. Check Supabase bucket exists:
   - Open Supabase Dashboard → Storage
   - Verify `user-uploads` bucket exists
   - Check bucket permissions

### Signed URLs expiring too quickly

Increase expiration time:
```bash
# .env
SIGNED_URL_DEFAULT_EXPIRY=7200  # 2 hours
```

### URLs not regenerating

The URLService uses a 5-minute cache buffer. If you need immediate regeneration:
```typescript
await URLService.invalidateUrl(fileId);
const freshUrl = await URLService.getFileUrl(fileId);
```

## Testing

Run integration tests:
```bash
npm test -- storage-integration.test.ts
```

Manual testing checklist:
- [ ] Upload a file via `/api/upload`
- [ ] Verify file appears in Supabase Storage bucket
- [ ] Check database record has `storage_provider = 'supabase'`
- [ ] Access file via signed URL
- [ ] Wait for expiration, verify URL regenerates
- [ ] Update file to public, verify permanent URL works

## Performance Considerations

### URL Caching

- Signed URLs are cached in database with expiration timestamp
- Reduces API calls to storage provider
- 5-minute buffer prevents race conditions near expiry

### Batch Operations

For multiple files, use batch methods to reduce database queries:
```typescript
// Good: Single query for multiple URLs
const urls = await URLService.getFileUrls([...fileIds]);

// Bad: Multiple queries
for (const id of fileIds) {
  const url = await URLService.getFileUrl(id);
}
```

### Database Indexes

The migration creates indexes for efficient queries:
- `idx_files_storage_provider` - Filter by provider
- `idx_files_signed_url_expires_at` - Find expired URLs

## Future Enhancements

### Planned Features

1. **QNAP Adapter** - Local NAS storage integration
2. **S3 Adapter** - AWS S3 support
3. **Chunked Uploads** - Support files >100MB
4. **Background URL Refresh** - Cron job to regenerate expiring URLs
5. **Provider Migration** - Tools to move files between providers
6. **CDN Integration** - CloudFront/Cloudflare caching

### Adding a New Provider

1. Create adapter implementation:
```typescript
// src/lib/storage/adapters/S3StorageAdapter.ts
export class S3StorageAdapter implements StorageAdapter {
  readonly name = 's3';
  // ... implement all methods
}
```

2. Register in factory:
```typescript
// src/lib/storage/StorageFactory.ts
StorageFactory.register('s3', new S3StorageAdapter());
```

3. Update type definition:
```typescript
// src/types/database.ts
export type StorageProvider = 'supabase' | 'qnap' | 'local' | 's3';
```

4. Update database constraint:
```sql
ALTER TABLE files DROP CONSTRAINT valid_storage_provider;
ALTER TABLE files ADD CONSTRAINT valid_storage_provider
  CHECK (storage_provider IN ('supabase', 'qnap', 'local', 's3'));
```

## Support

For issues or questions:
1. Check this guide for common solutions
2. Review the implementation plan at `/Users/user/.claude/plans/peaceful-spinning-trinket.md`
3. Check Supabase documentation for storage-specific issues
4. Review code comments in `src/lib/storage/` files

---

**Implementation Date:** 2025-12-14
**Version:** 1.0.0
**Status:** Production Ready ✅
