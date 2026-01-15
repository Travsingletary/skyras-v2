// Database service for Supabase CRUD operations
import { getSupabaseClient } from '@/backend/supabaseClient';
import type {
  Project,
  ProjectInsert,
  ProjectUpdate,
  File,
  FileInsert,
  FileUpdate,
  Workflow,
  WorkflowInsert,
  WorkflowUpdate,
  WorkflowTask,
  WorkflowTaskInsert,
  WorkflowTaskUpdate,
  FileProcessing,
  FileProcessingInsert,
  FileProcessingUpdate,
  CalendarEvent,
  CalendarEventInsert,
  CalendarEventUpdate,
  StyleCard,
  StyleCardInsert,
  StyleCardUpdate,
  ReferenceLibrary,
  ReferenceLibraryInsert,
  ReferenceLibraryUpdate,
  StoryboardFrame,
  StoryboardFrameInsert,
  StoryboardFrameUpdate,
  ShotList,
  ShotListInsert,
  ShotListUpdate,
  VideoClip,
  VideoClipInsert,
  VideoClipUpdate,
  TimelineSequence,
  TimelineSequenceInsert,
  TimelineSequenceUpdate,
} from '@/types/database';

const supabase = getSupabaseClient();

// ============================================================================
// PROJECTS
// ============================================================================

export const projectsDb = {
  async create(project: ProjectInsert): Promise<Project> {
    const { data, error } = await supabase.from('projects').insert(project);
    if (error) throw new Error(`Failed to create project: ${error.message || JSON.stringify(error)}`);
    return data[0] as Project;
  },

  async getById(id: string): Promise<Project | null> {
    const { data, error } = await supabase.from('projects').select({ id });
    if (error) throw new Error(`Failed to get project: ${error.message || JSON.stringify(error)}`);
    return (data[0] as Project) || null;
  },

  async getByUserId(userId: string): Promise<Project[]> {
    const { data, error } = await supabase.from('projects').select({ user_id: userId });
    if (error) throw new Error(`Failed to get user projects: ${error.message || JSON.stringify(error)}`);
    return (data as Project[]) || [];
  },

  async update(id: string, updates: ProjectUpdate): Promise<Project> {
    const { data, error } = await supabase.from('projects').update(updates, { id });
    if (error) throw new Error(`Failed to update project: ${error.message || JSON.stringify(error)}`);
    return data[0] as Project;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('projects').update({ status: 'archived' }, { id });
    if (error) throw new Error(`Failed to archive project: ${error.message || JSON.stringify(error)}`);
  },
};

// ============================================================================
// FILES
// ============================================================================

export const filesDb = {
  async create(file: FileInsert): Promise<File> {
    const { data, error } = await supabase.from('files').insert(file);
    if (error) throw new Error(`Failed to create file record: ${error.message || JSON.stringify(error)}`);
    return data[0] as File;
  },

  async getById(id: string): Promise<File | null> {
    const { data, error } = await supabase.from('files').select({ id });
    if (error) throw new Error(`Failed to get file: ${error.message || JSON.stringify(error)}`);
    return (data[0] as File) || null;
  },

  async getByProjectId(projectId: string): Promise<File[]> {
    const { data, error } = await supabase.from('files').select({ project_id: projectId });
    if (error) throw new Error(`Failed to get project files: ${error.message || JSON.stringify(error)}`);
    return (data as File[]) || [];
  },

  async getByUserId(userId: string): Promise<File[]> {
    const { data, error } = await supabase.from('files').select({ user_id: userId });
    if (error) throw new Error(`Failed to get user files: ${error.message || JSON.stringify(error)}`);
    return (data as File[]) || [];
  },

  async update(id: string, updates: FileUpdate): Promise<File> {
    const { data, error } = await supabase.from('files').update(updates, { id });
    if (error) throw new Error(`Failed to update file: ${error.message || JSON.stringify(error)}`);
    return data[0] as File;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('files').update({ processing_status: 'failed' }, { id });
    if (error) throw new Error(`Failed to mark file as deleted: ${error.message || JSON.stringify(error)}`);
  },
};

