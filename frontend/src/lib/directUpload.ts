/**
 * Direct Upload Helper - Upload files directly to Supabase Storage
 *
 * This bypasses the backend for file uploads, avoiding Railway's request size limits
 * and improving upload performance.
 *
 * Flow:
 * 1. Request signed URL from backend (/api/uploads/sign)
 * 2. Upload file directly to Supabase Storage using signed URL
 * 3. Confirm upload with backend (/api/uploads/confirm) to save metadata
 */

interface SignedUploadResponse {
  success: boolean;
  data?: {
    signedUrl: string;
    path: string;
    fileId: string;
    token: string;
    expiresIn: number;
  };
  error?: string;
}

interface ConfirmUploadResponse {
  success: boolean;
  data?: {
    id: string;
    fileId: string;
    name: string;
    url: string;
    path: string;
    size: number;
    type: string;
    processingCount: number;
  };
  error?: string;
}

/**
 * Upload a single file directly to Supabase Storage
 */
export async function uploadFileDirect(
  file: File,
  userId: string,
  options?: {
    projectId?: string;
    onProgress?: (progress: number) => void;
  }
): Promise<ConfirmUploadResponse['data']> {
  const { projectId, onProgress } = options || {};

  // Step 1: Request signed URL
  const signResponse = await fetch('/api/uploads/sign', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      userId,
    }),
  });

  if (!signResponse.ok) {
    const error = await signResponse.json();
    throw new Error(error.error || 'Failed to get upload URL');
  }

  const signData: SignedUploadResponse = await signResponse.json();

  if (!signData.success || !signData.data) {
    throw new Error(signData.error || 'Failed to get upload URL');
  }

  const { signedUrl, path, fileId, token } = signData.data;

  // Step 2: Upload directly to Supabase Storage
  const uploadResponse = await fetch(signedUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
      // Include token if provided by signed URL
      ...(token && { 'x-upsert': 'true' }),
    },
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
  }

  // Call progress callback
  if (onProgress) {
    onProgress(100);
  }

  // Step 3: Confirm upload and save metadata
  const confirmResponse = await fetch('/api/uploads/confirm', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      path,
      fileId,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      userId,
      projectId,
    }),
  });

  if (!confirmResponse.ok) {
    const error = await confirmResponse.json();
    throw new Error(error.error || 'Failed to confirm upload');
  }

  const confirmData: ConfirmUploadResponse = await confirmResponse.json();

  if (!confirmData.success || !confirmData.data) {
    throw new Error(confirmData.error || 'Failed to confirm upload');
  }

  return confirmData.data;
}

/**
 * Upload multiple files directly to Supabase Storage
 */
export async function uploadFilesDirect(
  files: File[],
  userId: string,
  options?: {
    projectId?: string;
    onProgress?: (fileIndex: number, progress: number) => void;
    onFileComplete?: (fileIndex: number, result: ConfirmUploadResponse['data']) => void;
  }
): Promise<{
  successful: ConfirmUploadResponse['data'][];
  failed: Array<{ file: File; error: string }>;
}> {
  const { projectId, onProgress, onFileComplete } = options || {};
  const successful: ConfirmUploadResponse['data'][] = [];
  const failed: Array<{ file: File; error: string }> = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    try {
      const result = await uploadFileDirect(file, userId, {
        projectId,
        onProgress: (progress) => {
          if (onProgress) {
            onProgress(i, progress);
          }
        },
      });

      successful.push(result);

      if (onFileComplete) {
        onFileComplete(i, result);
      }
    } catch (error) {
      console.error(`Failed to upload ${file.name}:`, error);
      failed.push({
        file,
        error: (error as Error).message,
      });
    }
  }

  return { successful, failed };
}

/**
 * Upload audio file for speech-to-text (direct to Storage, then transcribe)
 */
export async function uploadAudioForTranscription(
  audioBlob: Blob,
  userId: string
): Promise<{ transcript: string; storagePath: string }> {
  // Convert Blob to File
  const audioFile = new File([audioBlob], `recording-${Date.now()}.webm`, {
    type: audioBlob.type || 'audio/webm',
  });

  // Upload to Supabase Storage
  const uploadResult = await uploadFileDirect(audioFile, userId);

  // Call speech-to-text API with storage path
  const sttResponse = await fetch('/api/speech-to-text', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      storagePath: uploadResult.path,
    }),
  });

  if (!sttResponse.ok) {
    const error = await sttResponse.json();
    throw new Error(error.error || 'Transcription failed');
  }

  const sttData = await sttResponse.json();

  if (!sttData.success) {
    throw new Error(sttData.error || 'Transcription failed');
  }

  return {
    transcript: sttData.transcript,
    storagePath: uploadResult.path,
  };
}
