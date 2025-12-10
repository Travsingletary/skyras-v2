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
    const { data, error } = await supabase.from('workflows').select({ user_id: userId });
    if (error) throw new Error(`Failed to get user workflows: ${error.message || JSON.stringify(error)}`);
    return (data as Workflow[]) || [];
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
