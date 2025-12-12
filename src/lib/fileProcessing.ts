// Auto-processing service for uploaded files
import { fileProcessingDb } from '@/lib/database';
import type { FileProcessingInsert, AgentName, ProcessingType } from '@/types/database';

/**
 * Determine which agents should process a file based on its type
 */
export function getAgentsForFileType(fileType: string, fileExtension: string): Array<{
  agent: AgentName;
  processingType: ProcessingType;
  priority: number;
}> {
  const agents: Array<{ agent: AgentName; processingType: ProcessingType; priority: number }> = [];

  // Audio files → Licensing check
  if (fileType.startsWith('audio/') || ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac'].includes(fileExtension)) {
    agents.push({
      agent: 'cassidy',
      processingType: 'licensing',
      priority: 1, // High priority for licensing
    });
  }

  // Images → Cataloging
  if (fileType.startsWith('image/') || ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(fileExtension)) {
    agents.push({
      agent: 'letitia',
      processingType: 'cataloging',
      priority: 2,
    });
  }

  // Videos → Cataloging + potential script generation
  if (fileType.startsWith('video/') || ['.mp4', '.mov', '.avi', '.webm', '.mkv'].includes(fileExtension)) {
    agents.push({
      agent: 'letitia',
      processingType: 'cataloging',
      priority: 2,
    });
    agents.push({
      agent: 'giorgio',
      processingType: 'script_gen',
      priority: 3,
    });
  }

  // Documents → Cataloging
  if (fileType.includes('pdf') || fileType.includes('document') || ['.pdf', '.txt', '.md', '.doc', '.docx'].includes(fileExtension)) {
    agents.push({
      agent: 'letitia',
      processingType: 'cataloging',
      priority: 3,
    });
  }

  return agents;
}

/**
 * Create processing records for a file based on its type
 */
export async function createAutoProcessingRecords(
  fileId: string,
  fileType: string,
  fileExtension: string
): Promise<{ created: number; records: any[] }> {
  const agents = getAgentsForFileType(fileType, fileExtension);

  if (agents.length === 0) {
    return { created: 0, records: [] };
  }

  const records = [];

  for (const { agent, processingType } of agents) {
    try {
      const processingRecord: FileProcessingInsert = {
        file_id: fileId,
        agent_name: agent,
        processing_type: processingType,
        status: 'pending',
        results: {},
        metadata: {
          auto_created: true,
          created_at: new Date().toISOString(),
        },
      };

      const record = await fileProcessingDb.create(processingRecord);
      records.push(record);
    } catch (error) {
      console.error(`Failed to create processing record for ${agent}:`, error);
    }
  }

  return {
    created: records.length,
    records,
  };
}

/**
 * Get suggested workflow type based on file types in a project
 */
export function suggestWorkflowType(fileTypes: string[]): 'licensing' | 'creative' | 'distribution' | 'cataloging' | 'custom' {
  const hasAudio = fileTypes.some(t => t.startsWith('audio/'));
  const hasVideo = fileTypes.some(t => t.startsWith('video/'));
  const hasImage = fileTypes.some(t => t.startsWith('image/'));

  if (hasAudio && hasVideo) {
    return 'creative'; // Full production workflow
  } else if (hasAudio) {
    return 'licensing'; // Audio needs licensing check
  } else if (hasVideo || hasImage) {
    return 'cataloging'; // Visual assets need cataloging
  } else {
    return 'custom';
  }
}

/**
 * Generate workflow suggestions based on uploaded files
 */
export function generateWorkflowSuggestions(files: Array<{ fileType: string; fileName: string }>): Array<{
  workflowType: string;
  title: string;
  description: string;
  agents: AgentName[];
}> {
  const suggestions = [];
  const fileTypes = files.map(f => f.fileType);

  const hasAudio = fileTypes.some(t => t.startsWith('audio/'));
  const hasVideo = fileTypes.some(t => t.startsWith('video/'));
  const hasImage = fileTypes.some(t => t.startsWith('image/'));

  // Licensing workflow for audio
  if (hasAudio) {
    suggestions.push({
      workflowType: 'licensing',
      title: 'Audio Licensing Check',
      description: 'Run licensing compliance check on uploaded audio files',
      agents: ['cassidy' as AgentName],
    });
  }

  // Creative workflow for mixed media
  if (hasAudio && (hasVideo || hasImage)) {
    suggestions.push({
      workflowType: 'creative',
      title: 'Full Production Workflow',
      description: 'Complete creative workflow with licensing, cataloging, and distribution',
      agents: ['cassidy' as AgentName, 'letitia' as AgentName, 'giorgio' as AgentName, 'jamal' as AgentName],
    });
  }

  // Distribution workflow for finished content
  if (hasVideo || hasAudio) {
    suggestions.push({
      workflowType: 'distribution',
      title: 'Content Distribution Plan',
      description: 'Create distribution strategy for your content across platforms',
      agents: ['jamal' as AgentName],
    });
  }

  // Cataloging for visual assets
  if (hasImage || hasVideo) {
    suggestions.push({
      workflowType: 'cataloging',
      title: 'Asset Cataloging',
      description: 'Organize and catalog your visual assets',
      agents: ['letitia' as AgentName],
    });
  }

  return suggestions;
}

/**
 * Check if file processing is complete
 */
export async function isFileProcessingComplete(fileId: string): Promise<boolean> {
  const processing = await fileProcessingDb.getByFileId(fileId);

  if (processing.length === 0) {
    return false; // No processing records
  }

  const allComplete = processing.every(p =>
    p.status === 'completed' || p.status === 'failed'
  );

  return allComplete;
}

/**
 * Get processing status summary for a file
 */
export async function getProcessingStatus(fileId: string): Promise<{
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  progress: number;
}> {
  const processing = await fileProcessingDb.getByFileId(fileId);

  const stats = {
    total: processing.length,
    pending: processing.filter(p => p.status === 'pending').length,
    processing: processing.filter(p => p.status === 'processing').length,
    completed: processing.filter(p => p.status === 'completed').length,
    failed: processing.filter(p => p.status === 'failed').length,
    progress: 0,
  };

  if (stats.total > 0) {
    stats.progress = Math.round((stats.completed / stats.total) * 100);
  }

  return stats;
}
