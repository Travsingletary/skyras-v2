import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { filesDb } from '@/lib/database';
import { createAutoProcessingRecords, generateWorkflowSuggestions } from '@/lib/fileProcessing';

export const runtime = "nodejs";

/**
 * POST /api/uploads/confirm - Confirm upload and save metadata
 *
 * After client uploads file directly to Supabase Storage using signed URL,
 * this endpoint saves the file metadata to the database.
 *
 * Body:
 * - path: string (required) - Storage path from /api/uploads/sign
 * - fileId: string (required) - File ID from /api/uploads/sign
 * - fileName: string (required) - Original file name
 * - fileType: string (required) - MIME type
 * - fileSize: number (required) - File size in bytes
 * - userId: string (required) - User ID
 * - projectId: string (optional) - Project ID
 */
export async function POST(request: NextRequest) {
  try {
    const { path, fileId, fileName, fileType, fileSize, userId, projectId } = await request.json();

    // Validate required fields
    if (!path || !fileId || !fileName || !fileType || !fileSize || !userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    // Support both old and new env var names for the service key
    const supabaseServiceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl) {
      console.error('[Confirm] SUPABASE_URL not configured');
      return NextResponse.json(
        {
          success: false,
          error: 'Storage not configured: SUPABASE_URL is missing',
        },
        { status: 503 }
      );
    }

    if (!supabaseServiceKey) {
      console.error('[Confirm] Supabase service key not configured (neither SUPABASE_SERVICE_ROLE_KEY nor SUPABASE_SECRET_KEY is set)');
      return NextResponse.json(
        {
          success: false,
          error: 'Storage not configured: SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY is required',
        },
        { status: 503 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get public URL for the file
    const { data: { publicUrl } } = supabase.storage
      .from('user-uploads')
      .getPublicUrl(path);

    // Get file extension
    const fileExtension = fileName.substring(fileName.lastIndexOf('.'));

    // Validate projectId is a valid UUID (if provided)
    // project_id must be a UUID, not a conversation ID or other string
    let validProjectId: string | undefined = undefined;
    if (projectId) {
      // Check if it's a valid UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(projectId)) {
        validProjectId = projectId;
      } else {
        console.warn(`[Confirm] Invalid projectId format (not a UUID): ${projectId}. Ignoring.`);
      }
    }

    // Save file metadata to database
    const fileRecord = await filesDb.create({
      user_id: userId,
      project_id: validProjectId,
      original_name: fileName,
      storage_path: path,
      public_url: publicUrl,
      file_type: fileType,
      file_size: fileSize,
      file_extension: fileExtension,
      processing_status: 'pending',
      processing_results: {},
      metadata: {
        uploadedVia: 'direct',
        uploadedAt: new Date().toISOString(),
      },
    });

    // Auto-create processing records based on file type
    const { created: processingCount } = await createAutoProcessingRecords(
      fileRecord.id,
      fileType,
      fileExtension
    );

    console.log('[Confirm] File confirmed:', {
      id: fileRecord.id,
      path,
      processingCount,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: fileRecord.id,
        fileId,
        name: fileName,
        url: publicUrl,
        path,
        size: fileSize,
        type: fileType,
        processingCount,
      },
    });
  } catch (error) {
    console.error('[Confirm] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to confirm upload: ${(error as Error).message}`,
      },
      { status: 500 }
    );
  }
}
