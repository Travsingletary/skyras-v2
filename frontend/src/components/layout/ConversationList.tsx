'use client';

import { useState } from 'react';

interface Message {
  id: string;
  role: 'user' | 'agent';
  text: string;
  reasoning?: string;
  timestamp: string;
}

const SAMPLE_MESSAGES: Message[] = [
  {
    id: '1',
    role: 'user',
    text: 'I need to create a storyboard for the opening scene',
    timestamp: new Date(Date.now() - 300000).toISOString(),
  },
  {
    id: '2',
    role: 'agent',
    text: 'I can help you generate storyboard frames for the opening scene. Based on your references, I suggest starting with a wide establishing shot.',
    reasoning: 'Analyzed project references and style card. Recommended wide shot for establishing context before transitioning to closer frames.',
    timestamp: new Date(Date.now() - 240000).toISOString(),
  },
  {
    id: '3',
    role: 'user',
    text: 'What about the color palette?',
    timestamp: new Date(Date.now() - 120000).toISOString(),
  },
  {
    id: '4',
    role: 'agent',
    text: 'Your approved style card shows a warm, muted palette with emphasis on earth tones. I can generate frames that match this aesthetic.',
    reasoning: 'Referenced approved style card ID: sc_123. Color palette extracted: #8B7355, #D4A574, #F5E6D3, #4A4A4A. Applying consistent application across frames.',
    timestamp: new Date(Date.now() - 60000).toISOString(),
  },
];

export function ConversationList() {
  const [expandedReasoning, setExpandedReasoning] = useState<Set<string>>(new Set());

  const toggleReasoning = (messageId: string) => {
    setExpandedReasoning((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
  };

  const handleAction = (action: string, messageId: string) => {
    console.log(`[ConversationList] Action clicked: ${action} for message ${messageId}`);
    // No-op for now
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {SAMPLE_MESSAGES.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[80%] rounded-lg p-3 ${
              message.role === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-900'
            }`}
          >
            <div className="text-sm mb-1">{message.text}</div>
            <div
              className={`text-xs ${
                message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
              }`}
            >
              {formatTimestamp(message.timestamp)}
            </div>

            {/* Agent Message Actions */}
            {message.role === 'agent' && (
              <div className="mt-3 pt-3 border-t border-gray-300 flex gap-2 flex-wrap">
                <button
                  onClick={() => handleAction('apply', message.id)}
                  className="px-2.5 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Apply
                </button>
                <button
                  onClick={() => handleAction('generate', message.id)}
                  className="px-2.5 py-1 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  Generate
                </button>
                <button
                  onClick={() => handleAction('compare', message.id)}
                  className="px-2.5 py-1 text-xs font-medium bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                >
                  Compare
                </button>
              </div>
            )}

            {/* Expandable Reasoning Section */}
            {message.role === 'agent' && message.reasoning && (
              <div className="mt-2">
                <button
                  onClick={() => toggleReasoning(message.id)}
                  className="text-xs text-gray-600 hover:text-gray-800 underline"
                >
                  {expandedReasoning.has(message.id) ? 'Hide' : 'View'} reasoning
                </button>
                {expandedReasoning.has(message.id) && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-700 border border-gray-200">
                    {message.reasoning}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
