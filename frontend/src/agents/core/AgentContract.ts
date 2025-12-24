/**
 * Unified Agent Contract - MVP
 * Standardized response and error types for all agents
 */

export interface AgentArtifact {
  type: 'text' | 'image' | 'file' | 'metadata' | 'prompt';
  content: string;
  url?: string;
  metadata?: Record<string, unknown>;
}

export interface ProofMarker {
  step: string;
  status: 'ROUTE_OK' | 'AGENT_OK' | 'DB_OK' | 'DONE' | 'ERROR';
  message: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

export interface AgentResponse {
  agent: string;
  action: string;
  success: boolean;
  output: string;
  artifacts?: AgentArtifact[];
  warnings?: string[];
  proof?: ProofMarker[];
  metadata?: Record<string, unknown>;
}

export interface AgentError {
  success: false;
  error: {
    code: string;
    message: string;
    step: string;
    details?: Record<string, unknown>;
  };
  proof?: ProofMarker[];
}

export type AgentResult = AgentResponse | AgentError;

/**
 * Helper to create proof markers
 */
export function createProofMarker(
  step: string,
  status: ProofMarker['status'],
  message: string,
  details?: Record<string, unknown>
): ProofMarker {
  return {
    step,
    status,
    message,
    timestamp: new Date().toISOString(),
    details,
  };
}

/**
 * Helper to create success response
 */
export function createAgentResponse(
  agent: string,
  action: string,
  output: string,
  options?: {
    artifacts?: AgentArtifact[];
    warnings?: string[];
    proof?: ProofMarker[];
    metadata?: Record<string, unknown>;
  }
): AgentResponse {
  return {
    agent,
    action,
    success: true,
    output,
    artifacts: options?.artifacts,
    warnings: options?.warnings,
    proof: options?.proof,
    metadata: options?.metadata,
  };
}

/**
 * Helper to create error response
 */
export function createAgentError(
  code: string,
  message: string,
  step: string,
  options?: {
    details?: Record<string, unknown>;
    proof?: ProofMarker[];
  }
): AgentError {
  return {
    success: false,
    error: {
      code,
      message,
      step,
      details: options?.details,
    },
    proof: options?.proof,
  };
}

