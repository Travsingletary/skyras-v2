import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

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
  const ext = path.extname(filename).toLowerCase();
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
 * Get the upload directory path for today
 * Format: /uploads/YYYY-MM-DD/
 */
export function getUploadDir(): string {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return path.join(process.cwd(), 'uploads', today);
}

/**
 * Ensure the upload directory exists, create if it doesn't
 */
export async function ensureUploadDir(): Promise<string> {
  const uploadDir = getUploadDir();

  try {
    await fs.access(uploadDir);
  } catch {
    // Directory doesn't exist, create it
    await fs.mkdir(uploadDir, { recursive: true });
  }

  return uploadDir;
}

/**
 * Save a file to the uploads directory
 * @param buffer - File buffer
 * @param originalName - Original filename
 * @param fileId - Unique file ID (optional, will be generated if not provided)
 * @returns Object with fileId, path, and originalName
 */
export async function saveFile(
  buffer: Buffer,
  originalName: string,
  fileId?: string
): Promise<{ fileId: string; path: string; originalName: string }> {
  const id = fileId || generateFileId();
  const uploadDir = await ensureUploadDir();

  // Sanitize filename to prevent path traversal attacks
  const sanitizedName = path.basename(originalName);
  const ext = path.extname(sanitizedName);
  const filename = `${id}${ext}`;
  const filePath = path.join(uploadDir, filename);

  // Write file to disk
  await fs.writeFile(filePath, buffer);

  return {
    fileId: id,
    path: filePath,
    originalName: sanitizedName,
  };
}

/**
 * Get the full file path for a given file ID
 * Note: This searches all date directories, which may be slow with many files
 */
export async function getFilePath(fileId: string): Promise<string | null> {
  const uploadsRoot = path.join(process.cwd(), 'uploads');

  try {
    const dateDirs = await fs.readdir(uploadsRoot);

    for (const dateDir of dateDirs) {
      const dirPath = path.join(uploadsRoot, dateDir);
      const stat = await fs.stat(dirPath);

      if (!stat.isDirectory()) continue;

      const files = await fs.readdir(dirPath);
      const matchingFile = files.find(f => f.startsWith(fileId));

      if (matchingFile) {
        return path.join(dirPath, matchingFile);
      }
    }
  } catch (error) {
    console.error('Error searching for file:', error);
  }

  return null;
}

/**
 * Delete a file by its file ID
 */
export async function deleteFile(fileId: string): Promise<boolean> {
  const filePath = await getFilePath(fileId);

  if (!filePath) {
    return false;
  }

  try {
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

/**
 * Get file metadata (size, type, etc.)
 */
export async function getFileMetadata(fileId: string): Promise<{
  fileId: string;
  path: string;
  size: number;
  created: Date;
} | null> {
  const filePath = await getFilePath(fileId);

  if (!filePath) {
    return null;
  }

  try {
    const stats = await fs.stat(filePath);
    return {
      fileId,
      path: filePath,
      size: stats.size,
      created: stats.birthtime,
    };
  } catch (error) {
    console.error('Error getting file metadata:', error);
    return null;
  }
}

export const FILE_LIMITS = {
  MAX_FILE_SIZE,
  MAX_TOTAL_SIZE,
  MAX_FILE_COUNT,
  ALLOWED_EXTENSIONS: Array.from(ALLOWED_EXTENSIONS),
};
