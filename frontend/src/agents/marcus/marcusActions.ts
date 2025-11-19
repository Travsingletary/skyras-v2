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

export async function collectStudioNotes(context: AgentExecutionContext): Promise<MarcusActionResult> {
  const files = await listFiles(".");
  context.logger.debug("Scanned repo root for notes", { count: files.length });
  const readme = files.includes("README.md") ? await readTextFile("README.md").catch(() => "") : "";
  return {
    summary: readme ? "Loaded README.md contents" : "README.md missing or unreadable",
    data: readme.slice(0, 500),
  };
}

export async function logPlanToSupabase(context: AgentExecutionContext, payload: Record<string, unknown>): Promise<MarcusActionResult> {
  const response = await context.supabase.from("studio_plans").insert(payload);
  if (response.error) {
    context.logger.warn("Supabase insert failed", { error: response.error.message });
    return { summary: "Failed to log plan", data: response.error.message };
  }

  return { summary: "Plan logged to Supabase (mock)", data: response.data };
}

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
