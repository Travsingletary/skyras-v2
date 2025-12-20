import { NextRequest, NextResponse } from "next/server";
import { filesDb } from "@/lib/database";
import {
  FILE_LIMITS,
  validateFileCount,
  validateFileSize,
  validateFileType,
  validateTotalSize,
} from "@/lib/fileStorage.supabase";
import { createAutoProcessingRecords, generateWorkflowSuggestions } from "@/lib/fileProcessing";
import { StorageFactory } from "@/lib/storage/StorageFactory";
import type { StorageProvider } from "@/lib/storage/StorageAdapter";
import { requirePermission } from "@/lib/rbac";

type CompleteUploadRequest = {
  userId: string;
  projectId?: string | null;
  files: Array<{
    fileId: string;
    path: string;
    name: string;
    size: number;
    type?: string | null;
  }>;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CompleteUploadRequest;
    const userId = body.userId;
    const projectId = body.projectId ?? null;
    const files = body.files ?? [];

    if (!userId) {
      return NextResponse.json({ success: false, error: "userId is required" }, { status: 400 });
    }

    try {
      await requirePermission(userId, "files.upload");
    } catch (e) {
      return NextResponse.json(
        { success: false, error: (e as Error).message },
        { status: 403 }
      );
    }

    if (!validateFileCount(files.length)) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many files. Maximum ${FILE_LIMITS.MAX_FILE_COUNT} files allowed per upload.`,
        },
        { status: 400 }
      );
    }

    const fileValidationErrors: string[] = [];
    const fileSizes: number[] = [];

    for (const f of files) {
      if (!f.name || !f.path || !f.fileId) {
        fileValidationErrors.push(`Missing required fields for a file (name/path/fileId)`);
        continue;
      }
      if (!validateFileType(f.name)) {
        fileValidationErrors.push(
          `File "${f.name}" has an invalid type. Allowed types: ${FILE_LIMITS.ALLOWED_EXTENSIONS.join(", ")}`
        );
        continue;
      }
      if (!validateFileSize(f.size)) {
        const maxSizeMB = FILE_LIMITS.MAX_FILE_SIZE / (1024 * 1024);
        fileValidationErrors.push(`File "${f.name}" is too large. Maximum ${maxSizeMB}MB per file.`);
        continue;
      }
      fileSizes.push(f.size);
    }

    if (!validateTotalSize(fileSizes)) {
      const maxTotalMB = FILE_LIMITS.MAX_TOTAL_SIZE / (1024 * 1024);
      return NextResponse.json(
        { success: false, error: `Total upload size exceeds ${maxTotalMB}MB limit.` },
        { status: 400 }
      );
    }

    if (fileValidationErrors.length > 0) {
      return NextResponse.json(
        { success: false, error: "Some files failed validation", details: fileValidationErrors },
        { status: 400 }
      );
    }

    const provider = (process.env.DEFAULT_STORAGE_PROVIDER as StorageProvider) || "supabase";
    const adapter = StorageFactory.getAdapter(provider);

    const isConfigured = await adapter.isConfigured();
    if (!isConfigured) {
      return NextResponse.json(
        {
          success: false,
          error: "File storage is not configured. Please contact administrator.",
          details: [`Storage provider '${provider}' is not available`],
        },
        { status: 503 }
      );
    }

    const expiresIn = parseInt(process.env.SIGNED_URL_DEFAULT_EXPIRY || "3600", 10);
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

    for (const f of files) {
      try {
        const fileExtension = f.name.substring(f.name.lastIndexOf("."));
        const signedUrl = await adapter.getSignedUrl(f.path, expiresIn);
        const expiresAt = new Date(Date.now() + expiresIn * 1000);

        const fileRecord = await filesDb.create({
          user_id: userId,
          project_id: projectId || undefined,
          original_name: f.name,
          storage_path: f.path,
          public_url: signedUrl,
          file_type: f.type || "application/octet-stream",
          file_size: f.size,
          file_extension: fileExtension,
          processing_status: "pending",
          processing_results: {},
          metadata: {},
          storage_provider: provider,
          is_public: false,
          signed_url_expires_at: expiresAt.toISOString(),
        });

        const { created: processingCount } = await createAutoProcessingRecords(
          fileRecord.id,
          f.type || "application/octet-stream",
          fileExtension
        );

        uploadedFiles.push({
          id: fileRecord.id,
          fileId: f.fileId,
          name: f.name,
          size: f.size,
          type: f.type || "application/octet-stream",
          path: f.path,
          url: signedUrl,
          processingCount,
        });
      } catch (e) {
        fileValidationErrors.push(`Failed to finalize file "${f.name}": ${(e as Error).message}`);
      }
    }

    if (uploadedFiles.length === 0) {
      return NextResponse.json(
        { success: false, error: "All files failed to finalize", details: fileValidationErrors },
        { status: 500 }
      );
    }

    const workflowSuggestions = generateWorkflowSuggestions(
      uploadedFiles.map((f) => ({ fileType: f.type, fileName: f.name }))
    );

    return NextResponse.json({
      success: true,
      data: {
        fileIds: uploadedFiles.map((f) => f.fileId),
        files: uploadedFiles.map((f) => ({
          id: f.id,
          fileId: f.fileId,
          name: f.name,
          size: f.size,
          type: f.type,
          url: f.url,
          path: f.path,
          processingCount: f.processingCount,
        })),
        uploadedCount: uploadedFiles.length,
        totalCount: files.length,
        workflowSuggestions,
        ...(fileValidationErrors.length > 0 && {
          partialSuccess: true,
          warnings: fileValidationErrors,
        }),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: `Upload finalize failed: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}

