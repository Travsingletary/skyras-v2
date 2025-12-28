/**
 * Agent execution logging utility
 * 
 * Centralized logging for canonical agent runtime identification.
 * All agent executions should use this utility for consistent logging.
 */

const CANONICAL_RUNTIME = 'ts' as const; // TypeScript AgentKit

interface AgentLogParams {
  agent: string;
  action?: string;
  requestId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log agent execution with canonical runtime identification
 * 
 * Format: [AGENT] runtime=<runtime> agent=<name> action=<action> request_id=<id>
 * 
 * Example: [AGENT] runtime=ts agent=marcus action=chat request_id=req_123456
 */
export function logAgentExecution(params: AgentLogParams): void {
  const { agent, action, requestId, userId, metadata } = params;
  
  const logParts = [
    '[AGENT]',
    `runtime=${CANONICAL_RUNTIME}`,
    `agent=${agent}`,
  ];

  if (action) {
    logParts.push(`action=${action}`);
  }

  if (requestId) {
    logParts.push(`request_id=${requestId}`);
  }

  if (userId) {
    logParts.push(`user_id=${userId}`);
  }

  const logMessage = logParts.join(' ');

  // Log to console (server-side only in Next.js API routes)
  if (metadata) {
    console.log(logMessage, JSON.stringify(metadata));
  } else {
    console.log(logMessage);
  }
}

/**
 * Generate a unique request ID for agent execution tracking
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
