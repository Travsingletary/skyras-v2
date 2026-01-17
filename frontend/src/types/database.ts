// Database types for Supabase tables
// Generated from migration 0002_core_schema.sql

export type ProjectType = 'album' | 'single' | 'campaign' | 'client_work';
export type ProjectStatus = 'active' | 'archived' | 'completed';
export type ProjectMode = 'ad' | 'continuity';
export type Intent = 'create' | 'finish' | 'release' | 'plan';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'needs_revision';

export type WorkflowType = 'licensing' | 'creative' | 'distribution' | 'cataloging' | 'custom';
export type WorkflowStatus = 'active' | 'completed' | 'paused' | 'cancelled';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type ProcessingType = 'licensing' | 'cataloging' | 'script_gen' | 'distribution';

export type AgentName = 'marcus' | 'giorgio' | 'cassidy' | 'jamal' | 'letitia';
export type CalendarProvider = 'google' | 'outlook' | 'apple';
export type SyncStatus = 'synced' | 'pending' | 'failed';

export type ClipStatus = 'pending' | 'generating' | 'completed' | 'failed';
export type VideoProvider = 'kling' | 'runway' | 'fal-pika' | 'opentune';

// ============================================================================
// PROJECT
// ============================================================================
export interface Project {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  name: string;
  type: ProjectType;
  status: ProjectStatus;
  mode: ProjectMode;
  project_bible?: Record<string, any>;
  description?: string;
  metadata: Record<string, any>;
  deleted_at?: string;
}

export interface ProjectInsert extends Omit<Project, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
}

export interface ProjectUpdate extends Partial<Omit<Project, 'id' | 'created_at' | 'user_id'>> {}

// ============================================================================
// FILE
// ============================================================================
export interface File {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  project_id?: string;
  original_name: string;
  storage_path: string;
  public_url: string;
  file_type: string;
  file_size: number;
  file_extension: string;
  processing_status: ProcessingStatus;
  processing_results: Record<string, any>;
  metadata: Record<string, any>;
}

export interface FileInsert extends Omit<File, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
}

export interface FileUpdate extends Partial<Omit<File, 'id' | 'created_at' | 'user_id'>> {}

// ============================================================================
// WORKFLOW
// ============================================================================
export interface Workflow {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  project_id?: string;
  name: string;
  type: WorkflowType;
  status: WorkflowStatus;
  plan_markdown?: string;
  summary?: string;
  agent_name: AgentName;
  total_tasks: number;
  completed_tasks: number;
  metadata: Record<string, any>;
}

export interface WorkflowInsert extends Omit<Workflow, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
}

export interface WorkflowUpdate extends Partial<Omit<Workflow, 'id' | 'created_at' | 'user_id'>> {}

// ============================================================================
// WORKFLOW TASK
// ============================================================================
export interface WorkflowTask {
  id: string;
  created_at: string;
  updated_at: string;
  workflow_id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  position: number;
  due_date?: string;
  completed_at?: string;
  calendar_event_id?: string;
  metadata: Record<string, any>;
}

export interface WorkflowTaskInsert extends Omit<WorkflowTask, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
}

export interface WorkflowTaskUpdate extends Partial<Omit<WorkflowTask, 'id' | 'created_at' | 'workflow_id'>> {}

// ============================================================================
// FILE PROCESSING
// ============================================================================
export interface FileProcessing {
  id: string;
  created_at: string;
  updated_at: string;
  file_id: string;
  agent_name: AgentName;
  processing_type: ProcessingType;
  status: ProcessingStatus;
  results: Record<string, any>;
  error_message?: string;
  metadata: Record<string, any>;
}

export interface FileProcessingInsert extends Omit<FileProcessing, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
}

export interface FileProcessingUpdate extends Partial<Omit<FileProcessing, 'id' | 'created_at' | 'file_id'>> {}

// ============================================================================
// CALENDAR EVENT
// ============================================================================
export interface CalendarEvent {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  task_id?: string;
  provider: CalendarProvider;
  external_event_id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  sync_status: SyncStatus;
  last_synced_at: string;
  metadata: Record<string, any>;
}

export interface CalendarEventInsert extends Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at' | 'last_synced_at'> {
  id?: string;
}

export interface CalendarEventUpdate extends Partial<Omit<CalendarEvent, 'id' | 'created_at' | 'user_id'>> {}

// ============================================================================
// HELPER TYPES
// ============================================================================

// Workflow with tasks populated
export interface WorkflowWithTasks extends Workflow {
  tasks: WorkflowTask[];
}

// Project with files and workflows
export interface ProjectWithDetails extends Project {
  files: File[];
  workflows: WorkflowWithTasks[];
}

// File with processing results
export interface FileWithProcessing extends File {
  processing: FileProcessing[];
}

// Task with calendar event
export interface TaskWithCalendar extends WorkflowTask {
  calendar_event?: CalendarEvent;
}

