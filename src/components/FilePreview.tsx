'use client';

import { useState } from 'react';

interface UploadedFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  processingCount?: number;
}

interface FilePreviewProps {
  files: UploadedFile[];
  onRemove?: (fileId: string) => void;
}

export default function FilePreview({ files, onRemove }: FilePreviewProps) {
  const [expandedFile, setExpandedFile] = useState<string | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (type: string): string => {
    if (type.startsWith('audio/')) return '🎵';
    if (type.startsWith('video/')) return '🎬';
    if (type.startsWith('image/')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    return '📎';
  };

  const renderPreview = (file: UploadedFile) => {
    if (file.type.startsWith('image/')) {
      return (
        <img
          src={file.url}
          alt={file.name}
          className="max-w-full max-h-64 rounded-lg object-contain"
        />
      );
    }

    if (file.type.startsWith('audio/')) {
      return (
        <audio controls className="w-full max-w-md">
          <source src={file.url} type={file.type} />
          Your browser does not support audio playback.
        </audio>
      );
    }

    if (file.type.startsWith('video/')) {
      return (
        <video controls className="w-full max-w-2xl max-h-96 rounded-lg">
          <source src={file.url} type={file.type} />
          Your browser does not support video playback.
        </video>
      );
    }

    return (
      <a
        href={file.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 underline"
      >
        Open file in new tab →
      </a>
    );
  };

  if (files.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-700">
          Uploaded Files ({files.length})
        </h3>
      </div>

      <div className="space-y-2">
        {files.map((file) => (
          <div
            key={file.id}
            className="border border-zinc-200 rounded-lg bg-white hover:bg-zinc-50 transition-colors"
          >
            {/* File Header */}
            <div
              className="p-3 cursor-pointer flex items-center justify-between"
              onClick={() => setExpandedFile(expandedFile === file.id ? null : file.id)}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-2xl flex-shrink-0">{getFileIcon(file.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {formatFileSize(file.size)}
                    {file.processingCount !== undefined && file.processingCount > 0 && (
                      <span className="ml-2 text-blue-600">
                        • {file.processingCount} processing {file.processingCount === 1 ? 'job' : 'jobs'}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onRemove && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(file.id);
                    }}
                    className="text-xs text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50"
                  >
                    Remove
                  </button>
                )}
                <span className="text-zinc-400">
                  {expandedFile === file.id ? '▼' : '▶'}
                </span>
              </div>
            </div>

            {/* File Preview (when expanded) */}
            {expandedFile === file.id && (
              <div className="px-3 pb-3 border-t border-zinc-100 pt-3">
                {renderPreview(file)}
                <div className="mt-3 flex gap-2">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Open in new tab
                  </a>
                  <a
                    href={file.url}
                    download={file.name}
                    className="text-xs px-3 py-1.5 bg-zinc-100 text-zinc-700 rounded hover:bg-zinc-200 transition-colors"
                  >
                    Download
                  </a>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