// ============================================================================
// WORKFLOWS
// ============================================================================

export const workflowsDb = {
  async create(workflow: WorkflowInsert): Promise<Workflow> {
    const { data, error } = await supabase.from('workflows').insert(workflow);
    if (error) throw new Error(`Failed to create workflow: ${error.message || JSON.stringify(error)}`);
    return data[0] as Workflow;
  },

  async getById(id: string): Promise<Workflow | null> {
    const { data, error } = await supabase.from('workflows').select({ id });
    if (error) throw new Error(`Failed to get workflow: ${error.message || JSON.stringify(error)}`);
    return (data[0] as Workflow) || null;
  },

  async getByProjectId(projectId: string): Promise<Workflow[]> {
    const { data, error } = await supabase.from('workflows').select({ project_id: projectId });
    if (error) throw new Error(`Failed to get project workflows: ${error.message || JSON.stringify(error)}`);
    return (data as Workflow[]) || [];
  },

  async getByUserId(userId: string): Promise<Workflow[]> {
    // Use proper filter syntax for SupabaseClientLike
    const { data, error } = await supabase.from('workflows').select({ user_id: userId } as Record<string, unknown>);
    if (error) {
      console.error('[workflowsDb.getByUserId] Query error:', error);
      throw new Error(`Failed to get user workflows: ${error.message || JSON.stringify(error)}`);
    }
    // Filter client-side (SupabaseClientLike select may return all rows, filter by user_id)
    const workflows = (data as Workflow[]) || [];
    const filtered = workflows.filter(w => w.user_id === userId);
    console.log(`[workflowsDb.getByUserId] Found ${filtered.length} workflows for userId: ${userId}`);
    return filtered;
  },

  async update(id: string, updates: WorkflowUpdate): Promise<Workflow> {
    const { data, error } = await supabase.from('workflows').update(updates, { id });
    if (error) throw new Error(`Failed to update workflow: ${error.message || JSON.stringify(error)}`);
    return data[0] as Workflow;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('workflows').update({ status: 'cancelled' }, { id });
    if (error) throw new Error(`Failed to cancel workflow: ${error.message || JSON.stringify(error)}`);
  },

  async incrementCompletedTasks(id: string): Promise<Workflow> {
    const workflow = await this.getById(id);
    if (!workflow) throw new Error('Workflow not found');
    return this.update(id, { completed_tasks: workflow.completed_tasks + 1 });
  },
};

// ============================================================================
// WORKFLOW TASKS
// ============================================================================

export const workflowTasksDb = {
  async create(task: WorkflowTaskInsert): Promise<WorkflowTask> {
    const { data, error } = await supabase.from('workflow_tasks').insert(task);
    if (error) throw new Error(`Failed to create task: ${error.message || JSON.stringify(error)}`);
    return data[0] as WorkflowTask;
  },

  async createMany(tasks: WorkflowTaskInsert[]): Promise<WorkflowTask[]> {
    const { data, error } = await supabase.from('workflow_tasks').insert(tasks);
    if (error) throw new Error(`Failed to create tasks: ${error.message || JSON.stringify(error)}`);
    return data as WorkflowTask[];
  },

  async getById(id: string): Promise<WorkflowTask | null> {
    const { data, error } = await supabase.from('workflow_tasks').select({ id });
    if (error) throw new Error(`Failed to get task: ${error.message || JSON.stringify(error)}`);
    return (data[0] as WorkflowTask) || null;
  },

  async getByWorkflowId(workflowId: string): Promise<WorkflowTask[]> {
    const { data, error } = await supabase.from('workflow_tasks').select({ workflow_id: workflowId });
    if (error) throw new Error(`Failed to get workflow tasks: ${error.message || JSON.stringify(error)}`);
    return (data as WorkflowTask[]) || [];
  },

  async update(id: string, updates: WorkflowTaskUpdate): Promise<WorkflowTask> {
    const { data, error } = await supabase.from('workflow_tasks').update(updates, { id });
    if (error) throw new Error(`Failed to update task: ${error.message || JSON.stringify(error)}`);
    return data[0] as WorkflowTask;
  },

  async complete(id: string): Promise<WorkflowTask> {
    return this.update(id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
    });
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('workflow_tasks').update({ status: 'skipped' }, { id });
    if (error) throw new Error(`Failed to skip task: ${error.message || JSON.stringify(error)}`);
  },
};

