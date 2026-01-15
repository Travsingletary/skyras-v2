/**
 * Campaign Pack utility for generating and managing social media campaign drafts
 * Writes to project_bible.release_plan.campaignPack (safe merge, preserves unknown keys)
 */

export interface PlatformCaption {
  platform: string;
  caption: string;
  characterCount?: number;
  maxCharacters?: number;
}

export interface CampaignPackDraft {
  captions: PlatformCaption[];
  hashtags: string[];
  checklist: ChecklistItem[];
  generatedAt: string;
  generatedBy: string;
}

export interface ChecklistItem {
  id: string;
  task: string;
  completed: boolean;
  platform?: string;
}

export interface ReleasePlanDraft {
  assets?: Array<{
    id: string;
    type: string;
    name: string;
    status?: string;
  }>;
  channels?: Array<{
    id: string;
    platform: string;
    status?: string;
  }>;
}

export interface BriefContent {
  goals?: string;
  target_audience?: string;
  key_messages?: string;
  tone?: string;
  visual_style?: string;
  constraints?: string;
  success_metrics?: string;
}

/**
 * Generate campaign pack draft from brief and release plan
 */
export function generateCampaignPackDraft(
  brief: BriefContent | null,
  releasePlan: ReleasePlanDraft | null,
  userId: string
): CampaignPackDraft {
  // Extract key information
  const goals = brief?.goals || '';
  const targetAudience = brief?.target_audience || '';
  const keyMessages = brief?.key_messages || '';
  const tone = brief?.tone || 'professional';
  
  // Get platforms from release plan channels
  const platforms = releasePlan?.channels?.map(ch => ch.platform) || [
    'Instagram',
    'Twitter/X',
    'TikTok',
    'YouTube',
  ];

  // Generate captions per platform
  const captions: PlatformCaption[] = platforms.map((platform) => {
    const platformTone = getPlatformTone(platform, tone);
    const caption = generateCaption(platform, goals, targetAudience, keyMessages, platformTone);
    return {
      platform,
      caption,
      characterCount: caption.length,
      maxCharacters: getPlatformMaxChars(platform),
    };
  });

  // Generate hashtags
  const hashtags = generateHashtags(goals, targetAudience, keyMessages);

  // Generate checklist
  const checklist = generateChecklist(platforms, releasePlan?.assets || []);

  return {
    captions,
    hashtags,
    checklist,
    generatedAt: new Date().toISOString(),
    generatedBy: userId,
  };
}

/**
 * Generate platform-specific caption
 */
function generateCaption(
  platform: string,
  goals: string,
  targetAudience: string,
  keyMessages: string,
  tone: string
): string {
  const parts: string[] = [];

  if (keyMessages) {
    parts.push(keyMessages);
  }

  if (goals) {
    parts.push(`🎯 ${goals}`);
  }

  if (targetAudience) {
    parts.push(`For ${targetAudience}`);
  }

  // Platform-specific adjustments
  if (platform === 'Twitter/X') {
    // Keep it concise for Twitter
    return parts.slice(0, 2).join(' ') || 'Check out our latest release!';
  }

  if (platform === 'TikTok') {
    // More casual for TikTok
    return parts.join(' ') || 'New content dropping! 🎉';
  }

  if (platform === 'Instagram') {
    // Can be longer for Instagram
    return parts.join('\n\n') || 'Excited to share our latest work with you!';
  }

  if (platform === 'YouTube') {
    // Descriptive for YouTube
    return parts.join('\n\n') || 'Welcome to our channel!';
  }

  return parts.join('\n\n') || 'New content available!';
}

/**
 * Get platform-appropriate tone
 */
function getPlatformTone(platform: string, baseTone: string): string {
  const platformTones: Record<string, string> = {
    'Twitter/X': 'concise',
    'TikTok': 'casual',
    'Instagram': baseTone,
    'YouTube': 'professional',
  };
  return platformTones[platform] || baseTone;
}

/**
 * Get max characters for platform
 */
