import { GoogleGenerativeAI } from "@google/generative-ai";

export type NanoBananaGenerateTextInput = {
  prompt: string;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
};

export function hasNanoBanana(): boolean {
  return Boolean(process.env.NANO_BANANA_API_KEY);
}

function getNanoBananaConfig(): { apiKey: string; model: string } {
  const apiKey = process.env.NANO_BANANA_API_KEY;
  if (!apiKey) {
    throw new Error("Missing NANO_BANANA_API_KEY");
  }

  const model = process.env.NANO_BANANA_MODEL || "gemini-1.5-flash";
  return { apiKey, model };
}

export async function nanoBananaGenerateText(
  input: NanoBananaGenerateTextInput
): Promise<string> {
  const { apiKey, model: defaultModel } = getNanoBananaConfig();

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = input.model || defaultModel;

  const model = genAI.getGenerativeModel({
    model: modelName,
    ...(input.systemPrompt ? { systemInstruction: input.systemPrompt } : {}),
  });

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [{ text: input.prompt }],
      },
    ],
    generationConfig: {
      ...(typeof input.temperature === "number" ? { temperature: input.temperature } : {}),
      ...(typeof input.maxOutputTokens === "number"
        ? { maxOutputTokens: input.maxOutputTokens }
        : {}),
    },
  });

  return result.response.text();
}