// ============================================================================
// FILE PROCESSING
// ============================================================================

export const fileProcessingDb = {
  async create(processing: FileProcessingInsert): Promise<FileProcessing> {
    const { data, error } = await supabase.from('file_processing').insert(processing);
    if (error) throw new Error(`Failed to create processing record: ${error.message || JSON.stringify(error)}`);
    return data[0] as FileProcessing;
  },

  async getById(id: string): Promise<FileProcessing | null> {
    const { data, error } = await supabase.from('file_processing').select({ id });
    if (error) throw new Error(`Failed to get processing record: ${error.message || JSON.stringify(error)}`);
    return (data[0] as FileProcessing) || null;
  },

  async getByFileId(fileId: string): Promise<FileProcessing[]> {
    const { data, error } = await supabase.from('file_processing').select({ file_id: fileId });
    if (error) throw new Error(`Failed to get file processing: ${error.message || JSON.stringify(error)}`);
    return (data as FileProcessing[]) || [];
  },

  async update(id: string, updates: FileProcessingUpdate): Promise<FileProcessing> {
    const { data, error } = await supabase.from('file_processing').update(updates, { id });
    if (error) throw new Error(`Failed to update processing: ${error.message || JSON.stringify(error)}`);
    return data[0] as FileProcessing;
  },

  async markCompleted(id: string, results: Record<string, any>): Promise<FileProcessing> {
    return this.update(id, {
      status: 'completed',
      results,
    });
  },

  async markFailed(id: string, errorMessage: string): Promise<FileProcessing> {
    return this.update(id, {
      status: 'failed',
      error_message: errorMessage,
    });
  },

  async getByUserId(userId: string): Promise<FileProcessing[]> {
    // Get all processing records for files owned by this user
    const files = await filesDb.getByUserId(userId);
    const fileIds = files.map(f => f.id);

    if (fileIds.length === 0) {
      return [];
    }

    const { data, error} = await supabase
      .from('file_processing')
      .select({ file_id: fileIds });  // Pass array as filter, wrapper converts to .in()

    if (error) throw new Error(`Failed to get user processing records: ${error.message || JSON.stringify(error)}`);
    return (data as FileProcessing[]) || [];
  },
};

// ============================================================================
// CALENDAR EVENTS
// ============================================================================

export const calendarEventsDb = {
  async create(event: CalendarEventInsert): Promise<CalendarEvent> {
    const { data, error } = await supabase.from('calendar_events').insert(event);
    if (error) throw new Error(`Failed to create calendar event: ${error.message || JSON.stringify(error)}`);
    return data[0] as CalendarEvent;
  },

  async getById(id: string): Promise<CalendarEvent | null> {
    const { data, error } = await supabase.from('calendar_events').select({ id });
    if (error) throw new Error(`Failed to get calendar event: ${error.message || JSON.stringify(error)}`);
    return (data[0] as CalendarEvent) || null;
  },

  async getByTaskId(taskId: string): Promise<CalendarEvent | null> {
    const { data, error } = await supabase.from('calendar_events').select({ task_id: taskId });
    if (error) throw new Error(`Failed to get task calendar event: ${error.message || JSON.stringify(error)}`);
    return (data[0] as CalendarEvent) || null;
  },

  async getByUserId(userId: string): Promise<CalendarEvent[]> {
    const { data, error } = await supabase.from('calendar_events').select({ user_id: userId });
    if (error) throw new Error(`Failed to get user calendar events: ${error.message || JSON.stringify(error)}`);
    return (data as CalendarEvent[]) || [];
  },

  async update(id: string, updates: CalendarEventUpdate): Promise<CalendarEvent> {
    const { data, error } = await supabase.from('calendar_events').update(updates, { id });
    if (error) throw new Error(`Failed to update calendar event: ${error.message || JSON.stringify(error)}`);
    return data[0] as CalendarEvent;
  },

  async updateSyncStatus(id: string, syncStatus: 'synced' | 'pending' | 'failed'): Promise<CalendarEvent> {
    return this.update(id, {
      sync_status: syncStatus,
      last_synced_at: new Date().toISOString(),
    });
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('calendar_events').update(
      { sync_status: 'failed' },
      { id }
    );
    if (error) throw new Error(`Failed to mark calendar event as failed: ${error.message || JSON.stringify(error)}`);
  },
};

