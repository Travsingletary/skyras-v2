import { AgentExecutionContext, AgentRunResult } from "@/agents/core/BaseAgent";

export interface SaveAssetInput {
  project: string;
  name: string;
  type?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface ListAssetsInput {
  project: string;
  tags?: string[];
}

export interface FindAssetsInput {
  project: string;
  query: string;
}

function baseMetadata(project: string) {
  return {
    agent: "letitia",
    project,
    timestamp: new Date().toISOString(),
  };
}

export async function saveAssetMetadata(context: AgentExecutionContext, input: SaveAssetInput): Promise<AgentRunResult> {
  if (!input.project || !input.name) {
    throw new Error("project and name are required to save asset metadata");
  }
  const record = {
    project_id: input.project,
    name: input.name,
    type: input.type ?? "note",
    tags: input.tags ?? [],
    metadata: input.metadata ?? {},
  };
  await context.supabase.from("assets").upsert(record);
  return {
    output: `Asset saved for ${input.project}: ${input.name}`,
    notes: {
      asset: record,
      metadata: baseMetadata(input.project),
    },
  };
}

export async function listAssets(context: AgentExecutionContext, input: ListAssetsInput): Promise<AgentRunResult> {
  if (!input.project) {
    throw new Error("project is required to list assets");
  }
  const filters: Record<string, unknown> = { project_id: input.project };
  if (input.tags?.length) {
    filters.tags = input.tags;
  }
  const response = await context.supabase.from("assets").select(filters);
  return {
    output: `Found ${response.data.length} assets for ${input.project}`,
    notes: {
      assets: response.data,
      metadata: baseMetadata(input.project),
    },
  };
}

export async function findAssets(context: AgentExecutionContext, input: FindAssetsInput): Promise<AgentRunResult> {
  if (!input.project || !input.query) {
    throw new Error("project and query are required to find assets");
  }
  const response = await context.supabase.from("assets").select({ project_id: input.project });
  const matches = (response.data || []).filter((row: any) => {
    const haystack = JSON.stringify(row).toLowerCase();
    return haystack.includes(input.query.toLowerCase());
  });
  return {
    output: `Located ${matches.length} assets matching query for ${input.project}`,
    notes: {
      assets: matches,
      metadata: baseMetadata(input.project),
    },
  };
}
