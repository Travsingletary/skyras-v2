// Shared types for image generation providers

export type CreateImageArgs = {
  prompt: string;
  style?: string;
  size?: "512x512" | "1024x1024" | "1536x1536";
};

export type EditImageArgs = {
  imageRef: string; // URL of the source image
  prompt: string;
  style?: string;
  size?: "512x512" | "1024x1024" | "1536x1536";
  strength: number;
};

export type ProviderResult = {
  imageBase64: string; // base64-encoded PNG
  modelName: string; // e.g. "stability-ai/sdxl"
  providerName?: string; // e.g. "replicate" or "runway"
};

export interface ImageProvider {
  executeCreate(args: CreateImageArgs): Promise<ProviderResult>;
  executeEdit(args: EditImageArgs): Promise<ProviderResult>;
  isConfigured(): boolean;
}