// ============================================================================
// STYLE CARDS
// ============================================================================

export const styleCardsDb = {
  async create(styleCard: StyleCardInsert): Promise<StyleCard> {
    const { data, error } = await supabase.from('style_cards').insert(styleCard);
    if (error) throw new Error(`Failed to create style card: ${error.message || JSON.stringify(error)}`);
    return data[0] as StyleCard;
  },

  async getById(id: string): Promise<StyleCard | null> {
    const { data, error } = await supabase.from('style_cards').select({ id });
    if (error) throw new Error(`Failed to get style card: ${error.message || JSON.stringify(error)}`);
    return (data[0] as StyleCard) || null;
  },

  async getByProjectId(projectId: string): Promise<StyleCard[]> {
    const { data, error } = await supabase.from('style_cards').select({ project_id: projectId, deleted_at: null });
    if (error) throw new Error(`Failed to get project style cards: ${error.message || JSON.stringify(error)}`);
    const cards = (data as StyleCard[]) || [];
    return cards.filter(c => !c.deleted_at);
  },

  async getApprovedByProjectId(projectId: string): Promise<StyleCard | null> {
    const { data, error } = await supabase.from('style_cards').select({
      project_id: projectId,
      approval_status: 'approved',
      deleted_at: null
    });
    if (error) throw new Error(`Failed to get approved style card: ${error.message || JSON.stringify(error)}`);
    const cards = (data as StyleCard[]) || [];
    const filtered = cards.filter(c => !c.deleted_at && c.approval_status === 'approved');
    return filtered[0] || null;
  },

  async update(id: string, updates: StyleCardUpdate): Promise<StyleCard> {
    const { data, error } = await supabase.from('style_cards').update(updates, { id });
    if (error) throw new Error(`Failed to update style card: ${error.message || JSON.stringify(error)}`);
    return data[0] as StyleCard;
  },

  async approve(id: string, approvedBy: string): Promise<StyleCard> {
    return this.update(id, {
      approval_status: 'approved',
      is_locked: true,
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
      locked_at: new Date().toISOString(),
    });
  },

  async reject(id: string): Promise<StyleCard> {
    return this.update(id, {
      approval_status: 'rejected',
    });
  },

  async softDelete(id: string): Promise<void> {
    const { error } = await supabase.from('style_cards').update(
      { deleted_at: new Date().toISOString() },
      { id }
    );
    if (error) throw new Error(`Failed to soft delete style card: ${error.message || JSON.stringify(error)}`);
  },
};

// ============================================================================
// REFERENCE LIBRARY
// ============================================================================

