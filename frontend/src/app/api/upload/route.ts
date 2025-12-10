import { NextRequest, NextResponse } from 'next/server';
import {
  saveFile,
  validateFileType,
  validateFileSize,
  validateTotalSize,
  validateFileCount,
  FILE_LIMITS,
  isStorageConfigured,
} from '@/lib/fileStorage.supabase';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const userId = formData.get('userId') as string | null;

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

    // Save all files
    const uploadedFiles: Array<{
      fileId: string;
      name: string;
      size: number;
      type: string;
      path: string;
    }> = [];

    for (const file of files) {
      try {
        // Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Save file to Supabase Storage
        const savedFile = await saveFile(buffer, file.name, userId);

        uploadedFiles.push({
          fileId: savedFile.fileId,
          name: savedFile.originalName,
          size: file.size,
          type: file.type || 'application/octet-stream',
          path: savedFile.path,
          url: savedFile.url, // Public URL from Supabase
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

    // Return success with file IDs and URLs
    return NextResponse.json({
      success: true,
      data: {
        fileIds: uploadedFiles.map(f => f.fileId),
        files: uploadedFiles.map(f => ({
          fileId: f.fileId,
          name: f.name,
          size: f.size,
          type: f.type,
          url: f.url, // Public URL for accessing the file
          path: f.path, // Storage path
        })),
        uploadedCount: uploadedFiles.length,
        totalCount: files.length,
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

// Optional: GET endpoint to retrieve file info
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
    const { getFileMetadata } = await import('@/lib/fileStorage.supabase');

    // fileId is actually the storage path in Supabase
    const metadata = await getFileMetadata(fileId);

    if (!metadata) {
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
        path: metadata.path,
        size: metadata.size,
        created: metadata.created.toISOString(),
        contentType: metadata.contentType,
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
