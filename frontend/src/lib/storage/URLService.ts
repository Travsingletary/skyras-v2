/**
 * URL Service
 *
 * Manages URL generation for stored files, handling both public URLs
 * and signed URLs with automatic caching and expiration management.
 */

import { filesDb } from '@/lib/database';
import { StorageFactory } from './StorageFactory';
import type { StorageProvider } from './StorageAdapter';

/**
 * Service for generating and managing file URLs
 */
export class URLService {
  /** Default expiration time for signed URLs (1 hour) */
  private static readonly DEFAULT_EXPIRY = 3600;

  /** Cache buffer time before expiry to regenerate URL (5 minutes) */
  private static readonly CACHE_BUFFER = 300;

  /**
   * Get a valid URL for a file (signed or public)
   * Handles caching and automatic regeneration of expired signed URLs
   *
   * @param fileId Database ID of the file
   * @returns Valid URL to access the file
   * @throws Error if file not found or URL generation fails
   */
  static async getFileUrl(fileId: string): Promise<string> {
    const file = await filesDb.getById(fileId);

    if (!file) {
      throw new Error(`File not found: ${fileId}`);
    }

    // If file is public, return the public URL directly
    if (file.is_public && file.public_url) {
      return file.public_url;
    }

    // For private files, check if cached signed URL is still valid
    if (file.public_url && file.signed_url_expires_at) {
      const expiresAt = new Date(file.signed_url_expires_at);
      const now = new Date();
      const bufferTime = new Date(now.getTime() + this.CACHE_BUFFER * 1000);

      // If URL is still valid (with buffer), return cached URL
      if (expiresAt > bufferTime) {
        return file.public_url;
      }
    }

    // Generate new signed URL
    return await this.regenerateSignedUrl(fileId);
  }

  /**
   * Generate a new signed URL and update the database
   *
   * @param fileId Database ID of the file
   * @returns New signed URL
   * @throws Error if file not found or URL generation fails
   */
  private static async regenerateSignedUrl(fileId: string): Promise<string> {
    const file = await filesDb.getById(fileId);

    if (!file) {
      throw new Error(`File not found: ${fileId}`);
    }

    // Get the appropriate storage adapter
    const adapter = StorageFactory.getAdapter(
      file.storage_provider as StorageProvider
    );

    // Get expiration time from environment or use default
    const expiresIn = parseInt(
      process.env.SIGNED_URL_DEFAULT_EXPIRY || String(this.DEFAULT_EXPIRY),
      10
    );

    // Generate signed URL
    const signedUrl = await adapter.getSignedUrl(file.storage_path, expiresIn);

    // Calculate expiration timestamp
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    // Update database with new signed URL and expiration
    await filesDb.update(fileId, {
      public_url: signedUrl,
      signed_url_expires_at: expiresAt.toISOString(),
    });

    return signedUrl;
  }

  /**
   * Batch URL generation for multiple files
   *
   * @param fileIds Array of database file IDs
   * @returns Map of file ID to URL
   */
  static async getFileUrls(
    fileIds: string[]
  ): Promise<Map<string, string>> {
    const urls = new Map<string, string>();

    // Process all files in parallel
    await Promise.all(
      fileIds.map(async (id) => {
        try {
          const url = await this.getFileUrl(id);
          urls.set(id, url);
        } catch (error) {
          console.error(`Failed to get URL for file ${id}:`, error);
          // Don't throw, just skip this file
        }
      })
    );

    return urls;
  }

  /**
   * Invalidate cached signed URL and force regeneration on next access
   *
   * @param fileId Database ID of the file
   */
  static async invalidateUrl(fileId: string): Promise<void> {
    const file = await filesDb.getById(fileId);

    if (!file) {
      throw new Error(`File not found: ${fileId}`);
    }

    // If file is public, no need to invalidate
    if (file.is_public) {
      return;
    }

    // Set expiration to past date to force regeneration
    await filesDb.update(fileId, {
      signed_url_expires_at: new Date(0).toISOString(),
    });
  }

  /**
   * Update file access mode (public vs private) and regenerate URL
   *
   * @param fileId Database ID of the file
   * @param isPublic Whether the file should be publicly accessible
   */
  static async updateFileAccess(
    fileId: string,
    isPublic: boolean
  ): Promise<void> {
    const file = await filesDb.getById(fileId);

    if (!file) {
      throw new Error(`File not found: ${fileId}`);
    }

    // Get storage adapter
    const adapter = StorageFactory.getAdapter(
      file.storage_provider as StorageProvider
    );

    let newUrl: string;
    let expiresAt: string | undefined;

    if (isPublic) {
      // Generate permanent public URL
      const publicUrl = adapter.getPublicUrl(file.storage_path);
      if (!publicUrl) {
        throw new Error(
          `Provider '${adapter.name}' does not support public URLs`
        );
      }
      newUrl = publicUrl;
      expiresAt = undefined; // Public URLs don't expire
    } else {
      // Generate signed URL
      const expiresIn = parseInt(
        process.env.SIGNED_URL_DEFAULT_EXPIRY || String(this.DEFAULT_EXPIRY),
        10
      );
      newUrl = await adapter.getSignedUrl(file.storage_path, expiresIn);
      expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
    }

    // Update database
    await filesDb.update(fileId, {
      is_public: isPublic,
      public_url: newUrl,
      signed_url_expires_at: expiresAt,
    });
  }

  /**
   * Check if a file's signed URL is expired or about to expire
   *
   * @param fileId Database ID of the file
   * @returns true if URL needs regeneration, false otherwise
   */
  static async needsRefresh(fileId: string): Promise<boolean> {
    const file = await filesDb.getById(fileId);

    if (!file) {
      return false;
    }

    // Public files never need refresh
    if (file.is_public) {
      return false;
    }

    // No expiration timestamp means URL is invalid
    if (!file.signed_url_expires_at) {
      return true;
    }

    // Check if expired or within buffer window
    const expiresAt = new Date(file.signed_url_expires_at);
    const bufferTime = new Date(
      Date.now() + this.CACHE_BUFFER * 1000
    );

    return expiresAt <= bufferTime;
  }
}
