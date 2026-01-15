// Gemini image generation adapter (Nano Banana)

import type { CreateImageArgs, EditImageArgs, ProviderResult } from "./types";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_API_BASE_URL =
  process.env.GEMINI_API_BASE_URL || "https://generativelanguage.googleapis.com/v1beta";
const GEMINI_IMAGE_MODEL =
  process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const GEMINI_IMAGE_ASPECT_RATIO =
  process.env.GEMINI_IMAGE_ASPECT_RATIO || "1:1";
const GEMINI_IMAGE_SIZE = process.env.GEMINI_IMAGE_SIZE;

function requireEnv(name: string, value: string) {
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
}

function validateConfig() {
  requireEnv("GEMINI_API_KEY", GEMINI_API_KEY);
}

function buildPrompt(prompt: string, style?: string): string {
  if (!style) return prompt;
  return `${prompt}. Style: ${style}`;
}

function buildImageConfig() {
  const config: Record<string, string> = {
    aspectRatio: GEMINI_IMAGE_ASPECT_RATIO,
  };
  if (GEMINI_IMAGE_SIZE) {
    config.imageSize = GEMINI_IMAGE_SIZE;
  }
  return config;
}

async function fetchImageAsBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const mimeType = response.headers.get("content-type") || "image/png";
  return {
    base64: Buffer.from(arrayBuffer).toString("base64"),
    mimeType,
  };
}

async function requestGemini(parts: Array<Record<string, unknown>>): Promise<ProviderResult> {
  const response = await fetch(
    `${GEMINI_API_BASE_URL}/models/${GEMINI_IMAGE_MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "x-goog-api-key": GEMINI_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          imageConfig: buildImageConfig(),
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const candidate = data?.candidates?.[0]?.content?.parts || [];
  const imagePart = candidate.find((part: Record<string, unknown>) => part.inlineData);

  if (!imagePart?.inlineData?.data) {
    throw new Error("Gemini did not return an image payload");
  }

  return {
    imageBase64: imagePart.inlineData.data,
    modelName: GEMINI_IMAGE_MODEL,
    providerName: "gemini",
  };
}

export function isConfigured(): boolean {
  return Boolean(GEMINI_API_KEY);
}

export async function executeCreate(args: CreateImageArgs): Promise<ProviderResult> {
  validateConfig();
  const prompt = buildPrompt(args.prompt, args.style);
  return requestGemini([{ text: prompt }]);
}

export async function executeEdit(args: EditImageArgs): Promise<ProviderResult> {
  validateConfig();

  const prompt = buildPrompt(args.prompt, args.style);
  const { base64, mimeType } = await fetchImageAsBase64(args.imageRef);

  return requestGemini([
    { text: prompt },
    {
      inlineData: {
        mimeType,
        data: base64,
      },
    },
  ]);
}
