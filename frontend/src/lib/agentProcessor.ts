/**
 * Agent Processor - Executes workflow tasks using AI agents
 *
 * This service manages the execution of workflow tasks by delegating to
 * specialized agents (Cassidy, Letitia, Giorgio, Jamal)
 */

import Anthropic from '@anthropic-ai/sdk';

let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (anthropicClient) return anthropicClient;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Important: do NOT instantiate the SDK without a key. Some SDK versions
    // throw at construction time, which can crash a serverless invocation.
    throw new Error('ANTHROPIC_API_KEY is not set');
  }
  anthropicClient = new Anthropic({ apiKey });
  return anthropicClient;
}

export type AgentName = 'cassidy' | 'letitia' | 'giorgio' | 'jamal';

interface TaskContext {
  taskId: string;
  workflowId: string;
  title: string;
  description: string;
  agentName: AgentName;
  fileMetadata?: {
    fileName: string;
    fileType: string;
    fileUrl: string;
    fileSize: number;
  };
}

interface ProcessingResult {
  success: boolean;
  results: Record<string, any>;
  error?: string;
}

/**
 * Agent system prompts and capabilities
 */
const AGENT_CONFIGS = {
  cassidy: {
    name: 'Cassidy',
    role: 'Licensing & Compliance Specialist',
    systemPrompt: `You are Cassidy, a licensing and compliance specialist for creative content.

Your responsibilities:
- Analyze audio/video content for copyright and licensing requirements
- Identify samples, interpolations, or derivative works
- Recommend licensing actions and clearances needed
- Flag potential copyright issues
- Suggest licensing strategies for distribution

Provide your analysis in JSON format with:
{
  "clearanceStatus": "clear" | "needs_review" | "issues_found",
  "identifiedSamples": [...],
  "licensingRecommendations": [...],
  "estimatedCost": number,
  "riskLevel": "low" | "medium" | "high",
  "notes": "..."
}`,
  },
  letitia: {
    name: 'Letitia',
    role: 'Cataloging & Organization Specialist',
    systemPrompt: `You are Letitia, a cataloging and organization specialist for creative assets.

Your responsibilities:
- Catalog and organize files (audio, video, images, documents)
- Extract metadata (title, artist, genre, BPM, key, etc.)
- Suggest tags and categories
- Recommend folder structures and naming conventions
- Create searchable asset databases

Provide your analysis in JSON format with:
{
  "suggestedTitle": "...",
  "metadata": { ... },
  "tags": [...],
  "categories": [...],
  "organizationSuggestions": [...],
  "searchKeywords": [...]
}`,
  },
  giorgio: {
    name: 'Giorgio',
    role: 'Creative & Script Generation Specialist',
    systemPrompt: `You are Giorgio, a creative content and script generation specialist.

Your responsibilities:
- Generate video scripts and storyboards
- Create content concepts and treatments
- Suggest visual and narrative elements
- Develop social media content strategies
- Write promotional copy

Provide your output in JSON format with:
{
  "scriptOutline": [...],
  "visualConcepts": [...],
  "targetAudience": "...",
  "tone": "...",
  "estimatedRuntime": "...",
  "productionNotes": [...]
}`,
  },
  jamal: {
    name: 'Jamal',
    role: 'Distribution & Marketing Specialist',
    systemPrompt: `You are Jamal, a distribution and marketing specialist for creative content.

Your responsibilities:
- Create distribution strategies across platforms
- Recommend release schedules and timing
- Suggest marketing campaigns and promotional tactics
- Analyze platform-specific requirements
- Develop audience engagement strategies

Provide your strategy in JSON format with:
{
  "platforms": [...],
  "releaseSchedule": { ... },
  "marketingTactics": [...],
  "budgetEstimate": number,
  "expectedReach": "...",
  "kpis": [...]
}`,
  },
};

/**
 * Process a task using the appropriate AI agent
 */
export async function processTask(context: TaskContext): Promise<ProcessingResult> {
  const config = AGENT_CONFIGS[context.agentName];

  if (!config) {
    return {
      success: false,
      results: {},
      error: `Unknown agent: ${context.agentName}`,
    };
  }

  try {
    const anthropic = getAnthropicClient();

    // Build the user prompt with task context
    let userPrompt = `Task: ${context.title}\n\n${context.description}\n\n`;

    if (context.fileMetadata) {
      userPrompt += `File Information:
- Name: ${context.fileMetadata.fileName}
- Type: ${context.fileMetadata.fileType}
- Size: ${(context.fileMetadata.fileSize / 1024 / 1024).toFixed(2)} MB
- URL: ${context.fileMetadata.fileUrl}

`;
    }

    userPrompt += `Please analyze this and provide your professional assessment in the JSON format specified in your role.`;

    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      system: config.systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    // Extract the response
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Try to parse as JSON
    let results: Record<string, any>;
    try {
      // Look for JSON in the response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        results = JSON.parse(jsonMatch[0]);
      } else {
        // If no JSON found, wrap the text response
        results = {
          agentResponse: content.text,
          processedAt: new Date().toISOString(),
        };
      }
    } catch (parseError) {
      // If parsing fails, store the raw response
      results = {
        rawResponse: content.text,
        processedAt: new Date().toISOString(),
      };
    }

    // Add metadata
    results._agent = context.agentName;
    results._processedBy = config.name;
    results._completedAt = new Date().toISOString();

    return {
      success: true,
      results,
    };
  } catch (error) {
    console.error(`[AgentProcessor] Error processing task with ${context.agentName}:`, error);
    return {
      success: false,
      results: {},
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Simulate task processing (for testing without API calls)
 */
export async function simulateTaskProcessing(context: TaskContext): Promise<ProcessingResult> {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  const config = AGENT_CONFIGS[context.agentName];

  // Generate mock results based on agent type
  const mockResults: Record<string, any> = {
    _agent: context.agentName,
    _processedBy: config?.name || 'Unknown',
    _completedAt: new Date().toISOString(),
    _simulated: true,
  };

  switch (context.agentName) {
    case 'cassidy':
      mockResults.clearanceStatus = 'clear';
      mockResults.licensingRecommendations = ['No samples detected', 'Ready for distribution'];
      mockResults.riskLevel = 'low';
      mockResults.estimatedCost = 0;
      break;
    case 'letitia':
      mockResults.suggestedTitle = context.fileMetadata?.fileName || 'Untitled';
      mockResults.tags = ['audio', 'music', 'production'];
      mockResults.metadata = { format: context.fileMetadata?.fileType };
      break;
    case 'giorgio':
      mockResults.scriptOutline = ['Introduction', 'Main Content', 'Conclusion'];
      mockResults.tone = 'professional';
      mockResults.targetAudience = 'music enthusiasts';
      break;
    case 'jamal':
      mockResults.platforms = ['Spotify', 'Apple Music', 'YouTube'];
      mockResults.releaseSchedule = { suggestedDate: '2 weeks from now' };
      mockResults.expectedReach = '1,000-5,000 listeners';
      break;
  }

  return {
    success: true,
    results: mockResults,
  };
}