export const referenceLibraryDb = {
  async create(reference: ReferenceLibraryInsert): Promise<ReferenceLibrary> {
    const { data, error } = await supabase.from('reference_library').insert(reference);
    if (error) throw new Error(`Failed to create reference: ${error.message || JSON.stringify(error)}`);
    return data[0] as ReferenceLibrary;
  },

  async getById(id: string): Promise<ReferenceLibrary | null> {
    const { data, error } = await supabase.from('reference_library').select({ id });
    if (error) throw new Error(`Failed to get reference: ${error.message || JSON.stringify(error)}`);
    return (data[0] as ReferenceLibrary) || null;
  },

  async getByProjectId(projectId: string): Promise<ReferenceLibrary[]> {
    const { data, error } = await supabase.from('reference_library').select({ project_id: projectId });
    if (error) throw new Error(`Failed to get project references: ${error.message || JSON.stringify(error)}`);
    const refs = (data as ReferenceLibrary[]) || [];
    return refs.filter(r => !r.deleted_at);
  },

  async getApprovedByProjectId(projectId: string): Promise<ReferenceLibrary[]> {
    const { data, error } = await supabase.from('reference_library').select({
      project_id: projectId,
      approval_status: 'approved'
    });
    if (error) throw new Error(`Failed to get approved references: ${error.message || JSON.stringify(error)}`);
    const refs = (data as ReferenceLibrary[]) || [];
    return refs.filter(r => !r.deleted_at && r.approval_status === 'approved');
  },

  async update(id: string, updates: ReferenceLibraryUpdate): Promise<ReferenceLibrary> {
    const { data, error } = await supabase.from('reference_library').update(updates, { id });
    if (error) throw new Error(`Failed to update reference: ${error.message || JSON.stringify(error)}`);
    return data[0] as ReferenceLibrary;
  },

  async approve(id: string, approvedBy: string): Promise<ReferenceLibrary> {
    return this.update(id, {
      approval_status: 'approved',
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
    });
  },

  async reject(id: string): Promise<ReferenceLibrary> {
    return this.update(id, {
      approval_status: 'rejected',
    });
  },

  async softDelete(id: string): Promise<void> {
    const { error } = await supabase.from('reference_library').update(
      { deleted_at: new Date().toISOString() },
      { id }
    );
    if (error) throw new Error(`Failed to soft delete reference: ${error.message || JSON.stringify(error)}`);
  },
};

// ============================================================================
// STORYBOARD FRAMES
// ============================================================================

export const storyboardFramesDb = {
  async create(frame: StoryboardFrameInsert): Promise<StoryboardFrame> {
    const { data, error } = await supabase.from('storyboard_frames').insert(frame);
    if (error) throw new Error(`Failed to create storyboard frame: ${error.message || JSON.stringify(error)}`);
    return data[0] as StoryboardFrame;
  },

  async createMany(frames: StoryboardFrameInsert[]): Promise<StoryboardFrame[]> {
    const { data, error } = await supabase.from('storyboard_frames').insert(frames);
    if (error) throw new Error(`Failed to create storyboard frames: ${error.message || JSON.stringify(error)}`);
    return data as StoryboardFrame[];
  },

  async getById(id: string): Promise<StoryboardFrame | null> {
    const { data, error } = await supabase.from('storyboard_frames').select({ id });
    if (error) throw new Error(`Failed to get storyboard frame: ${error.message || JSON.stringify(error)}`);
    return (data[0] as StoryboardFrame) || null;
  },

  async getByProjectId(projectId: string): Promise<StoryboardFrame[]> {
    const { data, error } = await supabase.from('storyboard_frames').select({ project_id: projectId });
    if (error) throw new Error(`Failed to get project storyboard frames: ${error.message || JSON.stringify(error)}`);
    const frames = (data as StoryboardFrame[]) || [];
    return frames.filter(f => !f.deleted_at).sort((a, b) => a.frame_number - b.frame_number);
  },

  async update(id: string, updates: StoryboardFrameUpdate): Promise<StoryboardFrame> {
    const { data, error } = await supabase.from('storyboard_frames').update(updates, { id });
    if (error) throw new Error(`Failed to update storyboard frame: ${error.message || JSON.stringify(error)}`);
    return data[0] as StoryboardFrame;
  },

  async approve(id: string, approvedBy: string): Promise<StoryboardFrame> {
    return this.update(id, {
      approval_status: 'approved',
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
    });
  },

  async approveMany(ids: string[], approvedBy: string): Promise<void> {
    const updates = {
      approval_status: 'approved' as const,
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
    };

    for (const id of ids) {
      await this.update(id, updates);
    }
  },

  async needsRevision(id: string, notes?: string): Promise<StoryboardFrame> {
    return this.update(id, {
      approval_status: 'needs_revision',
      revision_notes: notes,
    });
  },

  async softDelete(id: string): Promise<void> {
    const { error } = await supabase.from('storyboard_frames').update(
      { deleted_at: new Date().toISOString() },
      { id }
    );
    if (error) throw new Error(`Failed to soft delete storyboard frame: ${error.message || JSON.stringify(error)}`);
  },

  async areAllApproved(projectId: string): Promise<boolean> {
    const frames = await this.getByProjectId(projectId);
    if (frames.length === 0) return false;
    return frames.every(f => f.approval_status === 'approved');
  },
};

