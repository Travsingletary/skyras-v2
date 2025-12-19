'use client';

import { useState } from 'react';

interface WorkflowSuggestion {
  workflowType: string;
  title: string;
  description: string;
  agents: string[];
}

interface WorkflowSuggestionsProps {
  suggestions: WorkflowSuggestion[];
  onCreateWorkflow?: (suggestion: WorkflowSuggestion) => void;
}

export default function WorkflowSuggestions({
  suggestions,
  onCreateWorkflow,
}: WorkflowSuggestionsProps) {
  const [dismissed, setDismissed] = useState(false);

  if (suggestions.length === 0 || dismissed) {
    return null;
  }

  const getAgentEmoji = (agent: string): string => {
    const emojiMap: Record<string, string> = {
      marcus: '🎯',
      cassidy: '⚖️',
      letitia: '📚',
      giorgio: '🎬',
      jamal: '📢',
    };
    return emojiMap[agent] || '🤖';
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-blue-900">
            💡 Suggested Workflows
          </h3>
          <p className="text-xs text-blue-700 mt-1">
            Based on your uploaded files, here are some recommended workflows
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-blue-400 hover:text-blue-600 text-xs"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2">
        {suggestions.map((suggestion, index) => (
          <div
            key={index}
            className="bg-white rounded-lg p-3 border border-blue-100 hover:border-blue-300 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-zinc-900">
                  {suggestion.title}
                </h4>
                <p className="text-xs text-zinc-600 mt-1">
                  {suggestion.description}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  {suggestion.agents.map((agent, idx) => (
                    <span
                      key={idx}
                      className="text-lg"
                      title={agent}
                    >
                      {getAgentEmoji(agent)}
                    </span>
                  ))}
                  <span className="text-xs text-zinc-500 ml-1">
                    {suggestion.agents.length} agent{suggestion.agents.length > 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {onCreateWorkflow && (
                <button
                  onClick={() => onCreateWorkflow(suggestion)}
                  className="ml-3 text-xs px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors whitespace-nowrap"
                >
                  Create →
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
