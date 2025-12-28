// Stable Diffusion adapter using Replicate
// This is the cost-effective, open-source option for image generation

import type { CreateImageArgs, EditImageArgs, ProviderResult } from "./types";

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN || "";
const REPLICATE_MODEL_ID = process.env.REPLICATE_MODEL_ID || "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b";
const PROVIDER_BASE_URL = process.env.IMAGE_PROVIDER_BASE_URL || "https://api.replicate.com/v1";
const PROVIDER_NAME = process.env.IMAGE_PROVIDER_NAME || "replicate-stable-diffusion";

function requireEnv(name: string, value: string) {
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
}

// Only validate at runtime when functions are called, not at build time
function validateConfig() {
  requireEnv("REPLICATE_API_TOKEN", REPLICATE_API_TOKEN);
  // Model ID has a default, so it's optional
}

// Only log if we have the config (don't fail build if missing)
if (REPLICATE_API_TOKEN) {
  console.info("[Stable Diffusion adapter] configured", {
    provider: PROVIDER_NAME,
    baseUrl: PROVIDER_BASE_URL,
    hasToken: !!REPLICATE_API_TOKEN,
    model: REPLICATE_MODEL_ID,
  });
}

function getDims(size?: string): { width: number; height: number } {
  switch (size) {
    case "512x512":
      return { width: 512, height: 512 };
    case "1536x1536":
      return { width: 1536, height: 1536 };
    case "1024x1024":
    default:
      return { width: 1024, height: 1024 };
  }
}

async function createPrediction(body: Record<string, unknown>) {
  const res = await fetch(`${PROVIDER_BASE_URL}/predictions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${REPLICATE_API_TOKEN}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Replicate create failed ${res.status}: ${text}`);
  }

  return (await res.json()) as { id: string };
}

async function pollPrediction(id: string, timeoutMs = 60_000, intervalMs = 2_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const res = await fetch(`${PROVIDER_BASE_URL}/predictions/${id}`, {
      headers: { Authorization: `Token ${REPLICATE_API_TOKEN}` },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Replicate poll failed ${res.status}: ${text}`);
    }
    const data = (await res.json()) as any;
    const status = data?.status;
    if (status === "succeeded") return data;
    if (status === "failed" || status === "canceled") {
      throw new Error(`Replicate status=${status}: ${data?.error ?? "unknown"}`);
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error("Replicate polling timed out");
}

async function fetchImageAsBase64(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Image download failed ${res.status}: ${text}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer).toString("base64");
}

function buildPrompt(prompt: string, style?: string): string {
  if (!style) return prompt;
  return `${prompt}, ${style}`;
}

export async function executeCreate(args: CreateImageArgs): Promise<ProviderResult> {
  validateConfig();
  const { width, height } = getDims(args.size);
  const prediction = await createPrediction({
    version: REPLICATE_MODEL_ID,
    input: {
      prompt: buildPrompt(args.prompt, args.style),
      width,
      height,
    },
  });

  const result = await pollPrediction(prediction.id);
  const outputUrl = Array.isArray(result?.output) ? result.output[0] : undefined;
  if (!outputUrl || typeof outputUrl !== "string") {
    throw new Error("Replicate did not return an output url");
  }

  const imageBase64 = await fetchImageAsBase64(outputUrl);

  return {
    imageBase64,
    modelName: REPLICATE_MODEL_ID,
    providerName: PROVIDER_NAME,
  };
}

export async function executeEdit(args: EditImageArgs): Promise<ProviderResult> {
  validateConfig();
  const { width, height } = getDims(args.size);
  const prediction = await createPrediction({
    version: REPLICATE_MODEL_ID,
    input: {
      prompt: buildPrompt(args.prompt, args.style),
      image: args.imageRef,
      strength: args.strength,
      width,
      height,
    },
  });

  const result = await pollPrediction(prediction.id);
  const outputUrl = Array.isArray(result?.output) ? result.output[0] : undefined;
  if (!outputUrl || typeof outputUrl !== "string") {
    throw new Error("Replicate did not return an output url");
  }

  const imageBase64 = await fetchImageAsBase64(outputUrl);

  return {
    imageBase64,
    modelName: REPLICATE_MODEL_ID,
    providerName: PROVIDER_NAME,
  };
}

export function isConfigured(): boolean {
  return !!REPLICATE_API_TOKEN;
}









