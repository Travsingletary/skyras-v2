// Gate status checking utility for workflow gates
import { styleCardsDb, referenceLibraryDb, storyboardFramesDb } from './database';

export type GateStatus = 'ready' | 'blocked' | 'in_progress';
export type StatusBadge = 'Blocked' | 'In Progress' | 'Ready';

export interface StoryboardFrameCounts {
  approved: number;
  needsRevision: number;
  total: number;
}

export interface ProjectGateStatus {
  status: GateStatus;
  statusBadge: StatusBadge;
  blockedReason: string | null;
  nextAction: string | null;
  hasApprovedStyleCard: boolean;
  approvedReferenceCount: number;
  storyboardFrameCounts: StoryboardFrameCounts;
  allStoryboardFramesApproved: boolean;
}

/**
 * Compute the project status for a given project ID
 * Returns comprehensive status information including what's blocking the project and what to do next
 * Never throws - returns safe defaults if data is missing
 */
export async function computeProjectStatus(projectId: string): Promise<ProjectGateStatus> {
  try {
    // Check Style Card gate with safe defaults
    let hasApprovedStyleCard = false;
    try {
      const approvedStyleCard = await styleCardsDb.getApprovedByProjectId(projectId);
      hasApprovedStyleCard = !!approvedStyleCard;
    } catch (err) {
      console.warn('Failed to check style card status:', err);
      // Continue with default false
    }

    // Check Reference Library gate with safe defaults
    let approvedReferenceCount = 0;
    try {
      const approvedReferences = await referenceLibraryDb.getApprovedByProjectId(projectId);
      approvedReferenceCount = approvedReferences?.length || 0;
    } catch (err) {
      console.warn('Failed to check reference status:', err);
      // Continue with default 0
    }

    // Check Storyboard gate with safe defaults
    let storyboardFrameCounts: StoryboardFrameCounts = {
      approved: 0,
      needsRevision: 0,
      total: 0,
    };
    let allStoryboardFramesApproved = false;

    try {
      const storyboardFrames = await storyboardFramesDb.getByProjectId(projectId);
      const totalFrames = storyboardFrames?.length || 0;
      const approvedFrames = storyboardFrames?.filter(f => f.approval_status === 'approved').length || 0;
      const needsRevisionFrames = storyboardFrames?.filter(f => f.approval_status === 'needs_revision').length || 0;

      storyboardFrameCounts = {
        approved: approvedFrames,
        needsRevision: needsRevisionFrames,
        total: totalFrames,
      };

      allStoryboardFramesApproved = totalFrames > 0 && approvedFrames === totalFrames;
    } catch (err) {
      console.warn('Failed to check storyboard frame status:', err);
      // Continue with defaults
    }

    // Determine overall status and next action
    // Never default to Ready - require explicit verification of all gates
    let status: GateStatus = 'in_progress';
    let statusBadge: StatusBadge = 'In Progress';
    let blockedReason: string | null = null;
    let nextAction: string | null = null;

    // Priority order of gates (following the creation pipeline)
    if (approvedReferenceCount === 0) {
      status = 'blocked';
      statusBadge = 'Blocked';
      blockedReason = 'No approved references';
      nextAction = 'Add and approve at least one reference image or file';
    } else if (!hasApprovedStyleCard) {
      status = 'blocked';
      statusBadge = 'Blocked';
      blockedReason = 'Style Card not approved';
      nextAction = 'Create and approve a Style Card for your project';
    } else if (storyboardFrameCounts.total === 0) {
      // No frames yet - in progress (not ready, as video generation requires frames)
      status = 'in_progress';
      statusBadge = 'In Progress';
      blockedReason = 'No storyboard frames';
      nextAction = 'Generate storyboard frames for your video';
    } else if (!allStoryboardFramesApproved) {
      // Some frames exist but not all approved - blocked (not ready)
      status = 'blocked';
      statusBadge = 'Blocked';
      blockedReason = `Only ${storyboardFrameCounts.approved} of ${storyboardFrameCounts.total} storyboard frames approved`;
      nextAction = 'Review and approve all storyboard frames before generating video';
    } else {
      // All gates passed - explicitly mark as ready
      // Only reached when: references exist, style card approved, all frames approved
      status = 'ready';
      statusBadge = 'Ready';
      blockedReason = null;
      nextAction = null;
    }

    return {
      status,
      statusBadge,
      blockedReason,
      nextAction,
      hasApprovedStyleCard,
      approvedReferenceCount,
      storyboardFrameCounts,
      allStoryboardFramesApproved,
    };
  } catch (err) {
    // Ultimate fallback - return safe defaults
    console.error('Failed to compute project status:', err);
    return {
      status: 'blocked',
      statusBadge: 'Blocked',
      blockedReason: 'Unable to determine project status',
      nextAction: 'Please refresh the page',
      hasApprovedStyleCard: false,
      approvedReferenceCount: 0,
      storyboardFrameCounts: {
        approved: 0,
        needsRevision: 0,
        total: 0,
      },
      allStoryboardFramesApproved: false,
    };
  }
}

/**
 * Check the gate status for a project
 * Returns status information about what's blocking the project and what to do next
 * @deprecated Use computeProjectStatus instead for better error handling
 */
export async function checkProjectGateStatus(projectId: string): Promise<ProjectGateStatus> {
  return computeProjectStatus(projectId);
}

/**
 * Check if image generation is allowed (requires approved references)
 */
export async function canGenerateImage(projectId: string): Promise<{ allowed: boolean; reason?: string }> {
  const approvedReferences = await referenceLibraryDb.getApprovedByProjectId(projectId);

  if (approvedReferences.length === 0) {
    return {
      allowed: false,
      reason: 'Image generation requires at least one approved reference. Add references first.',
    };
  }

  return { allowed: true };
}

/**
 * Check if storyboard generation is allowed (requires approved Style Card)
 */
export async function canGenerateStoryboard(projectId: string): Promise<{ allowed: boolean; reason?: string }> {
  const approvedStyleCard = await styleCardsDb.getApprovedByProjectId(projectId);

  if (!approvedStyleCard) {
    return {
      allowed: false,
      reason: 'Storyboard generation blocked: Create and approve a Style Card first.',
    };
  }

  return { allowed: true };
}

/**
 * Check if video generation is allowed (requires all storyboard frames approved)
 */
export async function canGenerateVideo(projectId: string): Promise<{ allowed: boolean; reason?: string }> {
  const frames = await storyboardFramesDb.getByProjectId(projectId);

  if (frames.length === 0) {
    return {
      allowed: false,
      reason: 'Video generation blocked: Create storyboard frames first.',
    };
  }

  const allApproved = frames.every(f => f.approval_status === 'approved');
  if (!allApproved) {
    const approvedCount = frames.filter(f => f.approval_status === 'approved').length;
    return {
      allowed: false,
      reason: `Video generation blocked: Only ${approvedCount} of ${frames.length} storyboard frames are approved. Approve all frames first.`,
    };
  }

  return { allowed: true };
}
