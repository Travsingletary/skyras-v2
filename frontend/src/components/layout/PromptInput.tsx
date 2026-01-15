'use client';

import { useState, useRef, useEffect } from 'react';

interface PromptInputProps {
  projectId: string;
  currentIntent: 'plan' | 'create' | 'finish' | 'release';
  onSubmit: (payload: { text: string; mode: string; intent: string; projectId: string; timestamp: string }) => void;
}

const MODES = [
  { id: 'brief', label: 'Brief' },
  { id: 'storyboard', label: 'Storyboard' },
  { id: 'voice', label: 'Voice' },
  { id: 'release', label: 'Release' },
  { id: 'debug', label: 'Debug' },
];

export function PromptInput({ projectId, currentIntent, onSubmit }: PromptInputProps) {
  const [text, setText] = useState('');
  const [selectedMode, setSelectedMode] = useState('brief');
  const [isFocused, setIsFocused] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    const payload = {
      text: text.trim(),
      mode: selectedMode,
      intent: currentIntent,
      projectId,
      timestamp: new Date().toISOString(),
    };

    // Structured console logging
    console.log('[PromptInput] Submit:', JSON.stringify(payload, null, 2));
    onSubmit(payload);
    setText('');
    
    // Collapse after submit if expanded
    if (isExpanded) {
      setIsExpanded(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    // Expand on focus if not already expanded
    if (!isExpanded && !isFocused) {
      setIsExpanded(true);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      if (isExpanded || isFocused || text) {
        textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`;
      } else {
        textareaRef.current.style.height = '40px';
      }
    }
  }, [text, isFocused, isExpanded]);

  return (
    <div className="border-t border-gray-200 p-4 bg-white">
      <form onSubmit={handleSubmit}>
        {/* Mode Chips */}
        <div className="flex gap-2 mb-3 flex-wrap">
          {MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setSelectedMode(mode.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                selectedMode === mode.id
                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                  : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {/* Input Area */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => {
              setIsFocused(true);
              setIsExpanded(true);
            }}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder=""
            className={`w-full px-4 py-2 pr-20 border rounded-lg resize-none transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              isExpanded || isFocused || text ? 'min-h-[100px]' : 'h-10'
            }`}
            rows={1}
          />
          <div className="absolute right-2 bottom-2 flex items-center gap-2">
            {/* Expand/Collapse button */}
            {!isFocused && (
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>
            )}
            {/* Submit button */}
            <button
              type="submit"
              disabled={!text.trim()}
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
