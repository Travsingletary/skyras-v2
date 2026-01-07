/**
 * QNAP Storage Helper
 * 
 * Backend-only integration for saving workflow assets to QNAP NAS.
 * Provides deterministic folder structure and manifest tracking.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';

const QNAP_ROOT = process.env.QNAP_ROOT || process.env.SKYRAS_ROOT || '/mnt/qnap/SkyRas';

export type AssetType = 
  | 'character_sheet'
  | 'storyboard'
  | 'upscaled_frame'
  | 'video'
  | 'audio'
  | 'metadata'
  | 'image';

export interface AssetSaveOptions {
  project: string;
  workflowId: string;
  assetType: AssetType;
  filename: string;
  buffer: Buffer;
  metadata?: Record<string, any>;
}

export interface SavedAsset {
  qnapPath: string;
  relativePath: string;
  filename: string;
  assetType: AssetType;
  size: number;
  savedAt: string;
  metadata?: Record<string, any>;
}

/**
 * Get the base path for a project
 */
function getProjectPath(project: string): string {
  // Sanitize project name for filesystem
  const sanitized = project.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(QNAP_ROOT, sanitized);
}

/**
 * Get the workflow run path
 */
function getWorkflowPath(project: string, workflowId: string): string {
  // Sanitize workflow ID (should already be UUID, but be safe)
  const sanitized = workflowId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(getProjectPath(project), sanitized);
}

/**
 * Get the asset type folder path
 */
function getAssetTypePath(project: string, workflowId: string, assetType: AssetType): string {
  return path.join(getWorkflowPath(project, workflowId), assetType);
}

/**
 * Ensure directory exists, creating parent directories if needed
 */
async function ensureDirectory(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Save an asset to QNAP storage
 * 
 * Structure: SkyRas/{project}/{workflow_id}/{asset_type}/{filename}
 */
export async function saveAssetToQnap(options: AssetSaveOptions): Promise<SavedAsset> {
  const { project, workflowId, assetType, filename, buffer, metadata } = options;

  // Sanitize filename
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Get full path
  const assetTypePath = getAssetTypePath(project, workflowId, assetType);
  await ensureDirectory(assetTypePath);

  const fullPath = path.join(assetTypePath, sanitizedFilename);

  // Write file
  await fs.writeFile(fullPath, buffer);

  // Calculate relative path from QNAP root
  const relativePath = path.relative(QNAP_ROOT, fullPath);

  return {
    qnapPath: fullPath,
    relativePath,
    filename: sanitizedFilename,
    assetType,
    size: buffer.length,
    savedAt: new Date().toISOString(),
    metadata,
  };
}

/**
 * Download a file from URL and save to QNAP
 */
export async function saveAssetFromUrl(
  url: string,
  options: Omit<AssetSaveOptions, 'buffer'>
): Promise<SavedAsset> {
  // Fetch the file
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download asset from ${url}: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return saveAssetToQnap({
    ...options,
    buffer,
  });
}

/**
 * Save a JSON manifest file for a workflow run
 */
export interface WorkflowManifest {
  workflowId: string;
  project: string;
  workflowName: string;
  workflowType: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  assets: Array<{
    type: AssetType;
    filename: string;
    relativePath: string;
    size: number;
    savedAt: string;
    metadata?: Record<string, any>;
  }>;
  metadata?: Record<string, any>;
}

export async function saveManifest(
  project: string,
  workflowId: string,
  manifest: Omit<WorkflowManifest, 'assets'>
): Promise<string> {
  const workflowPath = getWorkflowPath(project, workflowId);
  await ensureDirectory(workflowPath);

  const manifestPath = path.join(workflowPath, 'manifest.json');
  const manifestJson = JSON.stringify(manifest, null, 2);

  await fs.writeFile(manifestPath, manifestJson, 'utf-8');

  return manifestPath;
}

/**
 * Update manifest with new asset
 */
export async function updateManifestWithAsset(
  project: string,
  workflowId: string,
  asset: SavedAsset
): Promise<void> {
  const workflowPath = getWorkflowPath(project, workflowId);
  const manifestPath = path.join(workflowPath, 'manifest.json');

  let manifest: WorkflowManifest;

  try {
    const manifestContent = await fs.readFile(manifestPath, 'utf-8');
    manifest = JSON.parse(manifestContent);
  } catch {
    // Manifest doesn't exist yet, create a basic one
    manifest = {
      workflowId,
      project,
      workflowName: 'Unknown',
      workflowType: 'unknown',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
      assets: [],
    };
  }

  // Add or update asset
  const existingIndex = manifest.assets.findIndex(
    a => a.relativePath === asset.relativePath
  );

  const assetEntry = {
    type: asset.assetType,
    filename: asset.filename,
    relativePath: asset.relativePath,
    size: asset.size,
    savedAt: asset.savedAt,
    metadata: asset.metadata,
  };

  if (existingIndex >= 0) {
    manifest.assets[existingIndex] = assetEntry;
  } else {
    manifest.assets.push(assetEntry);
  }

  manifest.updatedAt = new Date().toISOString();

  // Write updated manifest
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
}

/**
 * Check if QNAP storage is available
 */
export async function isQnapAvailable(): Promise<boolean> {
  try {
    await fs.access(QNAP_ROOT);
    // Try to write a test file
    const testPath = path.join(QNAP_ROOT, '.qnap_test');
    try {
      await fs.writeFile(testPath, 'test');
      await fs.unlink(testPath);
      return true;
    } catch {
      return false;
    }
  } catch {
    return false;
  }
}

/**
 * Get manifest for a workflow run
 */
export async function getManifest(
  project: string,
  workflowId: string
): Promise<WorkflowManifest | null> {
  try {
    const workflowPath = getWorkflowPath(project, workflowId);
    const manifestPath = path.join(workflowPath, 'manifest.json');
    const manifestContent = await fs.readFile(manifestPath, 'utf-8');
    return JSON.parse(manifestContent) as WorkflowManifest;
  } catch {
    return null;
  }
}
