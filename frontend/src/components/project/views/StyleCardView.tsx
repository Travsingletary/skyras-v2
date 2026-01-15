'use client';

import { useEffect, useState } from 'react';
import { styleCardsDb } from '@/lib/database';
import type { StyleCard } from '@/types/database';

interface StyleCardViewProps {
  projectId: string;
  userId: string;
  onUpdate?: () => void;
}

export function StyleCardView({ projectId, userId, onUpdate }: StyleCardViewProps) {
  const [styleCards, setStyleCards] = useState<StyleCard[]>([]);
  const [approvedCard, setApprovedCard] = useState<StyleCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadStyleCards();
  }, [projectId]);

  const loadStyleCards = async () => {
    try {
      setLoading(true);
      const cards = await styleCardsDb.getByProjectId(projectId);
      const approved = await styleCardsDb.getApprovedByProjectId(projectId);
      setStyleCards(cards);
      setApprovedCard(approved);
    } catch (err) {
      console.error('Failed to load style cards:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      setCreating(true);
      const newCard = await styleCardsDb.create({
        project_id: projectId,
        user_id: userId,
        name: `Style Card ${styleCards.length + 1}`,
        visual_references: [],
        approval_status: 'pending',
        is_locked: false,
        metadata: {},
      });
      await loadStyleCards();
      onUpdate?.();
    } catch (err) {
      console.error('Failed to create style card:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await styleCardsDb.approve(id, userId);
      await loadStyleCards();
      onUpdate?.();
    } catch (err) {
      console.error('Failed to approve style card:', err);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await styleCardsDb.reject(id);
      await loadStyleCards();
      onUpdate?.();
    } catch (err) {
      console.error('Failed to reject style card:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this style card?')) return;

    try {
      await styleCardsDb.softDelete(id);
      await loadStyleCards();
      onUpdate?.();
    } catch (err) {
      console.error('Failed to delete style card:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="text-gray-600">Loading style cards...</div>
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
              <h2 className="text-2xl font-bold text-gray-900">Style Card</h2>
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
                onClick={handleCreate}
                disabled={creating}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating...' : 'Create Style Card'}
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-6 space-y-6">
          {approvedCard && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                Only one Style Card can be approved per project. The approved card is locked and cannot be edited. To change the style, you must reject the current card and create a new one.
              </p>
            </div>
          )}

      {styleCards.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
          <p className="mt-4 text-gray-600">No style cards yet. Create your first style card to define the visual direction.</p>
          <button
            onClick={handleCreate}
            disabled={creating}
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
                    {card.approval_status === 'approved' && (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                        Approved
                      </span>
                    )}
                    {card.approval_status === 'pending' && (
                      <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                        Pending
                      </span>
                    )}
                    {card.approval_status === 'rejected' && (
                      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                        Rejected
                      </span>
                    )}
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
                    {card.approval_status !== 'approved' && (
                      <button
                        onClick={() => handleApprove(card.id)}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                      >
                        Approve & Lock
                      </button>
                    )}
                    {card.approval_status !== 'rejected' && (
                      <button
                        onClick={() => handleReject(card.id)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                      >
                        Reject
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(card.id)}
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
      </div>
    </div>
  );
}
