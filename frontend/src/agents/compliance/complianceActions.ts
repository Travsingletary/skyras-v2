import { AgentExecutionContext } from "@/agents/core/BaseAgent";

const KEYWORDS = ["DEMO", "WATERMARK", "PREVIEW", "TEMP"];
const PROVIDERS = ["artlist", "epidemic", "pond5", "motionarray", "storyblocks", "envato", "pixabay", "pexels"];

interface LicensingFile {
  path: string;
  name: string;
  tags?: string[];
  notes?: string;
}

export interface ScanFilesInput {
  projectId: string;
  files: LicensingFile[];
}

export interface ListAssetsInput {
  projectId: string;
}

export interface MarkLicensedInput {
  projectId: string;
  filePath: string;
  licenseInfo?: string;
}

interface SuspiciousFile {
  file_path: string;
  reason: string;
  inferred_type: "music" | "sfx" | "video" | "graphic" | "unknown";
  source: string;
}

function inferType(filename: string): SuspiciousFile["inferred_type"] {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (!ext) return "unknown";
  if (["mp3", "wav", "aiff", "ogg"].includes(ext)) return "music";
  if (["aep", "mogrt", "psd", "ai"].includes(ext)) return "graphic";
  if (["mp4", "mov", "m4v", "avi"].includes(ext)) return "video";
  if (["wav", "flac"].includes(ext)) return "sfx";
  return "unknown";
}

function detectProvider(filePath: string) {
  const lower = filePath.toLowerCase();
  const match = PROVIDERS.find((provider) => lower.includes(provider));
  return match ?? "manual";
}

function containsKeyword(name: string) {
  const upper = name.toUpperCase();
  return KEYWORDS.find((keyword) => upper.includes(keyword));
}

export async function scanFilesForLicensing(context: AgentExecutionContext, input: ScanFilesInput) {
  if (!input.projectId) {
    throw new Error("projectId is required for licensing scan");
  }

  // Handle empty files array gracefully - return success with empty results
  if (!Array.isArray(input.files) || input.files.length === 0) {
    return {
      summary: "No files provided to scan.",
      data: [],
    };
  }

  const suspicious: SuspiciousFile[] = [];

  for (const file of input.files) {
    const filePath = file.path || file.name;
    const provider = detectProvider(filePath);
    const keyword = containsKeyword(file.name);
    const inferred_type = inferType(file.name);

    const reasons: string[] = [];
    if (keyword) {
      reasons.push(`filename_contains_${keyword}`);
    }
    if (provider !== "manual") {
      reasons.push(`stock_provider_path_match_${provider}`);
    }
    if (file.tags?.includes("watermark")) {
      reasons.push("tag_watermark");
    }

    if (reasons.length === 0) {
      continue;
    }

    const reason = reasons.join(";");
    suspicious.push({
      file_path: filePath,
      reason,
      inferred_type,
      source: provider,
    });

    await context.supabase
      .from("media_licensing")
      .upsert({
        project_id: input.projectId,
        file_path: filePath,
        status: keyword ? "demo" : "unknown",
        source: provider,
        notes: [reason, file.notes].filter(Boolean).join(" | "),
      });
  }

  return {
    summary: `Flagged ${suspicious.length} potential assets`,
    data: suspicious,
  };
}

export async function listUnlicensedAssets(context: AgentExecutionContext, input: ListAssetsInput) {
  if (!input.projectId) {
    throw new Error("projectId is required");
  }

  const response = await context.supabase
    .from("media_licensing")
    .select({ project_id: input.projectId, status: ["demo", "unknown"] });

  return {
    summary: `Found ${response.data.length} assets needing attention`,
    data: response.data,
  };
}

export async function markAssetLicensed(context: AgentExecutionContext, input: MarkLicensedInput) {
  if (!input.projectId || !input.filePath) {
    throw new Error("projectId and filePath are required");
  }

  const notes = input.licenseInfo ? `Licensed: ${input.licenseInfo}` : "Marked licensed";
  const response = await context.supabase
    .from("media_licensing")
    .update({ status: "licensed", notes }, { project_id: input.projectId, file_path: input.filePath });

  if (response.data.length === 0) {
    await context.supabase.from("media_licensing").upsert({
      project_id: input.projectId,
      file_path: input.filePath,
      status: "licensed",
      source: "manual",
      notes,
    });
  }

  return {
    summary: "Asset marked as licensed",
    data: response.data,
  };
}
