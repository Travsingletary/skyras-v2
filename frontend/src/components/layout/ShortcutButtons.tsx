'use client';

interface ShortcutButtonsProps {
  onShortcutClick: (shortcut: string) => void;
}

const SHORTCUTS = [
  { id: 'refine', label: 'Refine this' },
  { id: 'brainstorm', label: 'Brainstorm' },
  { id: 'summarize', label: 'Summarize' },
  { id: 'ask-why', label: 'Ask why' },
];

export function ShortcutButtons({ onShortcutClick }: ShortcutButtonsProps) {
  const handleClick = (shortcutId: string) => {
    console.log(`[ShortcutButtons] Shortcut clicked: ${shortcutId}`);
    onShortcutClick(shortcutId);
    // No-op for now
  };

  return (
    <div className="flex gap-2 px-4 pb-2 flex-wrap">
      {SHORTCUTS.map((shortcut) => (
        <button
          key={shortcut.id}
          onClick={() => handleClick(shortcut.id)}
          className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors border border-gray-200"
        >
          {shortcut.label}
        </button>
      ))}
    </div>
  );
}
