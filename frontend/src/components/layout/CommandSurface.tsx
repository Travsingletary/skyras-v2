'use client';

import { ConversationList } from './ConversationList';
import { PromptInput } from './PromptInput';
import { ShortcutButtons } from './ShortcutButtons';

interface CommandSurfaceProps {
  projectId: string;
  currentIntent: 'plan' | 'create' | 'finish' | 'release';
}

export function CommandSurface({ projectId, currentIntent }: CommandSurfaceProps) {
  const handleSubmit = (payload: {
    text: string;
    mode: string;
    intent: string;
    projectId: string;
    timestamp: string;
  }) => {
    // Structured console logging with required format
    const logPayload = {
      text: payload.text,
      mode: payload.mode,
      intent: payload.intent,
      projectId: payload.projectId,
      timestamp: payload.timestamp,
    };
    console.log('[CommandSurface] Submit:', JSON.stringify(logPayload, null, 2));
    // No-op: conversation list remains static, no agent calls
  };

  const handleShortcutClick = (shortcut: string) => {
    // No-op for now
    console.log('[CommandSurface] Shortcut clicked:', shortcut);
  };

  return (
    <div className="flex flex-col h-full bg-white border-t border-gray-200">
      {/* Conversation List */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ConversationList />
      </div>

      {/* Shortcut Buttons */}
      <ShortcutButtons onShortcutClick={handleShortcutClick} />

      {/* Prompt Input */}
      <PromptInput
        projectId={projectId}
        currentIntent={currentIntent}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
