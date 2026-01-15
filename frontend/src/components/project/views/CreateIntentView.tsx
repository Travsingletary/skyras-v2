'use client';

import { useEffect, useState } from 'react';
import { styleCardsDb, referenceLibraryDb } from '@/lib/database';
import { checkProjectGateStatus } from '@/lib/gateStatus';
import type { StyleCard, ReferenceLibrary, StyleCardInsert, ReferenceLibraryInsert, ApprovalStatus } from '@/types/database';
import type { ProjectGateStatus } from '@/lib/gateStatus';

interface CreateIntentViewProps {
  projectId: string;
  userId: string;
  onUpdate?: () => void;
}

type ActiveTab = 'references' | 'style-cards';

export function CreateIntentView({ projectId, userId, onUpdate }: CreateIntentViewProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('references');
  const [gateStatus, setGateStatus] = useState<ProjectGateStatus | null>(null);

  // Style Cards state
  const [styleCards, setStyleCards] = useState<StyleCard[]>([]);
  const [approvedCard, setApprovedCard] = useState<StyleCard | null>(null);
  const [styleCardsLoading, setStyleCardsLoading] = useState(true);
  const [showStyleCardForm, setShowStyleCardForm] = useState(false);
  const [editingStyleCard, setEditingStyleCard] = useState<StyleCard | null>(null);
  const [styleCardError, setStyleCardError] = useState<string | null>(null);

  // References state
  const [references, setReferences] = useState<ReferenceLibrary[]>([]);
  const [referencesLoading, setReferencesLoading] = useState(true);
  const [showReferenceForm, setShowReferenceForm] = useState(false);
  const [referenceFilter, setReferenceFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [referenceSearchTerm, setReferenceSearchTerm] = useState('');

  useEffect(() => {
    loadGateStatus();
    loadStyleCards();
    loadReferences();
  }, [projectId]);

  const loadGateStatus = async () => {
    try {
      const status = await checkProjectGateStatus(projectId);
      setGateStatus(status);
    } catch (err) {
      console.error('Failed to load gate status:', err);
    }
  };

  const loadStyleCards = async () => {
    try {
      setStyleCardsLoading(true);
      const cards = await styleCardsDb.getByProjectId(projectId);
      const approved = await styleCardsDb.getApprovedByProjectId(projectId);
      setStyleCards(cards);
      setApprovedCard(approved);
    } catch (err) {
      console.error('Failed to load style cards:', err);
    } finally {
      setStyleCardsLoading(false);
    }
  };

  const loadReferences = async () => {
    try {
      setReferencesLoading(true);
      const refs = await referenceLibraryDb.getByProjectId(projectId);
      setReferences(refs);
    } catch (err) {
      console.error('Failed to load references:', err);
    } finally {
      setReferencesLoading(false);
    }
  };

  const handleDataUpdate = async () => {
    await Promise.all([loadGateStatus(), loadStyleCards(), loadReferences()]);
    onUpdate?.();
  };

  // Style Card handlers
  const handleCreateStyleCard = async (formData: {
    name: string;
    description?: string;
    visual_references: string[];
    color_palette?: string[];
    typography?: Record<string, any>;
    mood_board?: string[];
  }) => {
    try {
      setStyleCardError(null);
      const newCard: StyleCardInsert = {
        project_id: projectId,
        user_id: userId,
        name: formData.name,
        description: formData.description,
        visual_references: formData.visual_references || [],
        color_palette: formData.color_palette || [],
        typography: formData.typography || {},
        mood_board: formData.mood_board || [],
        approval_status: 'pending',
        is_locked: false,
        metadata: {},
      };
      await styleCardsDb.create(newCard);
      setShowStyleCardForm(false);
      await handleDataUpdate();
    } catch (err: any) {
      console.error('Failed to create style card:', err);
      setStyleCardError(err.message || 'Failed to create style card');
    }
  };

  const handleUpdateStyleCard = async (id: string, updates: {
    name?: string;
    description?: string;
    visual_references?: string[];
    color_palette?: string[];
    typography?: Record<string, any>;
    mood_board?: string[];
  }) => {
    try {
      setStyleCardError(null);
      await styleCardsDb.update(id, updates);
      setEditingStyleCard(null);
      await handleDataUpdate();
    } catch (err: any) {
      console.error('Failed to update style card:', err);
      setStyleCardError(err.message || 'Failed to update style card');
    }
  };

  const handleApproveStyleCard = async (id: string) => {
    try {
      await styleCardsDb.approve(id, userId);
      await handleDataUpdate();
    } catch (err: any) {
      console.error('Failed to approve style card:', err);
      alert(err.message || 'Failed to approve style card. Only one style card can be approved per project.');
    }
  };

  const handleRejectStyleCard = async (id: string) => {
    try {
      await styleCardsDb.reject(id);
      await handleDataUpdate();
    } catch (err) {
      console.error('Failed to reject style card:', err);
    }
  };

  const handleDeleteStyleCard = async (id: string) => {
    if (!confirm('Are you sure you want to delete this style card?')) return;
    try {
      await styleCardsDb.softDelete(id);
      await handleDataUpdate();
    } catch (err) {
      console.error('Failed to delete style card:', err);
    }
  };

  // Reference handlers
  const handleCreateReference = async (formData: {
    name: string;
    url?: string;
    tags: string[];
    notes?: string;
    reference_type?: string;
  }) => {
    try {
      const newRef: ReferenceLibraryInsert = {
        project_id: projectId,
        user_id: userId,
        name: formData.name,
        url: formData.url,
        tags: formData.tags || [],
        notes: formData.notes,
        reference_type: formData.reference_type || 'image',
        approval_status: 'pending',
        metadata: {},
      };
      await referenceLibraryDb.create(newRef);
      setShowReferenceForm(false);
      await handleDataUpdate();
    } catch (err) {
      console.error('Failed to create reference:', err);
    }
  };

  const handleApproveReference = async (id: string) => {
    try {
      await referenceLibraryDb.approve(id, userId);
      await handleDataUpdate();
    } catch (err) {
      console.error('Failed to approve reference:', err);
    }
  };

  const handleRejectReference = async (id: string) => {
    try {
      await referenceLibraryDb.reject(id);
      await handleDataUpdate();
    } catch (err) {
      console.error('Failed to reject reference:', err);
    }
  };

  const handleDeleteReference = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reference?')) return;
    try {
      await referenceLibraryDb.softDelete(id);
      await handleDataUpdate();
    } catch (err) {
      console.error('Failed to delete reference:', err);
    }
  };

  const filteredReferences = references.filter((ref) => {
    if (referenceFilter !== 'all' && ref.approval_status !== referenceFilter) return false;
    if (referenceSearchTerm && !ref.name.toLowerCase().includes(referenceSearchTerm.toLowerCase())) return false;
    return true;
  });

  const getStatusBadge = (status: ApprovalStatus) => {
    const colors = {
      approved: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
      needs_revision: 'bg-orange-100 text-orange-800',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="p-8 space-y-6">
      {/* Gate Status Banner */}
      {gateStatus && gateStatus.status !== 'ready' && (
        <div className={`p-4 rounded-lg border ${
          gateStatus.status === 'blocked' 
            ? 'bg-red-50 border-red-200 text-red-800' 
            : 'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <div className="flex items-start">
            <svg className="w-5 h-5 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="font-medium">{gateStatus.blockedReason}</p>
              {gateStatus.nextAction && (
                <p className="text-sm mt-1 opacity-90">
                  {gateStatus.nextAction}
                  {!gateStatus.hasApprovedStyleCard && (
                    <button
                      onClick={() => setActiveTab('style-cards')}
                      className="ml-2 underline hover:no-underline"
                    >
                      Go to Style Cards →
                    </button>
                  )}
                  {gateStatus.approvedReferenceCount === 0 && (
                    <button
                      onClick={() => setActiveTab('references')}
                      className="ml-2 underline hover:no-underline"
                    >
                      Go to References →
                    </button>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            data-testid="create-tab-references"
            onClick={() => setActiveTab('references')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'references'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Reference Library
            {gateStatus && (
              <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                gateStatus.approvedReferenceCount > 0
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {gateStatus.approvedReferenceCount} approved
              </span>
            )}
          </button>
          <button
            data-testid="create-tab-stylecards"
            onClick={() => setActiveTab('style-cards')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'style-cards'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Style Cards
            {gateStatus && (
              <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                gateStatus.hasApprovedStyleCard
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {gateStatus.hasApprovedStyleCard ? 'Approved' : 'Pending'}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* References Tab */}
      {activeTab === 'references' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Reference Library</h2>
              <p className="text-sm text-gray-600 mt-1">
                Add and manage reference images and files for your project
              </p>
            </div>
            <button
              data-testid="references-add-button"
              onClick={() => setShowReferenceForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Reference
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search references..."
                value={referenceSearchTerm}
                onChange={(e) => setReferenceSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={referenceFilter}
              onChange={(e) => setReferenceFilter(e.target.value as typeof referenceFilter)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Reference Form Modal */}
          {showReferenceForm && (
            <div data-testid="references-form">
              <ReferenceFormModal
                onClose={() => setShowReferenceForm(false)}
                onSubmit={handleCreateReference}
              />
            </div>
          )}

          {/* References List */}
          {referencesLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-600">Loading references...</div>
            </div>
          ) : filteredReferences.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="mt-4 text-gray-600">No references found. Add your first reference to get started.</p>
              <button
                onClick={() => setShowReferenceForm(true)}
                className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Your First Reference
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
                    ) : ref.url ? (
                      <img
                        src={ref.url}
                        alt={ref.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
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
                    {ref.notes && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{ref.notes}</p>
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
                          data-testid="references-approve-first"
                          onClick={() => handleApproveReference(ref.id)}
                          className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                        >
                          Approve
                        </button>
                      )}
                      {ref.approval_status !== 'rejected' && ref.approval_status !== 'approved' && (
                        <button
                          onClick={() => handleRejectReference(ref.id)}
                          className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                        >
                          Reject
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteReference(ref.id)}
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
      )}

      {/* Style Cards Tab */}
      {activeTab === 'style-cards' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Style Cards</h2>
              <p className="text-sm text-gray-600 mt-1">
                Define the visual style and mood for your project
              </p>
              {approvedCard && (
                <div className="mt-2 inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Style Card Approved & Locked
                </div>
              )}
            </div>
            {!approvedCard && (
              <button
                data-testid="stylecards-create-button"
                onClick={() => setShowStyleCardForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Style Card
              </button>
            )}
          </div>

          {approvedCard && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                Only one Style Card can be approved per project. The approved card is locked and cannot be edited. To change the style, you must reject the current card and create a new one.
              </p>
            </div>
          )}

          {/* Style Card Form Modal */}
          {showStyleCardForm && (
            <StyleCardFormModal
              onClose={() => {
                setShowStyleCardForm(false);
                setStyleCardError(null);
              }}
              onSubmit={handleCreateStyleCard}
              error={styleCardError}
            />
          )}

          {editingStyleCard && (
            <StyleCardFormModal
              card={editingStyleCard}
              onClose={() => {
                setEditingStyleCard(null);
                setStyleCardError(null);
              }}
              onSubmit={(data) => handleUpdateStyleCard(editingStyleCard.id, data)}
              error={styleCardError}
            />
          )}

          {/* Style Cards List */}
          {styleCardsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-600">Loading style cards...</div>
            </div>
          ) : styleCards.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              <p className="mt-4 text-gray-600">No style cards yet. Create your first style card to define the visual direction.</p>
              <button
                onClick={() => setShowStyleCardForm(true)}
                className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Your First Style Card
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {styleCards.map((card) => (
                <div key={card.id} className={`bg-white rounded-lg shadow p-6 ${card.is_locked ? 'border-2 border-green-500' : ''}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-gray-900">{card.name}</h3>
                        {getStatusBadge(card.approval_status)}
                        {card.is_locked && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                            Locked
                          </span>
                        )}
                      </div>
                      {card.description && (
                        <p className="mt-2 text-sm text-gray-600">{card.description}</p>
                      )}
                    </div>

                    {!card.is_locked && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingStyleCard(card)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                        >
                          Edit
                        </button>
                        {card.approval_status !== 'approved' && (
                          <button
                            data-testid="stylecards-approve-first"
                            onClick={() => handleApproveStyleCard(card.id)}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                          >
                            Approve & Lock
                          </button>
                        )}
                        {card.approval_status !== 'rejected' && (
                          <button
                            onClick={() => handleRejectStyleCard(card.id)}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                          >
                            Reject
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteStyleCard(card.id)}
                          className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Visual References:</span>
                      <span className="ml-2 font-medium text-gray-900">{card.visual_references.length}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Color Palette:</span>
                      <span className="ml-2 font-medium text-gray-900">{card.color_palette?.length || 0} colors</span>
                    </div>
                  </div>

                  {card.approved_at && (
                    <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-600">
                      Approved on {new Date(card.approved_at).toLocaleDateString()} by {card.approved_by}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Reference Form Modal Component
function ReferenceFormModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (data: { name: string; url?: string; tags: string[]; notes?: string; reference_type?: string }) => void;
}) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');
  const [referenceType, setReferenceType] = useState('image');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      const tagsArray = tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
      await onSubmit({
        name: name.trim(),
        url: url.trim() || undefined,
        tags: tagsArray,
        notes: notes.trim() || undefined,
        reference_type: referenceType,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Add Reference</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Reference name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={referenceType}
              onChange={(e) => setReferenceType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="image">Image</option>
              <option value="video">Video</option>
              <option value="document">Document</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="tag1, tag2, tag3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional notes about this reference..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating...' : 'Create Reference'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Style Card Form Modal Component
function StyleCardFormModal({
  card,
  onClose,
  onSubmit,
  error,
}: {
  card?: StyleCard;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description?: string;
    visual_references: string[];
    color_palette?: string[];
    typography?: Record<string, any>;
    mood_board?: string[];
  }) => void;
  error?: string | null;
}) {
  const [name, setName] = useState(card?.name || '');
  const [description, setDescription] = useState(card?.description || '');
  const [visualReferences, setVisualReferences] = useState(card?.visual_references.join(', ') || '');
  const [colorPalette, setColorPalette] = useState(card?.color_palette?.join(', ') || '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      const visualRefsArray = visualReferences.split(',').map(r => r.trim()).filter(r => r.length > 0);
      const colorPaletteArray = colorPalette.split(',').map(c => c.trim()).filter(c => c.length > 0);
      
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        visual_references: visualRefsArray,
        color_palette: colorPaletteArray.length > 0 ? colorPaletteArray : undefined,
        typography: card?.typography || {},
        mood_board: card?.mood_board || [],
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              {card ? 'Edit Style Card' : 'Create Style Card'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Style Card name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the visual style and mood..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Visual References (comma-separated URLs)
            </label>
            <input
              type="text"
              value={visualReferences}
              onChange={(e) => setVisualReferences(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color Palette (comma-separated)
            </label>
            <input
              type="text"
              value={colorPalette}
              onChange={(e) => setColorPalette(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="#FF0000, #00FF00, #0000FF"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (card ? 'Updating...' : 'Creating...') : (card ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
