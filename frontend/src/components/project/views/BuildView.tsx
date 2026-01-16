'use client';

import { useEffect, useState } from 'react';
import { styleCardsDb, storyboardFramesDb } from '@/lib/database';
import { checkProjectGateStatus } from '@/lib/gateStatus';
import type { StyleCard, StoryboardFrame } from '@/types/database';
import { NanoBananaControls } from '@/components/NanoBananaControls';

interface BuildViewProps {
  projectId: string;
  userId: string;
  onContinue: () => void;
  onUpdate?: () => void;
}

export function BuildView({ projectId, userId, onContinue, onUpdate }: BuildViewProps) {
  const [styleCards, setStyleCards] = useState<StyleCard[]>([]);
  const [approvedStyleCard, setApprovedStyleCard] = useState<StyleCard | null>(null);
  const [frames, setFrames] = useState<StoryboardFrame[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingStyleCard, setEditingStyleCard] = useState<StyleCard | null>(null);
  const [styleCardForm, setStyleCardForm] = useState({
    name: '',
    description: '',
    visual_references: '',
    color_palette: '',
    typography: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [gateStatus, setGateStatus] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load style cards
      const cards = await styleCardsDb.getByProjectId(projectId);
      const approved = await styleCardsDb.getApprovedByProjectId(projectId);
      setStyleCards(cards);
      setApprovedStyleCard(approved);

      // Load storyboard frames
      const framesData = await storyboardFramesDb.getByProjectId(projectId);
      setFrames(framesData);

      // Load gate status
      const status = await checkProjectGateStatus(projectId);
      setGateStatus(status);
    } catch (err) {
      console.error('Failed to load build data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStyleCard = async () => {
    try {
      setCreating(true);
      setError(null);
      
      // Validate required fields
      if (!styleCardForm.name.trim()) {
        setError('Style Card name is required');
        return;
      }

      const visualRefs = styleCardForm.visual_references
        .split(',')
        .map(ref => ref.trim())
        .filter(ref => ref.length > 0);
      
      const colorPalette = styleCardForm.color_palette
        .split(',')
        .map(color => color.trim())
        .filter(color => color.length > 0);

      const typography = styleCardForm.typography.trim()
        ? { primary: styleCardForm.typography.trim() }
        : undefined;

      const cardData: any = {
        project_id: projectId,
        user_id: userId,
        name: styleCardForm.name.trim(),
        description: styleCardForm.description.trim() || undefined,
        visual_references: visualRefs,
        approval_status: 'pending',
        is_locked: false,
        metadata: {},
      };

      if (colorPalette.length > 0) {
        cardData.color_palette = colorPalette;
      }

      if (typography) {
        cardData.typography = typography;
      }
      
      if (editingStyleCard) {
        // Update existing card
        await styleCardsDb.update(editingStyleCard.id, cardData);
      } else {
        // Create new card
        await styleCardsDb.create(cardData);
      }
      
      // Reset form
      setStyleCardForm({
        name: '',
        description: '',
        visual_references: '',
        color_palette: '',
        typography: '',
      });
      setEditingStyleCard(null);
      
      await loadData();
      onUpdate?.();
    } catch (err) {
      console.error('Failed to save style card:', err);
      setError('Failed to save style card. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleEditStyleCard = (card: StyleCard) => {
    setEditingStyleCard(card);
    setStyleCardForm({
      name: card.name,
      description: card.description || '',
      visual_references: card.visual_references.join(', '),
      color_palette: card.color_palette?.join(', ') || '',
      typography: card.typography?.primary || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingStyleCard(null);
    setStyleCardForm({
      name: '',
      description: '',
      visual_references: '',
      color_palette: '',
      typography: '',
    });
  };

  const handleApproveStyleCard = async (id: string) => {
    try {
      setError(null);
      await styleCardsDb.approve(id, userId);
      await loadData();
      onUpdate?.();
    } catch (err) {
      console.error('Failed to approve style card:', err);
      setError('Failed to approve style card. Please try again.');
    }
  };

  const handleApproveFrame = async (frameId: string) => {
    try {
      setError(null);
      await storyboardFramesDb.approve(frameId, userId);
      await loadData();
      onUpdate?.();
    } catch (err) {
      console.error('Failed to approve frame:', err);
      setError('Failed to approve frame. Please try again.');
    }
  };

  const handleNeedsChanges = async (frameId: string) => {
    try {
      setError(null);
      await storyboardFramesDb.needsRevision(frameId, 'Needs changes');
      await loadData();
      onUpdate?.();
    } catch (err) {
      console.error('Failed to mark frame as needs changes:', err);
      setError('Failed to update frame. Please try again.');
    }
  };

  const handleContinue = async () => {
    // Validation
    if (!approvedStyleCard) {
      setError('Please approve a Style Card to continue');
      return;
    }

    if (frames.length > 0) {
      const allApproved = frames.every(f => f.approval_status === 'approved');
      if (!allApproved) {
        setError('Please approve all storyboard frames to continue');
        return;
      }
    }

    // Continue to Step 4
    onContinue();
  };

  // Calculate frame counts
  const approvedFrameCount = frames.filter(f => f.approval_status === 'approved').length;
  const totalFrameCount = frames.length;
  const allFramesApproved = totalFrameCount > 0 && approvedFrameCount === totalFrameCount;
  
  // Can continue?
  const canContinue = approvedStyleCard && (totalFrameCount === 0 || allFramesApproved);

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              Step 3
            </span>
            <h1 className="text-3xl font-bold text-gray-900">Build</h1>
          </div>
          <p className="text-gray-600 mt-2">
            Define visual style and create storyboard frames.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Part 1: Style Card */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Part 1: Style Card</h2>
          
          {approvedStyleCard ? (
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{approvedStyleCard.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">Style Card Approved & Locked</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  Approved
                </span>
              </div>
              {approvedStyleCard.description && (
                <p className="text-sm text-gray-700 mb-2">{approvedStyleCard.description}</p>
              )}
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Visual References:</span>
                  <span className="ml-2 font-medium text-gray-900">{approvedStyleCard.visual_references.length}</span>
                </div>
                <div>
                  <span className="text-gray-600">Color Palette:</span>
                  <span className="ml-2 font-medium text-gray-900">{approvedStyleCard.color_palette?.length || 0} colors</span>
                </div>
              </div>
            </div>
          ) : styleCards.length === 0 || editingStyleCard ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingStyleCard ? 'Edit Style Card' : 'Create Style Card'}
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={styleCardForm.name}
                  onChange={(e) => setStyleCardForm({ ...styleCardForm, name: e.target.value })}
                  placeholder="Style Card name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={styleCardForm.description}
                  onChange={(e) => setStyleCardForm({ ...styleCardForm, description: e.target.value })}
                  placeholder="Short description of visual style"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visual References (comma-separated URLs)
                </label>
                <input
                  type="text"
                  value={styleCardForm.visual_references}
                  onChange={(e) => setStyleCardForm({ ...styleCardForm, visual_references: e.target.value })}
                  placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color Palette (comma-separated)
                </label>
                <input
                  type="text"
                  value={styleCardForm.color_palette}
                  onChange={(e) => setStyleCardForm({ ...styleCardForm, color_palette: e.target.value })}
                  placeholder="#FF5733, #33FF57, #3357FF"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Typography (primary font)
                </label>
                <input
                  type="text"
                  value={styleCardForm.typography}
                  onChange={(e) => setStyleCardForm({ ...styleCardForm, typography: e.target.value })}
                  placeholder="Arial, Helvetica, sans-serif"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCreateStyleCard}
                  disabled={creating || !styleCardForm.name.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Saving...' : editingStyleCard ? 'Save Changes' : 'Create Style Card'}
                </button>
                {editingStyleCard && (
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {styleCards.map((card) => (
                <div key={card.id} className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{card.name}</h3>
                        {card.approval_status === 'pending' && (
                          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                            Pending
                          </span>
                        )}
                        {card.approval_status === 'rejected' && (
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                            Needs Changes
                          </span>
                        )}
                      </div>
                      {card.description && (
                        <p className="text-sm text-gray-600 mb-2">{card.description}</p>
                      )}
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
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    {card.approval_status !== 'approved' && (
                      <>
                        <button
                          onClick={() => handleEditStyleCard(card)}
                          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleApproveStyleCard(card.id)}
                          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          Approve Style & Lock Direction
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              
              {!editingStyleCard && (
                <button
                  onClick={() => setEditingStyleCard(null)}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
                >
                  + Create Another Style Card
                </button>
              )}
            </div>
          )}
        </div>

        {/* Part 2: Storyboard */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Part 2: Storyboard</h2>
          
          {!approvedStyleCard ? (
            <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p className="text-gray-600 font-medium">Approve Style Card to unlock Storyboard</p>
            </div>
          ) : frames.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8">
              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  Storyboard frames visualize your structure and pacing before final video generation. 
                  Generate frames to preview your project flow.
                </p>
              </div>
              <NanoBananaControls projectId={projectId} onGenerate={loadData} />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Generation Controls */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <NanoBananaControls projectId={projectId} onGenerate={loadData} />
              </div>

              {/* Progress Indicator */}
              {totalFrameCount > 0 && (
                <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <span className="text-sm font-medium text-blue-900">
                    Progress: {approvedFrameCount}/{totalFrameCount} frames approved
                  </span>
                  {allFramesApproved && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      ✓ All Approved
                    </span>
                  )}
                </div>
              )}

              {/* Frames Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {frames.map((frame) => {
                  const isApproved = frame.approval_status === 'approved';
                  const needsChanges = frame.approval_status === 'needs_revision' || frame.approval_status === 'rejected';
                  
                  return (
                    <div
                      key={frame.id}
                      className={`border rounded-lg overflow-hidden ${
                        isApproved ? 'border-green-500 bg-green-50' : needsChanges ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white'
                      }`}
                    >
                      {frame.image_url && (
                        <img
                          src={frame.image_url}
                          alt={`Frame ${frame.frame_number}`}
                          className="w-full h-48 object-cover"
                        />
                      )}
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-900">
                            Frame {frame.frame_number}
                          </span>
                          {isApproved ? (
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                              ✓ Approved
                            </span>
                          ) : needsChanges ? (
                            <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                              ✗ Needs Changes
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                              Pending
                            </span>
                          )}
                        </div>
                        {frame.description && (
                          <p className="text-xs text-gray-600 mb-3">{frame.description}</p>
                        )}
                        <div className="flex gap-2">
                          {!isApproved && (
                            <button
                              onClick={() => handleApproveFrame(frame.id)}
                              className="flex-1 px-3 py-2 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                            >
                              Approve
                            </button>
                          )}
                          {!needsChanges && !isApproved && (
                            <button
                              onClick={() => handleNeedsChanges(frame.id)}
                              className="flex-1 px-3 py-2 text-xs font-medium bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                            >
                              Needs Changes
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="pt-6 border-t border-gray-200">
          {!approvedStyleCard ? (
            <button
              disabled
              className="w-full px-6 py-3 bg-gray-300 text-gray-600 rounded-lg font-medium cursor-not-allowed"
              title="Approve Style Card to continue"
            >
              Approve Style & Lock Direction
            </button>
          ) : totalFrameCount > 0 && !allFramesApproved ? (
            <button
              disabled
              className="w-full px-6 py-3 bg-gray-300 text-gray-600 rounded-lg font-medium cursor-not-allowed"
              title={`Approve all frames to continue (${approvedFrameCount}/${totalFrameCount} approved)`}
            >
              Continue to Step 4 ({approvedFrameCount}/{totalFrameCount} frames approved)
            </button>
          ) : (
            <button
            onClick={handleContinue}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Continue to Step 4: Review
          </button>
          )}
        </div>
      </div>
    </div>
  );
}
