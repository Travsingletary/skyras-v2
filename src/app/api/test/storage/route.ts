import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseStorageClient } from '@/backend/supabaseClient';

/**
 * Test endpoint to verify Supabase storage configuration
 * GET /api/test/storage
 */
export async function GET(request: NextRequest) {
  try {
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    const hasAnonKey = !!process.env.SUPABASE_ANON_KEY;
    const hasUrl = !!process.env.SUPABASE_URL;
    
    const supabase = getSupabaseStorageClient();
    
    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: 'Supabase client not initialized',
        config: {
          hasUrl,
          hasServiceKey,
          hasAnonKey,
        },
      }, { status: 500 });
    }
    
    // Try to list buckets (requires service role or proper permissions)
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    // Try to list files in user-uploads bucket
    let filesError = null;
    let filesData = null;
    try {
      const { data, error } = await supabase.storage
        .from('user-uploads')
        .list('', { limit: 1 });
      filesData = data;
      filesError = error;
    } catch (e) {
      filesError = e;
    }
    
    return NextResponse.json({
      success: true,
      config: {
        hasUrl,
        hasServiceKey,
        hasAnonKey,
        usingServiceKey: hasServiceKey,
      },
      buckets: {
        success: !bucketsError,
        error: bucketsError?.message,
        count: buckets?.length || 0,
        bucketNames: buckets?.map(b => b.name) || [],
      },
      testUpload: {
        success: !filesError,
        error: filesError?.message || (filesError as any)?.statusCode,
        canList: !!filesData,
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