function getPlatformMaxChars(platform: string): number {
  const limits: Record<string, number> = {
    'Twitter/X': 280,
    'Instagram': 2200,
    'TikTok': 2200,
    'YouTube': 5000,
  };
  return limits[platform] || 1000;
}

/**
 * Generate hashtags from brief content
 */
function generateHashtags(
  goals: string,
  targetAudience: string,
  keyMessages: string
): string[] {
  const hashtags: string[] = [];

  // Extract keywords from goals
  if (goals) {
    const goalWords = goals
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 4)
      .slice(0, 3);
    goalWords.forEach((word) => {
      const tag = `#${word.replace(/[^a-z0-9]/g, '')}`;
      if (tag.length > 1 && !hashtags.includes(tag)) {
        hashtags.push(tag);
      }
    });
  }

  // Add common campaign hashtags
  const commonTags = ['#newrelease', '#content', '#creative'];
  commonTags.forEach((tag) => {
    if (!hashtags.includes(tag)) {
      hashtags.push(tag);
    }
  });

  // Limit to 10 hashtags
  return hashtags.slice(0, 10);
}

/**
 * Generate posting checklist
 */
function generateChecklist(
  platforms: string[],
  assets: Array<{ id: string; name: string; type?: string }>
): ChecklistItem[] {
  const checklist: ChecklistItem[] = [];

  // Platform-specific tasks
  platforms.forEach((platform) => {
    checklist.push({
      id: `caption-${platform}`,
      task: `Write caption for ${platform}`,
      completed: false,
      platform,
    });

    checklist.push({
      id: `hashtags-${platform}`,
      task: `Add hashtags for ${platform}`,
      completed: false,
      platform,
    });

    checklist.push({
      id: `schedule-${platform}`,
      task: `Schedule post for ${platform}`,
      completed: false,
      platform,
    });
  });

  // Asset-specific tasks
  assets.forEach((asset) => {
    checklist.push({
      id: `asset-${asset.id}`,
      task: `Prepare ${asset.name || asset.type || 'asset'} for posting`,
      completed: false,
    });
  });

  // General tasks
  checklist.push({
    id: 'review-all',
    task: 'Review all captions and hashtags',
    completed: false,
  });

  checklist.push({
    id: 'approve-content',
    task: 'Get approval for all content',
    completed: false,
  });

  return checklist;
}

/**
 * Safely merge campaign pack into project_bible.release_plan
 * Preserves all unknown keys and existing draftHistory
 */
export function mergeCampaignPackIntoReleasePlan(
  existingBible: Record<string, any>,
  newDraft: CampaignPackDraft
): Record<string, any> {
  const bible = { ...existingBible };
  
  // Initialize release_plan if it doesn't exist
  if (!bible.release_plan) {
    bible.release_plan = {};
  }

  const releasePlan = { ...bible.release_plan };

  // Initialize campaignPack if it doesn't exist
  if (!releasePlan.campaignPack) {
    releasePlan.campaignPack = {};
  }

  const campaignPack = { ...releasePlan.campaignPack };

  // Preserve existing draftHistory
  const draftHistory = Array.isArray(campaignPack.draftHistory)
    ? [...campaignPack.draftHistory]
    : [];

  // Add current draft to history if it exists
  if (campaignPack.currentDraft) {
    draftHistory.push({
      ...campaignPack.currentDraft,
      archivedAt: new Date().toISOString(),
    });
  }

  // Update with new draft
  campaignPack.currentDraft = newDraft;
  campaignPack.draftHistory = draftHistory;
  campaignPack.updatedAt = new Date().toISOString();

  // Merge back
  releasePlan.campaignPack = campaignPack;
  bible.release_plan = releasePlan;

  return bible;
}

/**
 * Get active brief from project_bible
 */
export function getActiveBrief(projectBible: Record<string, any> | undefined): BriefContent | null {
  if (!projectBible) return null;
  return projectBible.brief || null;
}

/**
 * Get release plan currentDraft from project_bible
 */
export function getReleasePlanDraft(projectBible: Record<string, any> | undefined): ReleasePlanDraft | null {
  if (!projectBible?.release_plan?.currentDraft) return null;
  return projectBible.release_plan.currentDraft;
}
