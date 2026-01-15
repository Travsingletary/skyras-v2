import type { Intent } from '@/types/database';

interface IntentSelectorProps {
  currentIntent: Intent;
  onIntentChange: (intent: Intent) => void;
}

const INTENTS: { value: Intent; label: string; description: string }[] = [
  {
    value: 'create',
    label: 'Create',
    description: 'Build your content pipeline',
  },
  {
    value: 'finish',
    label: 'Finish',
    description: 'Polish and finalize',
  },
  {
    value: 'release',
    label: 'Release',
    description: 'Plan distribution',
  },
  {
    value: 'plan',
    label: 'Plan',
    description: 'Define strategy',
  },
];

export function IntentSelector({ currentIntent, onIntentChange }: IntentSelectorProps) {
  return (
    <div className="p-4 border-b border-gray-200">
      <div className="space-y-1">
        {INTENTS.map((intent) => (
          <button
            key={intent.value}
            data-testid={`intent-${intent.value}`}
            onClick={() => onIntentChange(intent.value)}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
              currentIntent === intent.value
                ? 'bg-blue-100 text-blue-900 font-medium'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <div className="text-sm font-medium">{intent.label}</div>
            <div className="text-xs text-gray-600 mt-0.5">{intent.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