// ============================================================================
// SHOT LISTS
// ============================================================================

export const shotListsDb = {
  async create(shotList: ShotListInsert): Promise<ShotList> {
    const { data, error } = await supabase.from('shot_lists').insert(shotList);
    if (error) throw new Error(`Failed to create shot list: ${error.message || JSON.stringify(error)}`);
    return data[0] as ShotList;
  },

  async createMany(shotLists: ShotListInsert[]): Promise<ShotList[]> {
    const { data, error } = await supabase.from('shot_lists').insert(shotLists);
    if (error) throw new Error(`Failed to create shot lists: ${error.message || JSON.stringify(error)}`);
    return data as ShotList[];
  },

  async getById(id: string): Promise<ShotList | null> {
    const { data, error } = await supabase.from('shot_lists').select({ id });
    if (error) throw new Error(`Failed to get shot list: ${error.message || JSON.stringify(error)}`);
    return (data[0] as ShotList) || null;
  },

  async getByProjectId(projectId: string): Promise<ShotList[]> {
    const { data, error } = await supabase.from('shot_lists').select({ project_id: projectId });
    if (error) throw new Error(`Failed to get project shot lists: ${error.message || JSON.stringify(error)}`);
    const shotLists = (data as ShotList[]) || [];
    return shotLists.sort((a, b) => a.shot_number - b.shot_number);
  },

  async update(id: string, updates: ShotListUpdate): Promise<ShotList> {
    const { data, error } = await supabase.from('shot_lists').update(updates, { id });
    if (error) throw new Error(`Failed to update shot list: ${error.message || JSON.stringify(error)}`);
    return data[0] as ShotList;
  },
};

// ============================================================================
// VIDEO CLIPS
// ============================================================================

export const videoClipsDb = {
  async create(clip: VideoClipInsert): Promise<VideoClip> {
    const { data, error } = await supabase.from('video_clips').insert(clip);
    if (error) throw new Error(`Failed to create video clip: ${error.message || JSON.stringify(error)}`);
    return data[0] as VideoClip;
  },

  async createMany(clips: VideoClipInsert[]): Promise<VideoClip[]> {
    const { data, error } = await supabase.from('video_clips').insert(clips);
    if (error) throw new Error(`Failed to create video clips: ${error.message || JSON.stringify(error)}`);
    return data as VideoClip[];
  },

  async getById(id: string): Promise<VideoClip | null> {
    const { data, error } = await supabase.from('video_clips').select({ id });
    if (error) throw new Error(`Failed to get video clip: ${error.message || JSON.stringify(error)}`);
    return (data[0] as VideoClip) || null;
  },

  async getByProjectId(projectId: string): Promise<VideoClip[]> {
    const { data, error } = await supabase.from('video_clips').select({ project_id: projectId });
    if (error) throw new Error(`Failed to get project video clips: ${error.message || JSON.stringify(error)}`);
    const clips = (data as VideoClip[]) || [];
    return clips.sort((a, b) => a.clip_number - b.clip_number);
  },

  async getByShotListId(shotListId: string): Promise<VideoClip[]> {
    const { data, error } = await supabase.from('video_clips').select({ shot_list_id: shotListId });
    if (error) throw new Error(`Failed to get shot list video clips: ${error.message || JSON.stringify(error)}`);
    const clips = (data as VideoClip[]) || [];
    return clips.sort((a, b) => a.clip_number - b.clip_number);
  },

  async update(id: string, updates: VideoClipUpdate): Promise<VideoClip> {
    const { data, error } = await supabase.from('video_clips').update(updates, { id });
    if (error) throw new Error(`Failed to update video clip: ${error.message || JSON.stringify(error)}`);
    return data[0] as VideoClip;
  },
};

