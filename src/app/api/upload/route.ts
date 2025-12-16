import { NextRequest, NextResponse } from 'next/server';
import {
  validateFileType,
  validateFileSize,
  validateTotalSize,
  validateFileCount,
  FILE_LIMITS,
  generateFileId,
} from '@/lib/fileStorage.supabase';
import { filesDb } from '@/lib/database';
import { createAutoProcessingRecords, generateWorkflowSuggestions } from '@/lib/fileProcessing';
import { StorageFactory } from '@/lib/storage/StorageFactory';
import type { StorageProvider } from '@/lib/storage/StorageAdapter';
import { requirePermission } from '@/lib/rbac';
import crypto from 'node:crypto';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const userId = formData.get('userId') as string | null;
    const projectId = formData.get('projectId') as string | null;

    // Validate userId
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'userId is required',
        },
        { status: 400 }
      );
    }

    // RBAC (Week 1): optionally enforce permission checks server-side
    try {
      await requirePermission(userId, 'files.upload');
    } catch (e) {
      return NextResponse.json(
        {
          success: false,
          error: (e as Error).message,
        },
        { status: 403 }
      );
    }

    // Validate file count
    if (!validateFileCount(files.length)) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many files. Maximum ${FILE_LIMITS.MAX_FILE_COUNT} files allowed per upload.`,
        },
        { status: 400 }
      );
    }

    // Validate each file
    const fileValidationErrors: string[] = [];
    const fileSizes: number[] = [];

    for (const file of files) {
      // Check file type
      if (!validateFileType(file.name)) {
        fileValidationErrors.push(
          `File "${file.name}" has an invalid type. Allowed types: ${FILE_LIMITS.ALLOWED_EXTENSIONS.join(', ')}`
        );
        continue;
      }

      // Check file size
      if (!validateFileSize(file.size)) {
        const maxSizeMB = FILE_LIMITS.MAX_FILE_SIZE / (1024 * 1024);
        fileValidationErrors.push(
          `File "${file.name}" is too large. Maximum ${maxSizeMB}MB per file.`
        );
        continue;
      }

      fileSizes.push(file.size);
    }

    // Check total upload size
    if (!validateTotalSize(fileSizes)) {
      const maxTotalMB = FILE_LIMITS.MAX_TOTAL_SIZE / (1024 * 1024);
      return NextResponse.json(
        {
          success: false,
          error: `Total upload size exceeds ${maxTotalMB}MB limit.`,
        },
        { status: 400 }
      );
    }

    // If there are validation errors, return them
    if (fileValidationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Some files failed validation',
          details: fileValidationErrors,
        },
        { status: 400 }
      );
    }

    // Get configured storage adapter
    const provider = (process.env.DEFAULT_STORAGE_PROVIDER as StorageProvider) || 'supabase';
    const adapter = StorageFactory.getAdapter(provider);

    // Check if storage is configured
    const isConfigured = await adapter.isConfigured();
    if (!isConfigured) {
      return NextResponse.json(
        {
          success: false,
          error: 'File storage is not configured. Please contact administrator.',
          details: [`Storage provider '${provider}' is not available`],
        },
        { status: 503 }
      );
    }

    // Save all files
    const uploadedFiles: Array<{
      id: string;
      fileId: string;
      name: string;
      size: number;
      type: string;
      path: string;
      url: string;
      processingCount?: number;
    }> = [];

    for (const file of files) {
      try {
        // Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Generate unique file ID and storage path
        const fileId = generateFileId();
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const fileExtension = file.name.substring(file.name.lastIndexOf('.'));
        const storagePath = `${today}/${userId}/${fileId}${fileExtension}`;

        // Upload file via storage adapter
        const uploadResult = await adapter.upload({
          buffer,
          path: storagePath,
          contentType: file.type || 'application/octet-stream',
          isPublic: false, // Default to private for security
        });

        // Get expiration time from environment (default 1 hour)
        const expiresIn = parseInt(process.env.SIGNED_URL_DEFAULT_EXPIRY || '3600', 10);

        // Generate signed URL for immediate access
        const signedUrl = await adapter.getSignedUrl(storagePath, expiresIn);
        const expiresAt = new Date(Date.now() + expiresIn * 1000);

        // Save file metadata to database
        const fileRecord = await filesDb.create({
          user_id: userId,
          project_id: projectId || undefined,
          original_name: file.name,
          storage_path: storagePath,
          public_url: signedUrl,
          file_type: file.type || 'application/octet-stream',
          file_size: file.size,
          file_extension: fileExtension,
          processing_status: 'pending',
          processing_results: {},
          metadata: {},
          storage_provider: provider,
          is_public: false,
          signed_url_expires_at: expiresAt.toISOString(),
        });

        // Auto-create processing records based on file type
        const { created: processingCount, records: processingRecords } = await createAutoProcessingRecords(
          fileRecord.id,
          file.type || 'application/octet-stream',
          fileExtension
        );

        uploadedFiles.push({
          id: fileRecord.id,
          fileId: fileId,
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          path: storagePath,
          url: signedUrl,
          processingCount,
        });
      } catch (error) {
        console.error(`Error saving file ${file.name}:`, error);
        fileValidationErrors.push(
          `Failed to save file "${file.name}": ${(error as Error).message}`
        );
      }
    }

    // If all files failed to upload
    if (uploadedFiles.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'All files failed to upload',
          details: fileValidationErrors,
        },
        { status: 500 }
      );
    }

    // Generate workflow suggestions based on uploaded files
    const workflowSuggestions = generateWorkflowSuggestions(
      uploadedFiles.map(f => ({ fileType: f.type, fileName: f.name }))
    );

    // Return success with file IDs, URLs, and workflow suggestions
    return NextResponse.json({
      success: true,
      data: {
        fileIds: uploadedFiles.map(f => f.fileId),
        files: uploadedFiles.map(f => ({
          id: f.id, // Database record ID
          fileId: f.fileId, // Storage file ID
          name: f.name,
          size: f.size,
          type: f.type,
          url: f.url, // Public URL for accessing the file
          path: f.path, // Storage path
          processingCount: f.processingCount, // Number of auto-processing jobs
        })),
        uploadedCount: uploadedFiles.length,
        totalCount: files.length,
        workflowSuggestions, // Suggested workflows based on file types
        ...(fileValidationErrors.length > 0 && {
          partialSuccess: true,
          warnings: fileValidationErrors,
        }),
      },
    });
  } catch (error) {
    console.error('[/api/upload] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Upload failed: ${(error as Error).message}`,
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve file info from database
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get('fileId');

  if (!fileId) {
    return NextResponse.json(
      {
        success: false,
        error: 'fileId parameter is required',
      },
      { status: 400 }
    );
  }

  try {
    // Get file metadata from database
    const fileRecord = await filesDb.getById(fileId);

    if (!fileRecord) {
      return NextResponse.json(
        {
          success: false,
          error: 'File not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: fileRecord.id,
        name: fileRecord.original_name,
        url: fileRecord.public_url,
        path: fileRecord.storage_path,
        size: fileRecord.file_size,
        type: fileRecord.file_type,
        extension: fileRecord.file_extension,
        projectId: fileRecord.project_id,
        status: fileRecord.processing_status,
        results: fileRecord.processing_results,
        created: fileRecord.created_at,
        updated: fileRecord.updated_at,
      },
    });
  } catch (error) {
    console.error('[/api/upload GET] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to retrieve file info: ${(error as Error).message}`,
      },
      { status: 500 }
    );
  }
}
