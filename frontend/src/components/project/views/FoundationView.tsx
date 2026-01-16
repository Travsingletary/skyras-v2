'use client';

import { useState, useRef } from 'react';
import { projectsDb } from '@/lib/database';
import { uploadFilesDirect } from '@/lib/directUpload';
import type { Project } from '@/types/database';

interface FoundationViewProps {
  project: Project;
  userId: string;
  onContinue: () => void;
  onUpdate?: () => void;
}

type OutputDirection = 'story' | 'video' | 'audio' | 'mixed';

export function FoundationView({ project, userId, onContinue, onUpdate }: FoundationViewProps) {
  const [projectName, setProjectName] = useState(project.name || '');
  const [projectIntent, setProjectIntent] = useState(project.metadata?.intent || '');
  const [outputDirection, setOutputDirection] = useState<OutputDirection>(
    (project.metadata?.outputDirection as OutputDirection) || 'mixed'
  );
  const [existingMaterial, setExistingMaterial] = useState<string>(
    project.metadata?.existingMaterial || ''
  );
  const [uploadedFiles, setUploadedFiles] = useState<string[]>(
    project.metadata?.uploadedMaterialUrls || []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pasteInputRef = useRef<HTMLTextAreaElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setSaving(true);
      const uploadedUrls: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const url = await uploadFilesDirect(file, userId, project.id);
        uploadedUrls.push(url);
      }

      setUploadedFiles([...uploadedFiles, ...uploadedUrls]);
      setError(null);
    } catch (err) {
      console.error('Failed to upload files:', err);
      setError('Failed to upload files. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasteMaterial = () => {
    if (pasteInputRef.current) {
      const pastedText = pasteInputRef.current.value.trim();
      if (pastedText) {
        setExistingMaterial(pastedText);
        pasteInputRef.current.value = '';
      }
    }
  };

  const handleSkipMaterial = () => {
    setExistingMaterial('');
    setUploadedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (pasteInputRef.current) {
      pasteInputRef.current.value = '';
    }
  };

  const handleContinue = async () => {
    // Validate required fields
    if (!projectName.trim()) {
      setError('Project Name is required');
      return;
    }

    if (!projectIntent.trim()) {
      setError('Project Intent is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Save foundation data to project
      const updatedMetadata = {
        ...(project.metadata || {}),
        intent: projectIntent.trim(),
        outputDirection,
        existingMaterial: existingMaterial || null,
        uploadedMaterialUrls: uploadedFiles.length > 0 ? uploadedFiles : null,
      };

      await projectsDb.update(project.id, {
        name: projectName.trim(),
        metadata: updatedMetadata,
      });

      // Continue to Step 2
      onContinue();
      onUpdate?.();
    } catch (err) {
      console.error('Failed to save foundation data:', err);
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const isFormValid = projectName.trim() && projectIntent.trim();

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              Step 1
            </span>
            <h1 className="text-3xl font-bold text-gray-900">Foundation</h1>
          </div>
          <p className="text-gray-600 mt-2">
            Set up your project foundation to get started.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Project Name */}
          <div>
            <label htmlFor="project-name" className="block text-sm font-medium text-gray-700 mb-2">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              id="project-name"
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Enter project name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Project Intent */}
          <div>
            <label htmlFor="project-intent" className="block text-sm font-medium text-gray-700 mb-2">
              Project Intent <span className="text-red-500">*</span>
            </label>
            <textarea
              id="project-intent"
              value={projectIntent}
              onChange={(e) => setProjectIntent(e.target.value)}
              placeholder="Describe your project intent in 1-2 sentences"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className="mt-1 text-xs text-gray-500">1-2 sentences describing what you want to create</p>
          </div>

          {/* Existing Material */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Existing Material
            </label>
            <div className="space-y-4">
              {/* Upload Option */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={saving}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm disabled:opacity-50"
                >
                  {uploadedFiles.length > 0
                    ? `${uploadedFiles.length} file(s) uploaded`
                    : 'Upload Files'}
                </button>
              </div>

              {/* Paste Option */}
              <div>
                <textarea
                  ref={pasteInputRef}
                  placeholder="Or paste existing material here..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={handlePasteMaterial}
                    className="px-4 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Save Paste
                  </button>
                  {existingMaterial && (
                    <button
                      type="button"
                      onClick={handleSkipMaterial}
                      className="px-4 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {existingMaterial && (
                  <p className="mt-2 text-xs text-gray-500">
                    Material saved: {existingMaterial.substring(0, 50)}
                    {existingMaterial.length > 50 ? '...' : ''}
                  </p>
                )}
              </div>

              {/* Skip Option */}
              <div>
                <button
                  type="button"
                  onClick={handleSkipMaterial}
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Skip
                </button>
              </div>
            </div>
          </div>

          {/* Output Direction */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Output Direction
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['story', 'video', 'audio', 'mixed'] as OutputDirection[]).map((direction) => (
                <button
                  key={direction}
                  type="button"
                  onClick={() => setOutputDirection(direction)}
                  className={`px-4 py-3 border rounded-lg transition-colors text-sm font-medium ${
                    outputDirection === direction
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {direction.charAt(0).toUpperCase() + direction.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={handleContinue}
            disabled={!isFormValid || saving}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Continue to Step 2'}
          </button>
        </div>
      </div>
    </div>
  );
}
