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
export type StorageProvider = 'supabase' | 'qnap' | 'local' | 's3';

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
  storage_provider: StorageProvider;
  is_public: boolean;
  signed_url_expires_at?: string;
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
