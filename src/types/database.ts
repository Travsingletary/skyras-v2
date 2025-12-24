// Database types for Supabase tables
// Generated from migration 0002_core_schema.sql

export type ProjectType = 'album' | 'single' | 'campaign' | 'client_work';
export type ProjectStatus = 'active' | 'archived' | 'completed';

export type WorkflowType = 'licensing' | 'creative' | 'distribution' | 'cataloging' | 'custom';
export type WorkflowStatus = 'active' | 'completed' | 'paused' | 'cancelled';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type ProcessingType = 'licensing' | 'cataloging' | 'script_gen' | 'distribution';

export type AgentName = 'marcus' | 'giorgio' | 'cassidy' | 'jamal' | 'letitia';
export type CalendarProvider = 'google' | 'outlook' | 'apple';
export type SyncStatus = 'synced' | 'pending' | 'failed';

export type PlanStatus = 'draft' | 'approved' | 'rejected';
export type BlockSyncStatus = 'pending' | 'synced' | 'failed' | 'conflict';
export type DeviceType = 'web' | 'ios' | 'android';

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
  description?: string;
  metadata: Record<string, any>;
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
// DAILY PLAN
// ============================================================================
export interface DailyPlan {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  plan_date: string; // DATE type from Postgres
  daily_brief?: string;
  minimum_day_fallback?: string;
  status: PlanStatus;
  metadata: Record<string, any>;
}

export interface DailyPlanInsert extends Omit<DailyPlan, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
}

export interface DailyPlanUpdate extends Partial<Omit<DailyPlan, 'id' | 'created_at' | 'user_id' | 'plan_date'>> {}

// ============================================================================
// DAILY PLAN BLOCK
// ============================================================================
export interface DailyPlanBlock {
  id: string;
  created_at: string;
  updated_at: string;
  plan_id: string;
  start_time: string;
  end_time: string;
  title: string;
  description?: string;
  task_ids: string[]; // Array of UUIDs
  google_event_id?: string;
  sync_status: BlockSyncStatus;
  has_conflict: boolean;
  alternate_slots: Array<{ start_time: string; end_time: string }>;
  metadata: Record<string, any>;
}

export interface DailyPlanBlockInsert extends Omit<DailyPlanBlock, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
}

export interface DailyPlanBlockUpdate extends Partial<Omit<DailyPlanBlock, 'id' | 'created_at' | 'plan_id'>> {}

// ============================================================================
// GOOGLE OAUTH TOKEN
// ============================================================================
export interface GoogleOAuthToken {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  access_token_encrypted: string;
  refresh_token_encrypted: string;
  token_expires_at: string;
  scope: string;
  metadata: Record<string, any>;
}

export interface GoogleOAuthTokenInsert extends Omit<GoogleOAuthToken, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
}

export interface GoogleOAuthTokenUpdate extends Partial<Omit<GoogleOAuthToken, 'id' | 'created_at' | 'user_id'>> {}

// ============================================================================
// PUSH NOTIFICATION TOKEN
// ============================================================================
export interface PushNotificationToken {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  fcm_token: string;
  device_type: DeviceType;
  is_active: boolean;
  metadata: Record<string, any>;
}

export interface PushNotificationTokenInsert extends Omit<PushNotificationToken, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
}

export interface PushNotificationTokenUpdate extends Partial<Omit<PushNotificationToken, 'id' | 'created_at' | 'user_id' | 'fcm_token'>> {}

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

// Daily plan with blocks populated
export interface DailyPlanWithBlocks extends DailyPlan {
  blocks: DailyPlanBlock[];
}
