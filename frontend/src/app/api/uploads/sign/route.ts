import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = "nodejs";

/**
 * POST /api/uploads/sign - Generate signed URL for direct upload to Supabase Storage
 *
 * This endpoint returns a signed URL that allows the client to upload files
 * directly to Supabase Storage, bypassing the backend and avoiding Railway's
 * request size limits.
 *
 * Body:
 * - fileName: string (required) - Original file name
 * - fileType: string (required) - MIME type
 * - fileSize: number (required) - File size in bytes
 * - userId: string (required) - User ID for path organization
 *
 * Returns:
 * - signedUrl: string - URL for direct PUT upload
 * - path: string - Storage path (needed for later reference)
 * - fileId: string - Unique file ID
 */
export async function POST(request: NextRequest) {
  try {
    const { fileName, fileType, fileSize, userId } = await request.json();

    // Validate required fields
    if (!fileName || !fileType || !fileSize || !userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: fileName, fileType, fileSize, userId',
        },
        { status: 400 }
      );
    }

    // Check file size limit
    // Note: Supabase Storage free tier typically limits to 50MB per file
    // Paid tiers can be configured up to 5GB, but default is often 50MB
    // We'll allow up to 50MB to match common Supabase limits
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB (matches Supabase Storage default limit)
    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `File too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB. This limit is set by Supabase Storage. For larger files, please compress the file or upgrade your Supabase plan.`,
        },
        { status: 400 }
      );
    }

    // Initialize Supabase client with service role key
    const supabaseUrl = process.env.SUPABASE_URL;
    // Support both old and new env var names for the service key
    const supabaseServiceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl) {
      console.error('[Sign] SUPABASE_URL not configured');
      return NextResponse.json(
        {
          success: false,
          error: 'Storage not configured: SUPABASE_URL is missing',
        },
        { status: 503 }
      );
    }

    if (!supabaseServiceKey) {
      console.error('[Sign] Supabase service key not configured (neither SUPABASE_SERVICE_ROLE_KEY nor SUPABASE_SECRET_KEY is set)');
      return NextResponse.json(
        {
          success: false,
          error: 'Storage not configured: SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY is required',
        },
        { status: 503 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
      },
    });

    // Generate unique file ID and path
    const fileId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${userId}/${fileId}-${sanitizedFileName}`;

    // Generate signed URL for upload (valid for 5 minutes)
    const { data, error } = await supabase.storage
      .from('user-uploads')
      .createSignedUploadUrl(filePath);

    if (error) {
      console.error('[Sign] Error creating signed URL:', error);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to create upload URL: ${error.message}`,
        },
        { status: 500 }
      );
    }

    console.log('[Sign] Created signed URL for:', filePath);

    return NextResponse.json({
      success: true,
      data: {
        signedUrl: data.signedUrl,
        path: filePath,
        fileId,
        token: data.token, // Upload token
        expiresIn: 300, // 5 minutes
      },
    });
  } catch (error) {
    console.error('[Sign] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to generate upload URL: ${(error as Error).message}`,
      },
      { status: 500 }
    );
  }
}
