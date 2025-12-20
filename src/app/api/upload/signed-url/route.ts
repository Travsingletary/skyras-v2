import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient, getSupabaseStorageClient } from "@/backend/supabaseClient";
import {
  FILE_LIMITS,
  generateFileId,
  validateFileCount,
  validateFileSize,
  validateFileType,
  validateTotalSize,
} from "@/lib/fileStorage.supabase";
import { requirePermission } from "@/lib/rbac";

type SignedUploadRequest = {
  userId: string;
  projectId?: string | null;
  files: Array<{
    clientId: string;
    name: string;
    size: number;
    type?: string | null;
  }>;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SignedUploadRequest;
    const userId = body.userId;
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

    const errors: string[] = [];
    const sizes: number[] = [];

    for (const f of files) {
      if (!f.clientId) {
        errors.push("Each file must include clientId");
        continue;
      }
      if (!f.name) {
        errors.push(`File "${f.clientId}" is missing name`);
        continue;
      }
      if (!validateFileType(f.name)) {
        errors.push(
          `File "${f.name}" has an invalid type. Allowed types: ${FILE_LIMITS.ALLOWED_EXTENSIONS.join(", ")}`
        );
        continue;
      }
      if (!validateFileSize(f.size)) {
        const maxSizeMB = FILE_LIMITS.MAX_FILE_SIZE / (1024 * 1024);
        errors.push(`File "${f.name}" is too large. Maximum ${maxSizeMB}MB per file.`);
        continue;
      }
      sizes.push(f.size);
    }

    if (!validateTotalSize(sizes)) {
      const maxTotalMB = FILE_LIMITS.MAX_TOTAL_SIZE / (1024 * 1024);
      return NextResponse.json(
        { success: false, error: `Total upload size exceeds ${maxTotalMB}MB limit.` },
        { status: 400 }
      );
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: "Some files failed validation", details: errors },
        { status: 400 }
      );
    }

    // Ensure the Supabase client is initialized (also sets the storage client singleton).
    getSupabaseClient();
    const storageClient = getSupabaseStorageClient();
    if (!storageClient) {
      return NextResponse.json(
        {
          success: false,
          error: "Supabase storage client not initialized. Check SUPABASE_URL and SUPABASE_*KEY environment variables.",
        },
        { status: 503 }
      );
    }

    const bucket = FILE_LIMITS.STORAGE_BUCKET;
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    const uploads = [];

    for (const f of files) {
      const fileId = generateFileId();
      const fileExtension = f.name.substring(f.name.lastIndexOf("."));
      const storagePath = `${today}/${userId}/${fileId}${fileExtension}`;

      // Supabase signed upload URLs return a token that can be used by the browser to upload
      // without sending the file through this serverless function.
      const { data, error } = await (storageClient.storage as any)
        .from(bucket)
        .createSignedUploadUrl(storagePath);

      if (error || !data?.token) {
        const msg = error?.message || "Failed to create signed upload URL";
        throw new Error(msg);
      }

      uploads.push({
        clientId: f.clientId,
        fileId,
        path: storagePath,
        bucket,
        token: data.token,
        signedUrl: data.signedUrl ?? null,
        name: f.name,
        size: f.size,
        type: f.type ?? null,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        bucket,
        uploads,
        totalCount: files.length,
        createdCount: uploads.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: `Upload init failed: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}

