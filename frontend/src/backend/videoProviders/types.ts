// Shared types for video generation providers

export type VideoGenerationArgs = {
  prompt: string;
  imageUrl?: string;
  duration?: number;
  aspectRatio?: string;
  model?: string;
  projectId?: string;
  waitForCompletion?: boolean;
  motionStrength?: 'low' | 'medium' | 'high' | number;
  // Kling-specific options
  klingModel?: '2.5-turbo' | '1.0' | '2.6';
  provider?: 'kling' | 'runway' | 'fal-pika' | 'opentune';
  // Post-production editing options (Kling)
  editOptions?: {
    lighting?: string;
    weather?: string;
    cameraAngle?: string;
    removeWatermark?: boolean;
    replaceCharacter?: string;
  };
};

export type VideoProviderResult = {
  videoUrl: string;
  thumbnailUrl?: string;
  taskId?: string;
  modelName: string;
  providerName: string;
  duration: number;
  prompt: string;
};

export interface VideoProvider {
  executeCreate(args: VideoGenerationArgs): Promise<VideoProviderResult>;
  isConfigured(): boolean;
}