// ============================================================================
// STYLE CARD
// ============================================================================
export interface StyleCard {
  id: string;
  created_at: string;
  updated_at: string;
  project_id: string;
  user_id: string;
  name: string;
  description?: string;
  visual_references: string[];
  color_palette?: string[];
  typography?: Record<string, any>;
  mood_board?: string[];
  approval_status: ApprovalStatus;
  is_locked: boolean;
  locked_at?: string;
  approved_by?: string;
  approved_at?: string;
  metadata: Record<string, any>;
  deleted_at?: string;
}

export interface StyleCardInsert extends Omit<StyleCard, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
}

export interface StyleCardUpdate extends Partial<Omit<StyleCard, 'id' | 'created_at' | 'user_id' | 'project_id'>> {}

// ============================================================================
// REFERENCE LIBRARY
// ============================================================================
export interface ReferenceLibrary {
  id: string;
  created_at: string;
  updated_at: string;
  project_id: string;
  user_id: string;
  file_id?: string;
  name: string;
  url?: string;
  thumbnail_url?: string;
  reference_type: string;
  tags: string[];
  approval_status: ApprovalStatus;
  approved_by?: string;
  approved_at?: string;
  notes?: string;
  metadata: Record<string, any>;
  deleted_at?: string;
}

export interface ReferenceLibraryInsert extends Omit<ReferenceLibrary, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
}

export interface ReferenceLibraryUpdate extends Partial<Omit<ReferenceLibrary, 'id' | 'created_at' | 'user_id' | 'project_id'>> {}

// ============================================================================
// STORYBOARD FRAME
// ============================================================================
export interface StoryboardFrame {
  id: string;
  created_at: string;
  updated_at: string;
  project_id: string;
  user_id: string;
  frame_number: number;
  prompt: string;
  image_url?: string;
  thumbnail_url?: string;
  duration_seconds?: number;
  camera_angle?: string;
  lighting?: string;
  approval_status: ApprovalStatus;
  approved_by?: string;
  approved_at?: string;
  revision_notes?: string;
  reference_ids: string[];
  metadata: Record<string, any>;
  deleted_at?: string;
}

export interface StoryboardFrameInsert extends Omit<StoryboardFrame, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
}

export interface StoryboardFrameUpdate extends Partial<Omit<StoryboardFrame, 'id' | 'created_at' | 'user_id' | 'project_id'>> {}

// ============================================================================
// SHOT LIST
// ============================================================================
export interface ShotList {
  id: string;
  created_at: string;
  updated_at: string;
  project_id: string;
  user_id: string;
  shot_number: number;
  intent?: string;
  camera_instruction?: string;
  duration_seconds?: number;
  image_url?: string;
  prompt?: string;
  metadata: Record<string, any>;
}

export interface ShotListInsert extends Omit<ShotList, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
}

export interface ShotListUpdate extends Partial<Omit<ShotList, 'id' | 'created_at' | 'user_id' | 'project_id'>> {}

// ============================================================================
// VIDEO CLIP
// ============================================================================
export interface VideoClip {
  id: string;
  created_at: string;
  updated_at: string;
  project_id: string;
  shot_list_id: string;
  file_id?: string;
  clip_number: number;
  duration_seconds?: number;
  video_url?: string;
  status: ClipStatus;
  provider?: VideoProvider;
  error_message?: string;
  metadata: Record<string, any>;
}

export interface VideoClipInsert extends Omit<VideoClip, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
}

export interface VideoClipUpdate extends Partial<Omit<VideoClip, 'id' | 'created_at' | 'project_id' | 'shot_list_id'>> {}

// ============================================================================
// TIMELINE SEQUENCE
// ============================================================================
export interface TimelineSequence {
  id: string;
  created_at: string;
  updated_at: string;
  project_id: string;
  user_id: string;
  sequence_order: string[]; // Array of video_clip IDs
  timeline_name?: string;
  duration_seconds?: number;
  metadata: Record<string, any>;
}

export interface TimelineSequenceInsert extends Omit<TimelineSequence, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
}

export interface TimelineSequenceUpdate extends Partial<Omit<TimelineSequence, 'id' | 'created_at' | 'user_id' | 'project_id'>> {}

// ============================================================================
// VIDEO JOB
// ============================================================================
export interface VideoJob {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  source_image_url: string;
  provider: VideoAnimationProvider;
  provider_job_id?: string;
  status: VideoJobStatus;
  error?: string;
  output_video_url?: string;
  options: Record<string, any>;
  client_request_id?: string;
}

export interface VideoJobInsert extends Omit<VideoJob, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
}

export interface VideoJobUpdate extends Partial<Omit<VideoJob, 'id' | 'created_at' | 'user_id'>> {}

// ============================================================================
// VIDEO QUOTA
// ============================================================================
export interface VideoQuota {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  date: string; // YYYY-MM-DD format
  count: number;
}

export interface VideoQuotaInsert extends Omit<VideoQuota, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
}

export interface VideoQuotaUpdate extends Partial<Omit<VideoQuota, 'id' | 'created_at' | 'user_id'>> {}