// ============================================================================
// TIMELINE SEQUENCES
// ============================================================================

export const timelineSequencesDb = {
  async create(sequence: TimelineSequenceInsert): Promise<TimelineSequence> {
    const { data, error } = await supabase.from('timeline_sequences').insert(sequence);
    if (error) throw new Error(`Failed to create timeline sequence: ${error.message || JSON.stringify(error)}`);
    return data[0] as TimelineSequence;
  },

  async getById(id: string): Promise<TimelineSequence | null> {
    const { data, error } = await supabase.from('timeline_sequences').select({ id });
    if (error) throw new Error(`Failed to get timeline sequence: ${error.message || JSON.stringify(error)}`);
    return (data[0] as TimelineSequence) || null;
  },

  async getByProjectId(projectId: string): Promise<TimelineSequence[]> {
    const { data, error } = await supabase.from('timeline_sequences').select({ project_id: projectId });
    if (error) throw new Error(`Failed to get project timeline sequences: ${error.message || JSON.stringify(error)}`);
    return (data as TimelineSequence[]) || [];
  },

  async update(id: string, updates: TimelineSequenceUpdate): Promise<TimelineSequence> {
    const { data, error } = await supabase.from('timeline_sequences').update(updates, { id });
    if (error) throw new Error(`Failed to update timeline sequence: ${error.message || JSON.stringify(error)}`);
    return data[0] as TimelineSequence;
  },
};

// ============================================================================
// VIDEO JOBS
// ============================================================================

export const videoJobsDb = {
  async create(job: VideoJobInsert): Promise<VideoJob> {
    const { data, error } = await supabase.from('video_jobs').insert(job);
    if (error) throw new Error(`Failed to create video job: ${error.message || JSON.stringify(error)}`);
    return data[0] as VideoJob;
  },

  async getById(id: string, userId: string): Promise<VideoJob | null> {
    const { data, error } = await supabase.from('video_jobs').select({ id, user_id: userId } as Record<string, unknown>);
    if (error) throw new Error(`Failed to get video job: ${error.message || JSON.stringify(error)}`);
    const jobs = (data as VideoJob[]) || [];
    // Filter client-side to ensure ownership
    return jobs.find(j => j.id === id && j.user_id === userId) || null;
  },

  async getByUserId(userId: string): Promise<VideoJob[]> {
    const { data, error } = await supabase.from('video_jobs').select({ user_id: userId } as Record<string, unknown>);
    if (error) throw new Error(`Failed to get user video jobs: ${error.message || JSON.stringify(error)}`);
    const jobs = (data as VideoJob[]) || [];
    // Filter client-side to ensure ownership
    return jobs.filter(j => j.user_id === userId).sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  async getByClientRequestId(userId: string, clientRequestId: string): Promise<VideoJob | null> {
    const jobs = await this.getByUserId(userId);
    return jobs.find(j => j.client_request_id === clientRequestId) || null;
  },

  async update(id: string, updates: VideoJobUpdate): Promise<VideoJob> {
    const { data, error } = await supabase.from('video_jobs').update(updates, { id });
    if (error) throw new Error(`Failed to update video job: ${error.message || JSON.stringify(error)}`);
    return data[0] as VideoJob;
  },
};
