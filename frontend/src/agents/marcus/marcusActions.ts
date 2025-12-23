import { AgentExecutionContext } from "@/agents/core/BaseAgent";
import { createComplianceAgent } from "@/agents/compliance";
import { createGiorgioAgent } from "@/agents/giorgio";
import { createJamalAgent } from "@/agents/jamal";
import { createLetitiaAgent } from "@/agents/letitia";
import { listFiles, readTextFile } from "@/lib/files";

export interface MarcusActionResult {
  summary: string;
  data?: unknown;
}

export interface LicensingAuditFile {
  path: string;
  name: string;
  tags?: string[];
  notes?: string;
}

export interface LicensingAuditPayload {
  projectId: string;
  files: LicensingAuditFile[];
}

export interface CreativeGenerationPayload {
  project: string;
  action?: string;
  context?: string;
  mood?: string;
  style?: string;
  characters?: string[];
  beats?: string[];
}

export interface DistributionPayload {
  project: string;
  campaignName?: string;
  platforms?: string[];
  slots?: number;
  mood?: string;
}

export interface CatalogPayload {
  project: string;
  name: string;
  type?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface LinkFetchPayload {
  url: string;
  context?: string;
}

export async function collectStudioNotes(context: AgentExecutionContext): Promise<MarcusActionResult> {
  const files = await listFiles(".");
  context.logger.debug("Scanned repo root for notes", { count: files.length });
  const readme = files.includes("README.md") ? await readTextFile("README.md").catch(() => "") : "";
  return {
    summary: readme ? "Loaded README.md contents" : "README.md missing or unreadable",
    data: readme.slice(0, 500),
  };
}

// Removed: logPlanToSupabase - studio_plans table does not exist
// If plan logging is needed, use workflows table instead

export async function runLicensingAudit(context: AgentExecutionContext, payload: LicensingAuditPayload) {
  if (!payload.projectId || !Array.isArray(payload.files) || payload.files.length === 0) {
    throw new Error("projectId and a non-empty files array are required for licensing audit");
  }

  const delegation = context.delegateTo("compliance", `scanFilesForLicensing:${payload.projectId}`);
  const compliance = createComplianceAgent();
  const result = await compliance.run({
    prompt: `Licensing audit for project ${payload.projectId}`,
    metadata: { action: "scanFilesForLicensing", payload },
  });

  return { delegation, result };
}

export async function runCreativeGeneration(context: AgentExecutionContext, payload: CreativeGenerationPayload) {
  if (!payload.project) {
    throw new Error("project is required for creative generation");
  }

  const action = payload.action ?? "generateScriptOutline";
  const delegation = context.delegateTo("giorgio", `${action}:${payload.project}`);
  const giorgio = createGiorgioAgent();
  const result = await giorgio.run({
    prompt: `Creative request for ${payload.project}`,
    metadata: { action, payload },
  });

  return { delegation, result };
}

export async function runDistributionPlan(context: AgentExecutionContext, payload: DistributionPayload) {
  if (!payload.project) {
    throw new Error("project is required for distribution planning");
  }

  const delegation = context.delegateTo("jamal", `postingPlan:${payload.project}`);
  const jamal = createJamalAgent();
  const result = await jamal.run({
    prompt: `Posting plan for ${payload.project}`,
    metadata: { action: "generatePostingPlan", payload },
  });

  return { delegation, result };
}

export async function runCatalogSave(context: AgentExecutionContext, payload: CatalogPayload) {
  if (!payload.project || !payload.name) {
    throw new Error("project and name are required for catalog save");
  }

  const delegation = context.delegateTo("letitia", `catalog:${payload.project}:${payload.name}`);
  const letitia = createLetitiaAgent();
  const result = await letitia.run({
    prompt: `Catalog asset for ${payload.project}`,
    metadata: { action: "saveAssetMetadata", payload },
  });

  return { delegation, result };
}

export async function fetchLinkContent(context: AgentExecutionContext, payload: LinkFetchPayload): Promise<MarcusActionResult> {
  if (!payload.url) {
    throw new Error("url is required for link fetching");
  }

  try {
    context.logger.debug("Fetching link content", { url: payload.url });

    const response = await fetch(payload.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MarcusBot/1.0; +https://skyras.com)',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      return {
        summary: `Failed to fetch link: HTTP ${response.status}`,
        data: { url: payload.url, status: response.status, statusText: response.statusText },
      };
    }

    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const json = await response.json();
      return {
        summary: `Fetched JSON content from ${payload.url}`,
        data: { url: payload.url, contentType: 'json', content: json },
      };
    } else if (contentType.includes('text/html')) {
      const html = await response.text();
      // Extract title and meta description for preview
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);

      return {
        summary: `Fetched HTML content from ${payload.url}`,
        data: {
          url: payload.url,
          contentType: 'html',
          title: titleMatch?.[1] || 'No title found',
          description: descMatch?.[1] || 'No description found',
          contentLength: html.length,
          preview: html.slice(0, 1000), // First 1000 chars as preview
        },
      };
    } else {
      const text = await response.text();
      return {
        summary: `Fetched text content from ${payload.url}`,
        data: {
          url: payload.url,
          contentType: contentType || 'text/plain',
          content: text.slice(0, 2000), // First 2000 chars
          contentLength: text.length,
        },
      };
    }
  } catch (error) {
    context.logger.error("Link fetch failed", { error, url: payload.url });
    return {
      summary: `Failed to fetch link: ${(error as Error).message}`,
      data: { url: payload.url, error: (error as Error).message },
    };
  }
}
