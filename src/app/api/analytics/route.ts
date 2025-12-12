import { NextRequest, NextResponse } from 'next/server';
import { projectsDb, filesDb, workflowsDb, fileProcessingDb } from '@/lib/database';

// GET /api/analytics - Get analytics dashboard data
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json(
      {
        success: false,
        error: 'userId is required',
      },
      { status: 400 }
    );
  }

  try {
    // Fetch all data
    const [projects, files, workflows, processing] = await Promise.all([
      projectsDb.getByUserId(userId),
      filesDb.getByUserId(userId),
      workflowsDb.getByUserId(userId),
      fileProcessingDb.getByUserId(userId),
    ]);

    // Projects analytics
    const projectStats = {
      total: projects.length,
      byStatus: {
        active: projects.filter((p) => p.status === 'active').length,
        completed: projects.filter((p) => p.status === 'completed').length,
        archived: projects.filter((p) => p.status === 'archived').length,
      },
      byType: {
        album: projects.filter((p) => p.type === 'album').length,
        single: projects.filter((p) => p.type === 'single').length,
        campaign: projects.filter((p) => p.type === 'campaign').length,
        client_work: projects.filter((p) => p.type === 'client_work').length,
      },
    };

    // Files analytics
    const fileStats = {
      total: files.length,
      totalSize: files.reduce((sum, f) => sum + f.file_size, 0),
      byType: {
        audio: files.filter((f) => f.file_type.startsWith('audio/')).length,
        video: files.filter((f) => f.file_type.startsWith('video/')).length,
        image: files.filter((f) => f.file_type.startsWith('image/')).length,
        document: files.filter(
          (f) =>
            f.file_type.includes('pdf') ||
            f.file_type.includes('document') ||
            f.file_type.includes('text')
        ).length,
        other: files.filter(
          (f) =>
            !f.file_type.startsWith('audio/') &&
            !f.file_type.startsWith('video/') &&
            !f.file_type.startsWith('image/') &&
            !f.file_type.includes('pdf') &&
            !f.file_type.includes('document') &&
            !f.file_type.includes('text')
        ).length,
      },
      byProcessingStatus: {
        pending: files.filter((f) => f.processing_status === 'pending').length,
        processing: files.filter((f) => f.processing_status === 'processing').length,
        completed: files.filter((f) => f.processing_status === 'completed').length,
        failed: files.filter((f) => f.processing_status === 'failed').length,
      },
    };

    // Workflows analytics
    const workflowStats = {
      total: workflows.length,
      byStatus: {
        active: workflows.filter((w) => w.status === 'active').length,
        completed: workflows.filter((w) => w.status === 'completed').length,
        cancelled: workflows.filter((w) => w.status === 'cancelled').length,
      },
      byType: {
        licensing: workflows.filter((w) => w.type === 'licensing').length,
        creative: workflows.filter((w) => w.type === 'creative').length,
        distribution: workflows.filter((w) => w.type === 'distribution').length,
        cataloging: workflows.filter((w) => w.type === 'cataloging').length,
        custom: workflows.filter((w) => w.type === 'custom').length,
      },
      totalTasks: workflows.reduce((sum, w) => sum + w.total_tasks, 0),
      completedTasks: workflows.reduce((sum, w) => sum + w.completed_tasks, 0),
      completionRate:
        workflows.reduce((sum, w) => sum + w.total_tasks, 0) > 0
          ? Math.round(
              (workflows.reduce((sum, w) => sum + w.completed_tasks, 0) /
                workflows.reduce((sum, w) => sum + w.total_tasks, 0)) *
                100
            )
          : 0,
    };

    // File processing analytics
    const processingStats = {
      total: processing.length,
      byStatus: {
        pending: processing.filter((p) => p.status === 'pending').length,
        processing: processing.filter((p) => p.status === 'processing').length,
        completed: processing.filter((p) => p.status === 'completed').length,
        failed: processing.filter((p) => p.status === 'failed').length,
      },
      byAgent: {
        cassidy: processing.filter((p) => p.agent_name === 'cassidy').length,
        letitia: processing.filter((p) => p.agent_name === 'letitia').length,
        giorgio: processing.filter((p) => p.agent_name === 'giorgio').length,
        jamal: processing.filter((p) => p.agent_name === 'jamal').length,
      },
      byType: {
        licensing: processing.filter((p) => p.processing_type === 'licensing').length,
        cataloging: processing.filter((p) => p.processing_type === 'cataloging').length,
        script_gen: processing.filter((p) => p.processing_type === 'script_gen').length,
        distribution: processing.filter((p) => p.processing_type === 'distribution').length,
      },
    };

    // Recent activity (last 10 items)
    const recentProjects = projects
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map((p) => ({
        id: p.id,
        name: p.name,
        type: p.type,
        status: p.status,
        createdAt: p.created_at,
      }));

    const recentFiles = files
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map((f) => ({
        id: f.id,
        name: f.original_name,
        type: f.file_type,
        size: f.file_size,
        status: f.processing_status,
        createdAt: f.created_at,
      }));

    const recentWorkflows = workflows
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map((w) => ({
        id: w.id,
        name: w.name,
        type: w.type,
        status: w.status,
        progress: w.total_tasks > 0 ? Math.round((w.completed_tasks / w.total_tasks) * 100) : 0,
        createdAt: w.created_at,
      }));

    return NextResponse.json({
      success: true,
      data: {
        projects: projectStats,
        files: fileStats,
        workflows: workflowStats,
        processing: processingStats,
        recent: {
          projects: recentProjects,
          files: recentFiles,
          workflows: recentWorkflows,
        },
      },
    });
  } catch (error) {
    console.error('[/api/analytics GET] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to retrieve analytics: ${(error as Error).message}`,
      },
      { status: 500 }
    );
  }
}
