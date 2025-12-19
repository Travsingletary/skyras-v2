import { NextRequest, NextResponse } from "next/server";

import { getSupabaseClient, getSupabaseStorageClient } from "@/backend/supabaseClient";
import { executeCreate, executeEdit } from "@/backend/imageProviders/sdxlAdapter";

// Normalize supported actions
export type GenerateImageAction = "create" | "edit";

export type GenerateImageRequest = {
  action: GenerateImageAction;
  prompt: string;
  style?: string;
  size?: "512x512" | "1024x1024" | "1536x1536";
  image_ref?: string; // edit only
  strength?: number; // edit only
  projectId?: string;
  agentName?: string;
};

const DEFAULT_SIZE: GenerateImageRequest["size"] = "1024x1024";
const DEFAULT_PROVIDER = process.env.IMAGE_PROVIDER_NAME ?? "sdxl-hosted";
const STORAGE_BUCKET = process.env.IMAGE_STORAGE_BUCKET ?? "generated-images";

function parseSize(size?: string): { width: number; height: number; str: string } {
  const value: string =
    typeof size === "string" && size.length
      ? size
      : (DEFAULT_SIZE ?? "1024x1024");
  const [w, h] = value.split("x").map((n) => parseInt(n, 10));
  if (!w || !h) {
    return { width: 1024, height: 1024, str: (DEFAULT_SIZE ?? "1024x1024") };
  }
  return { width: w, height: h, str: value };
}

function estimateCost(size: string | undefined, baseCostPerImage = 0.004): number {
  const { width, height } = parseSize(size);
  const baseline = 1024 * 1024;
  const area = width * height;
  const factor = area / baseline;
  return Number((baseCostPerImage * factor).toFixed(4));
}

function decodeBase64ToUint8Array(base64: string): Uint8Array {
  return new Uint8Array(Buffer.from(base64, "base64"));
}

async function uploadToStorage(base64Image: string, projectId: string | undefined): Promise<string> {
  // Ensure client initialization
  getSupabaseClient();
  const storageClient = getSupabaseStorageClient();
  if (!storageClient) {
    throw new Error("Supabase storage client unavailable. Check SUPABASE_URL/ANON_KEY.");
  }

  const bytes = decodeBase64ToUint8Array(base64Image);
  const filePath = `${projectId || "unscoped"}/${Date.now()}-${Math.random().toString(16).slice(2)}.png`;

  const { data, error } = await storageClient.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, bytes, {
      contentType: "image/png",
      upsert: false,
    });

  if (error) {
    console.error("Supabase upload error:", error);
    throw new Error("Failed to upload image to storage");
  }

  const {
    data: { publicUrl },
  } = storageClient.storage.from(STORAGE_BUCKET).getPublicUrl(data.path);

  return publicUrl;
}

async function logImageGeneration(params: {
  projectId?: string;
  agentName?: string;
  action: GenerateImageAction;
  prompt: string;
  style?: string;
  size?: string;
  provider: string;
  model: string;
  sourceImage?: string;
  strength?: number;
  fileUrl: string;
  costEstimate?: number;
}) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("image_generation_logs").insert({
    project_id: params.projectId ?? null,
    agent_name: params.agentName ?? null,
    action: params.action,
    prompt: params.prompt,
    style: params.style ?? null,
    size: params.size ?? null,
    provider: params.provider,
    model: params.model,
    source_image: params.sourceImage ?? null,
    strength: params.strength ?? null,
    file_url: params.fileUrl,
    cost_estimate: params.costEstimate ?? null,
  });

  if (error) {
    console.error("Error inserting into image_generation_logs:", error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenerateImageRequest;

    if (!body || !body.action || !body.prompt) {
      return NextResponse.json({ error: "Missing required fields: action, prompt" }, { status: 400 });
    }

    const action = body.action;
    const size = body.size ?? DEFAULT_SIZE;
    const { width, height, str: sizeStr } = parseSize(size);

    let providerResult:
      | {
          imageBase64: string;
          modelName: string;
          providerName?: string;
        }
      | undefined;

    if (action === "create") {
      providerResult = await executeCreate({ prompt: body.prompt, style: body.style, size });
    } else if (action === "edit") {
      if (!body.image_ref) {
        return NextResponse.json({ error: "image_ref is required for edit action" }, { status: 400 });
      }
      providerResult = await executeEdit({
        imageRef: body.image_ref,
        prompt: body.prompt,
        style: body.style,
        size,
        strength: body.strength ?? 0.5,
      });
    } else {
      return NextResponse.json({ error: "Invalid action; must be 'create' or 'edit'" }, { status: 400 });
    }

    if (!providerResult) {
      return NextResponse.json({ error: "Provider did not return a result" }, { status: 502 });
    }

    const fileUrl = await uploadToStorage(providerResult.imageBase64, body.projectId);

    const costEstimate = estimateCost(size);
    const modelName = providerResult.modelName;
    const providerName = providerResult.providerName ?? DEFAULT_PROVIDER;

    await logImageGeneration({
      projectId: body.projectId,
      agentName: body.agentName,
      action,
      prompt: body.prompt,
      style: body.style,
      size: sizeStr,
      provider: providerName,
      model: modelName,
      sourceImage: body.image_ref,
      strength: body.strength,
      fileUrl,
      costEstimate,
    });

    return NextResponse.json({
      file_url: fileUrl,
      width,
      height,
      model_name: modelName,
      cost_estimate: costEstimate,
      provider: providerName,
    });
  } catch (err: any) {
    console.error("Error in /api/tools/generateImage:", err);
    return NextResponse.json({ error: "Internal server error", detail: err?.message ?? null }, { status: 500 });
  }
}
