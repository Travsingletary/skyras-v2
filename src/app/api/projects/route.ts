import { NextRequest, NextResponse } from 'next/server';
import { projectsDb } from '@/lib/database';
import type { ProjectInsert } from '@/types/database';

// GET /api/projects - List all projects for a user
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json(
      {
        success: false,
        error: 'userId parameter is required',
      },
      { status: 400 }
    );
  }

  try {
    const projects = await projectsDb.getByUserId(userId);

    return NextResponse.json({
      success: true,
      data: {
        projects,
        count: projects.length,
      },
    });
  } catch (error) {
    console.error('[/api/projects GET] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to retrieve projects: ${(error as Error).message}`,
      },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, type, description, metadata } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'userId is required',
        },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: 'name is required',
        },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json(
        {
          success: false,
          error: 'type is required (album, single, campaign, client_work)',
        },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ['album', 'single', 'campaign', 'client_work'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid type. Must be one of: ${validTypes.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Create project
    const projectData: ProjectInsert = {
      user_id: userId,
      name,
      type,
      status: 'active',
      description: description || undefined,
      metadata: metadata || {},
    };

    const project = await projectsDb.create(projectData);

    return NextResponse.json({
      success: true,
      data: {
        project,
      },
    });
  } catch (error) {
    console.error('[/api/projects POST] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to create project: ${(error as Error).message}`,
      },
      { status: 500 }
    );
  }
}
