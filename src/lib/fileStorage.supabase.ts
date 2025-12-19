import { getSupabaseStorageClient } from '@/backend/supabaseClient';
import crypto from 'node:crypto';

// Supabase Storage configuration
const STORAGE_BUCKET = 'user-uploads';

// Allowed file types for upload
const ALLOWED_EXTENSIONS = new Set([
  // Audio
  '.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac',
  // Video
  '.mp4', '.mov', '.avi', '.webm', '.mkv',
  // Images
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
  // Documents
  '.pdf', '.txt', '.md', '.doc', '.docx',
]);

// File size limits
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB per file
const MAX_TOTAL_SIZE = 500 * 1024 * 1024; // 500MB total per request
const MAX_FILE_COUNT = 10; // Max 10 files per upload

/**
 * Generate a unique file ID using UUID v4 format
 */
export function generateFileId(): string {
  return crypto.randomUUID();
}

/**
 * Validate if a file type is allowed
 */
export function validateFileType(filename: string): boolean {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return ALLOWED_EXTENSIONS.has(ext);
}

/**
 * Validate if a file size is within limits
 */
export function validateFileSize(size: number): boolean {
  return size > 0 && size <= MAX_FILE_SIZE;
}

/**
 * Validate total upload size
 */
export function validateTotalSize(sizes: number[]): boolean {
  const total = sizes.reduce((sum, size) => sum + size, 0);
  return total <= MAX_TOTAL_SIZE;
}

/**
 * Validate file count
 */
export function validateFileCount(count: number): boolean {
  return count > 0 && count <= MAX_FILE_COUNT;
}

/**
 * Get storage path for a file
 * Format: YYYY-MM-DD/userId/fileId.ext
 */
function getStoragePath(userId: string, fileId: string, originalName: string): string {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const ext = originalName.substring(originalName.lastIndexOf('.'));
  return `${today}/${userId}/${fileId}${ext}`;
}

/**
 * Save a file to Supabase Storage
 * @param buffer - File buffer
 * @param originalName - Original filename
 * @param userId - User ID for organization
 * @param fileId - Unique file ID (optional, will be generated if not provided)
 * @returns Object with fileId, path, url, and originalName
 */
export async function saveFile(
  buffer: Buffer,
  originalName: string,
  userId: string,
  fileId?: string
): Promise<{ fileId: string; path: string; url: string; originalName: string }> {
  const supabase = getSupabaseStorageClient();

  if (!supabase) {
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    const hasAnonKey = !!process.env.SUPABASE_ANON_KEY;
    const hasUrl = !!process.env.SUPABASE_URL;
    
    console.error('[Storage] Supabase client not initialized:', {
      hasUrl,
      hasServiceKey,
      hasAnonKey,
    });
    
    throw new Error(
      `Supabase client not initialized. Check environment variables: ` +
      `SUPABASE_URL=${hasUrl ? '✓' : '✗'}, ` +
      `SUPABASE_SERVICE_ROLE_KEY=${hasServiceKey ? '✓' : '✗'}, ` +
      `SUPABASE_ANON_KEY=${hasAnonKey ? '✓' : '✗'}`
    );
  }

  const id = fileId || generateFileId();
  const storagePath = getStoragePath(userId, id, originalName);

  console.log('[Storage] Attempting upload:', {
    bucket: STORAGE_BUCKET,
    path: storagePath,
    size: buffer.length,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  });

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, buffer, {
      contentType: getContentType(originalName),
      upsert: false, // Don't overwrite existing files
    });

  if (error) {
    console.error('[Storage] Upload error:', {
      message: error.message,
      statusCode: (error as any).statusCode,
      error: error,
      bucket: STORAGE_BUCKET,
      path: storagePath,
    });
    throw new Error(`Failed to upload file to Supabase: ${error.message} (Status: ${(error as any).statusCode || 'unknown'})`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(storagePath);

  return {
    fileId: id,
    path: storagePath,
    url: urlData.publicUrl,
    originalName,
  };
}

/**
 * Get the content type for a file based on extension
 */
function getContentType(filename: string): string {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  const contentTypes: Record<string, string> = {
    // Audio
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.m4a': 'audio/mp4',
    '.aac': 'audio/aac',
    '.ogg': 'audio/ogg',
    '.flac': 'audio/flac',
    // Video
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.webm': 'video/webm',
    '.mkv': 'video/x-matroska',
    // Images
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    // Documents
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };

  return contentTypes[ext] || 'application/octet-stream';
}

/**
 * Get public URL for a file
 */
export async function getFileUrl(path: string): Promise<string | null> {
  const supabase = getSupabaseStorageClient();

  if (!supabase) {
    return null;
  }

  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path);

  return data.publicUrl;
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(path: string): Promise<boolean> {
  const supabase = getSupabaseStorageClient();

  if (!supabase) {
    return false;
  }

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([path]);

  if (error) {
    console.error('Error deleting file:', error);
    return false;
  }

  return true;
}

/**
 * Get file metadata from Supabase Storage
 */
export async function getFileMetadata(path: string): Promise<{
  path: string;
  size: number;
  created: Date;
  contentType: string;
} | null> {
  const supabase = getSupabaseStorageClient();

  if (!supabase) {
    return null;
  }

  // List files to get metadata
  const pathParts = path.split('/');
  const fileName = pathParts.pop();
  const directory = pathParts.join('/');

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .list(directory);

  if (error || !data) {
    console.error('Error getting file metadata:', error);
    return null;
  }

  const file = data.find(f => f.name === fileName);

  if (!file) {
    return null;
  }

  return {
    path,
    size: file.metadata?.size || 0,
    created: new Date(file.created_at),
    contentType: file.metadata?.mimetype || 'application/octet-stream',
  };
}

/**
 * Check if Supabase Storage is properly configured
 */
export async function isStorageConfigured(): Promise<boolean> {
  const supabase = getSupabaseStorageClient();

  if (!supabase) {
    console.error('[Storage Config] Supabase client is null');
    return false;
  }

  try {
    // Try to list buckets to verify connection
    // Note: listBuckets might require service role key
    const { data, error } = await supabase.storage.listBuckets();

    if (error) {
      console.error('[Storage Config] Bucket list failed:', {
        message: error.message,
        statusCode: (error as any).statusCode,
        // Don't fail the check if it's just a permission issue - bucket might still exist
      });
      
      // If we can't list buckets, assume bucket exists if we have the right keys
      // This is a fallback for when anon key doesn't have list permission
      const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (hasServiceKey) {
        console.log('[Storage Config] Cannot list buckets, but service role key is set - assuming bucket exists');
        return true;
      }
      
      return false;
    }

    // Check if our bucket exists
    const bucketExists = data?.some(bucket => bucket.name === STORAGE_BUCKET);

    if (!bucketExists) {
      console.warn(`[Storage Config] Storage bucket '${STORAGE_BUCKET}' does not exist. Please create it in Supabase dashboard.`);
      return false;
    }

    console.log('[Storage Config] Bucket exists and is accessible');
    return true;
  } catch (error) {
    console.error('[Storage Config] Configuration error:', error);
    return false;
  }
}

export const FILE_LIMITS = {
  MAX_FILE_SIZE,
  MAX_TOTAL_SIZE,
  MAX_FILE_COUNT,
  ALLOWED_EXTENSIONS: Array.from(ALLOWED_EXTENSIONS),
  STORAGE_BUCKET,
};
