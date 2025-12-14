/**
 * Supabase Storage Adapter
 *
 * Implements the StorageAdapter interface for Supabase Storage.
 * Refactored from the original fileStorage.supabase.ts to use the adapter pattern.
 */

import { getSupabaseStorageClient } from '@/backend/supabaseClient';
import type {
  StorageAdapter,
  UploadOptions,
  UploadResult,
  FileMetadata,
  StorageProvider,
} from '../StorageAdapter';
import { StorageError } from '../StorageAdapter';

/**
 * Supabase Storage adapter implementation
 */
export class SupabaseStorageAdapter implements StorageAdapter {
  readonly name: StorageProvider = 'supabase';
  private readonly bucket: string;

  constructor(bucket: string = 'user-uploads') {
    this.bucket = bucket;
  }

  /**
   * Upload a file to Supabase Storage
   */
  async upload(options: UploadOptions): Promise<UploadResult> {
    const client = getSupabaseStorageClient();

    if (!client) {
      throw new StorageError(
        'Supabase client not initialized. Check SUPABASE_URL and SUPABASE_ANON_KEY environment variables.',
        this.name,
        'upload'
      );
    }

    try {
      const { data, error } = await client.storage
        .from(this.bucket)
        .upload(options.path, options.buffer, {
          contentType: options.contentType,
          upsert: false, // Don't overwrite existing files
        });

      if (error) {
        throw new StorageError(
          `Failed to upload file to Supabase: ${error.message}`,
          this.name,
          'upload',
          error as Error
        );
      }

      return {
        path: options.path,
        size: options.buffer.length,
        provider: this.name,
      };
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      throw new StorageError(
        `Unexpected error during upload: ${(error as Error).message}`,
        this.name,
        'upload',
        error as Error
      );
    }
  }

  /**
   * Delete a file from Supabase Storage
   */
  async delete(path: string): Promise<boolean> {
    const client = getSupabaseStorageClient();

    if (!client) {
      console.error('Supabase client not initialized');
      return false;
    }

    try {
      const { error } = await client.storage.from(this.bucket).remove([path]);

      if (error) {
        console.error('Error deleting file from Supabase:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Unexpected error deleting file:', error);
      return false;
    }
  }

  /**
   * Check if a file exists in Supabase Storage
   */
  async exists(path: string): Promise<boolean> {
    const metadata = await this.getMetadata(path);
    return metadata !== null;
  }

  /**
   * Get a permanent public URL for a file
   * Note: This only works if the bucket is configured as public
   */
  getPublicUrl(path: string): string | null {
    const client = getSupabaseStorageClient();

    if (!client) {
      return null;
    }

    try {
      const { data } = client.storage.from(this.bucket).getPublicUrl(path);
      return data.publicUrl;
    } catch (error) {
      console.error('Error getting public URL:', error);
      return null;
    }
  }

  /**
   * Generate a temporary signed URL for secure file access
   * @param path Storage path to the file
   * @param expiresIn Expiration time in seconds (max 3600 for Supabase)
   */
  async getSignedUrl(path: string, expiresIn: number): Promise<string> {
    const client = getSupabaseStorageClient();

    if (!client) {
      throw new StorageError(
        'Supabase client not initialized',
        this.name,
        'getSignedUrl'
      );
    }

    try {
      const { data, error } = await client.storage
        .from(this.bucket)
        .createSignedUrl(path, expiresIn);

      if (error) {
        throw new StorageError(
          `Failed to create signed URL: ${error.message}`,
          this.name,
          'getSignedUrl',
          error as Error
        );
      }

      if (!data || !data.signedUrl) {
        throw new StorageError(
          'Signed URL generation returned no data',
          this.name,
          'getSignedUrl'
        );
      }

      return data.signedUrl;
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      throw new StorageError(
        `Unexpected error generating signed URL: ${(error as Error).message}`,
        this.name,
        'getSignedUrl',
        error as Error
      );
    }
  }

  /**
   * Get file metadata from Supabase Storage
   */
  async getMetadata(path: string): Promise<FileMetadata | null> {
    const client = getSupabaseStorageClient();

    if (!client) {
      return null;
    }

    try {
      // Split path to get directory and filename
      const pathParts = path.split('/');
      const fileName = pathParts.pop();
      const directory = pathParts.join('/');

      if (!fileName) {
        return null;
      }

      // List files in the directory to find our file
      const { data, error } = await client.storage
        .from(this.bucket)
        .list(directory);

      if (error || !data) {
        console.error('Error getting file metadata:', error);
        return null;
      }

      const file = data.find((f) => f.name === fileName);

      if (!file) {
        return null;
      }

      return {
        path,
        size: file.metadata?.size || 0,
        created: new Date(file.created_at),
        contentType: file.metadata?.mimetype || 'application/octet-stream',
      };
    } catch (error) {
      console.error('Unexpected error getting metadata:', error);
      return null;
    }
  }

  /**
   * Check if Supabase Storage is properly configured
   */
  async isConfigured(): Promise<boolean> {
    const client = getSupabaseStorageClient();

    if (!client) {
      return false;
    }

    try {
      // Try to list buckets to verify connection
      const { data, error } = await client.storage.listBuckets();

      if (error) {
        console.error('Supabase storage check failed:', error);
        return false;
      }

      // Check if our bucket exists
      const bucketExists = data?.some((bucket) => bucket.name === this.bucket);

      if (!bucketExists) {
        console.warn(
          `Storage bucket '${this.bucket}' does not exist. Please create it in Supabase dashboard.`
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Supabase storage configuration error:', error);
      return false;
    }
  }
}
