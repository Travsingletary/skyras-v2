'use client';

import { useEffect, useState, useRef } from 'react';
import { referenceLibraryDb } from '@/lib/database';
import { uploadFilesDirect } from '@/lib/directUpload';
import type { ReferenceLibrary } from '@/types/database';

interface ReferencesViewProps {
  projectId: string;
  userId: string;
  onUpdate?: () => void;
}

export function ReferencesView({ projectId, userId, onUpdate }: ReferencesViewProps) {
  const [references, setReferences] = useState<ReferenceLibrary[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadReferences();
  }, [projectId]);

  const loadReferences = async () => {
    try {
      setLoading(true);
      const refs = await referenceLibraryDb.getByProjectId(projectId);
      setReferences(refs);
    } catch (err) {
      console.error('Failed to load references:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await referenceLibraryDb.approve(id, userId);
      await loadReferences();
      onUpdate?.();
    } catch (err) {
      console.error('Failed to approve reference:', err);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await referenceLibraryDb.reject(id);
      await loadReferences();
      onUpdate?.();
    } catch (err) {
      console.error('Failed to reject reference:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reference?')) return;

    try {
      await referenceLibraryDb.softDelete(id);
      await loadReferences();
      onUpdate?.();
    } catch (err) {
      console.error('Failed to delete reference:', err);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleUpload(files);
    }
  };

  const handleUpload = async (files: File[]) => {
    if (!files.length) return;

    setUploading(true);
    try {
      // Use direct upload to bypass Vercel function payload limits
      const { successful, failed } = await uploadFilesDirect(
        files,
        userId,
        {
          projectId,
          onFileComplete: (index, result) => {
            console.log(`[References] File ${index + 1}/${files.length} uploaded:`, result?.name);
          },
        }
      );

      if (failed.length > 0) {
        const failedNames = failed.map((f) => f.file.name).join(', ');
        console.error(`[References] ${failed.length} file(s) failed:`, failed);
        alert(`Some files failed to upload: ${failedNames}`);
      }

      // Create reference entries for each successfully uploaded file
      for (const fileData of successful) {
        if (!fileData) continue;

        // Get file type from file name/type
        const fileType = fileData.type?.startsWith('image/') ? 'image' :
                        fileData.type?.startsWith('video/') ? 'video' :
                        fileData.type?.startsWith('application/') ? 'document' : 'other';

        await referenceLibraryDb.create({
          project_id: projectId,
          user_id: userId,
          file_id: fileData.id,
          name: fileData.name || 'Untitled Reference',
          url: fileData.url,
          thumbnail_url: fileData.type?.startsWith('image/') ? fileData.url : undefined,
          reference_type: fileType,
          tags: [],
          approval_status: 'pending',
          metadata: {},
        });
      }

      // Reload references
      await loadReferences();
      onUpdate?.();

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      if (successful.length > 0) {
        console.log(`[References] Successfully uploaded ${successful.length} file(s)`);
      }
    } catch (err) {
      console.error('Failed to upload files:', err);
      alert(`Failed to upload files: ${(err as Error).message}`);
    } finally {
      setUploading(false);
    }
  };

  const filteredReferences = references.filter((ref) => {
    if (filter !== 'all' && ref.approval_status !== filter) return false;
    if (searchTerm && !ref.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    const colors = {
      approved: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
      needs_revision: 'bg-orange-100 text-orange-800',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="text-gray-600">Loading references...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="bg-white rounded-lg shadow">
        {/* Header */}
        <div className="border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">References</h2>
              <p className="text-sm text-gray-600 mt-1">
                Manage reference images and files for your project
              </p>
            </div>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*,.pdf,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : 'Add Reference'}
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-6 space-y-6">

      <div className="flex space-x-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search references..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {filteredReferences.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="mt-4 text-gray-600">No references found. Add your first reference to get started.</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : 'Add Your First Reference'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReferences.map((ref) => (
            <div key={ref.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-gray-200 rounded-t-lg relative overflow-hidden">
                {ref.thumbnail_url ? (
                  <img
                    src={ref.thumbnail_url}
                    alt={ref.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  {getStatusBadge(ref.approval_status)}
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-gray-900 truncate">{ref.name}</h3>
                {ref.reference_type && (
                  <p className="text-sm text-gray-600 mt-1 capitalize">{ref.reference_type}</p>
                )}

                {ref.tags && ref.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {ref.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                        {tag}
                      </span>
                    ))}
                    {ref.tags.length > 3 && (
                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                        +{ref.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-4 flex space-x-2">
                  {ref.approval_status !== 'approved' && (
                    <button
                      onClick={() => handleApprove(ref.id)}
                      className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                    >
                      Approve
                    </button>
                  )}
                  {ref.approval_status !== 'rejected' && ref.approval_status !== 'approved' && (
                    <button
                      onClick={() => handleReject(ref.id)}
                      className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                    >
                      Reject
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(ref.id)}
                    className="px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
        </div>
      </div>
    </div>
  );
}
