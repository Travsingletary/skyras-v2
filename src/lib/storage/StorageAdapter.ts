/**
 * Storage Adapter Interface
 *
 * Provides a provider-agnostic abstraction layer for file storage operations.
 * Supports multiple storage backends (Supabase, QNAP, S3, local filesystem)
 * that can be swapped via configuration without code changes.
 */

export type StorageProvider = 'supabase' | 'qnap' | 'local' | 's3';

/**
 * Core storage adapter interface that all storage providers must implement
 */
export interface StorageAdapter {
  /** Provider identifier (e.g., 'supabase', 's3') */
  readonly name: StorageProvider;

  /**
   * Upload a file to storage
   * @param options Upload configuration including buffer, path, and content type
   * @returns Upload result with path, size, and provider info
   */
  upload(options: UploadOptions): Promise<UploadResult>;

  /**
   * Delete a file from storage
   * @param path Storage path to the file
   * @returns true if deleted successfully, false otherwise
   */
  delete(path: string): Promise<boolean>;

  /**
   * Check if a file exists in storage
   * @param path Storage path to the file
   * @returns true if file exists, false otherwise
   */
  exists(path: string): Promise<boolean>;

  /**
   * Get a permanent public URL for a file (if supported)
   * @param path Storage path to the file
   * @returns Public URL or null if not supported/not public
   */
  getPublicUrl(path: string): string | null;

  /**
   * Generate a temporary signed URL for secure file access
   * @param path Storage path to the file
   * @param expiresIn Expiration time in seconds
   * @returns Signed URL that expires after the specified duration
   */
  getSignedUrl(path: string, expiresIn: number): Promise<string>;

  /**
   * Get file metadata from storage
   * @param path Storage path to the file
   * @returns File metadata or null if not found
   */
  getMetadata(path: string): Promise<FileMetadata | null>;

  /**
   * Check if the storage provider is properly configured and accessible
   * @returns true if configured and ready to use, false otherwise
   */
  isConfigured(): Promise<boolean>;
}

/**
 * Options for uploading a file
 */
export interface UploadOptions {
  /** File content as a Buffer */
  buffer: Buffer;
  /** Storage path where the file should be saved */
  path: string;
  /** MIME type of the file */
  contentType: string;
  /** Whether the file should be publicly accessible (default: false) */
  isPublic?: boolean;
  /** Optional metadata to store with the file */
  metadata?: Record<string, any>;
}

/**
 * Result of a successful file upload
 */
export interface UploadResult {
  /** Storage path where the file was saved */
  path: string;
  /** File size in bytes */
  size: number;
  /** Storage provider that handled the upload */
  provider: StorageProvider;
  /** Optional ETag or version identifier */
  etag?: string;
}

/**
 * File metadata retrieved from storage
 */
export interface FileMetadata {
  /** Storage path to the file */
  path: string;
  /** File size in bytes */
  size: number;
  /** MIME type of the file */
  contentType: string;
  /** File creation timestamp */
  created: Date;
  /** Last modification timestamp (if available) */
  modified?: Date;
  /** Optional ETag or version identifier */
  etag?: string;
}

/**
 * Error thrown when storage operations fail
 */
export class StorageError extends Error {
  constructor(
    message: string,
    public readonly provider: StorageProvider,
    public readonly operation: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'StorageError';
  }
}
