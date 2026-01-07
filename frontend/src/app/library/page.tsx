'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Grid,
  List,
  Search,
  Filter,
  Download,
  Trash2,
  Play,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  RefreshCw,
  Calendar,
  HardDrive,
} from 'lucide-react';

type ViewMode = 'grid' | 'list';
type FileType = 'image' | 'video' | 'audio' | 'document' | 'all';
type SortBy = 'date' | 'name' | 'size' | 'type';

interface Asset {
  id: string;
  created_at: string;
  original_name: string;
  public_url: string;
  file_type: string;
  file_size: number;
  file_extension: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  metadata: Record<string, any>;
  project_id?: string;
}

export default function AssetLibraryPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [fileType, setFileType] = useState<FileType>('all');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  useEffect(() => {
    fetchAssets();
  }, []);

  useEffect(() => {
    filterAndSortAssets();
  }, [assets, fileType, sortBy, searchQuery]);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/files');
      const data = await response.json();
      if (data.success) {
        setAssets(data.data.files || []);
      }
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortAssets = () => {
    let filtered = [...assets];

    // Filter by file type
    if (fileType !== 'all') {
      filtered = filtered.filter((asset) => {
        const type = asset.file_type.split('/')[0];
        return type === fileType;
      });
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (asset) =>
          asset.original_name.toLowerCase().includes(query) ||
          asset.file_type.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'name':
          return a.original_name.localeCompare(b.original_name);
        case 'size':
          return b.file_size - a.file_size;
        case 'type':
          return a.file_type.localeCompare(b.file_type);
        default:
          return 0;
      }
    });

    setFilteredAssets(filtered);
  };

  const handleDelete = async (assetId: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;

    try {
      const response = await fetch(`/api/files/${assetId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setAssets(assets.filter((a) => a.id !== assetId));
        setSelectedAsset(null);
      }
    } catch (error) {
      console.error('Failed to delete asset:', error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFileIcon = (fileType: string) => {
    const type = fileType.split('/')[0];
    switch (type) {
      case 'image':
        return <ImageIcon className="h-5 w-5 text-blue-600" />;
      case 'video':
        return <Video className="h-5 w-5 text-purple-600" />;
      case 'audio':
        return <Music className="h-5 w-5 text-green-600" />;
      default:
        return <FileText className="h-5 w-5 text-zinc-600" />;
    }
  };

  const renderAssetPreview = (asset: Asset) => {
    const type = asset.file_type.split('/')[0];

    if (type === 'image') {
      return (
        <img
          src={asset.public_url}
          alt={asset.original_name}
          className="w-full h-full object-cover"
        />
      );
    } else if (type === 'video') {
      return (
        <div className="relative w-full h-full bg-zinc-900">
          <video
            src={asset.public_url}
            className="w-full h-full object-contain"
            controls
          />
        </div>
      );
    } else if (type === 'audio') {
      return (
        <div className="flex items-center justify-center h-full bg-gradient-to-br from-green-100 to-green-200">
          <Music className="h-16 w-16 text-green-600" />
        </div>
      );
    } else {
      return (
        <div className="flex items-center justify-center h-full bg-gradient-to-br from-zinc-100 to-zinc-200">
          <FileText className="h-16 w-16 text-zinc-600" />
        </div>
      );
    }
  };

  const renderGridView = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {filteredAssets.map((asset) => (
        <div
          key={asset.id}
          onClick={() => setSelectedAsset(asset)}
          className={`rounded-lg border-2 overflow-hidden cursor-pointer transition-all ${
            selectedAsset?.id === asset.id
              ? 'border-blue-600 shadow-lg'
              : 'border-zinc-200 hover:border-zinc-300'
          }`}
        >
          <div className="aspect-square relative bg-zinc-100">
            {renderAssetPreview(asset)}
          </div>
          <div className="p-3 bg-white">
            <p className="text-sm font-medium text-zinc-900 truncate">
              {asset.original_name}
            </p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-zinc-500">
                {formatFileSize(asset.file_size)}
              </span>
              {getFileIcon(asset.file_type)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="space-y-2">
      {filteredAssets.map((asset) => (
        <div
          key={asset.id}
          onClick={() => setSelectedAsset(asset)}
          className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
            selectedAsset?.id === asset.id
              ? 'border-blue-600 bg-blue-50'
              : 'border-zinc-200 bg-white hover:border-zinc-300'
          }`}
        >
          <div className="flex-shrink-0 w-16 h-16 rounded bg-zinc-100 overflow-hidden">
            {renderAssetPreview(asset)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-zinc-900 truncate">{asset.original_name}</p>
            <p className="text-sm text-zinc-500 mt-0.5">
              {asset.file_extension.toUpperCase()} • {formatFileSize(asset.file_size)}
            </p>
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="text-sm text-zinc-600">{formatDate(asset.created_at)}</p>
            <span
              className={`inline-block px-2 py-0.5 rounded text-xs mt-1 ${
                asset.processing_status === 'completed'
                  ? 'bg-green-100 text-green-700'
                  : asset.processing_status === 'processing'
                  ? 'bg-blue-100 text-blue-700'
                  : asset.processing_status === 'failed'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-zinc-100 text-zinc-700'
              }`}
            >
              {asset.processing_status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );

  const renderDetailPanel = () => {
    if (!selectedAsset) {
      return (
        <div className="flex items-center justify-center h-64 text-zinc-500">
          Select an asset to view details
        </div>
      );
    }

    const type = selectedAsset.file_type.split('/')[0];

    return (
      <div className="space-y-6">
        <div className="aspect-video rounded-lg overflow-hidden bg-zinc-100">
          {type === 'audio' ? (
            <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-green-100 to-green-200 p-6">
              <Music className="h-20 w-20 text-green-600 mb-4" />
              <audio
                src={selectedAsset.public_url}
                controls
                className="w-full max-w-md"
              />
            </div>
          ) : (
            renderAssetPreview(selectedAsset)
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold text-zinc-900 mb-4">
            {selectedAsset.original_name}
          </h3>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-zinc-500 mb-1">File Type</p>
              <p className="text-zinc-900 font-medium">{selectedAsset.file_type}</p>
            </div>
            <div>
              <p className="text-zinc-500 mb-1">Size</p>
              <p className="text-zinc-900 font-medium">
                {formatFileSize(selectedAsset.file_size)}
              </p>
            </div>
            <div>
              <p className="text-zinc-500 mb-1">Created</p>
              <p className="text-zinc-900 font-medium">
                {formatDate(selectedAsset.created_at)}
              </p>
            </div>
            <div>
              <p className="text-zinc-500 mb-1">Status</p>
              <span
                className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                  selectedAsset.processing_status === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : selectedAsset.processing_status === 'processing'
                    ? 'bg-blue-100 text-blue-700'
                    : selectedAsset.processing_status === 'failed'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-zinc-100 text-zinc-700'
                }`}
              >
                {selectedAsset.processing_status}
              </span>
            </div>
          </div>

          {selectedAsset.metadata && Object.keys(selectedAsset.metadata).length > 0 && (
            <div className="mt-4">
              <p className="text-zinc-500 text-sm mb-2">Metadata</p>
              <pre className="bg-zinc-100 rounded p-3 text-xs overflow-x-auto">
                {JSON.stringify(selectedAsset.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <a
            href={selectedAsset.public_url}
            download={selectedAsset.original_name}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
          >
            <Download className="h-4 w-4" />
            Download
          </a>
          <button
            onClick={() => handleDelete(selectedAsset.id)}
            className="px-4 py-2 rounded-lg border border-red-600 text-red-600 font-medium hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            href="/studio"
            className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Studio
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 mb-2">Asset Library</h1>
              <p className="text-zinc-600">
                {filteredAssets.length} of {assets.length} assets
              </p>
            </div>
            <button
              onClick={fetchAssets}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-300 hover:bg-zinc-50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={fileType}
              onChange={(e) => setFileType(e.target.value as FileType)}
              className="px-4 py-2 rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
              <option value="audio">Audio</option>
              <option value="document">Documents</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="px-4 py-2 rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">Date</option>
              <option value="name">Name</option>
              <option value="size">Size</option>
              <option value="type">Type</option>
            </select>

            <div className="flex rounded-lg border border-zinc-300 overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 ${
                  viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-zinc-700'
                }`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 border-l border-zinc-300 ${
                  viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-zinc-700'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
            <HardDrive className="h-12 w-12 mb-4" />
            <p>No assets found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {viewMode === 'grid' ? renderGridView() : renderListView()}
            </div>
            <div className="lg:col-span-1">
              <div className="sticky top-4 rounded-lg border border-zinc-200 bg-white p-6">
                {renderDetailPanel()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
