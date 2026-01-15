'use client';

interface AgentRecommendation {
  id: string;
  agent: string;
  recommendation: string;
  reasoning: string;
  actionable: boolean;
}

interface AgentRecommendationsPanelProps {
  projectId: string;
  currentIntent?: string;
  currentStep?: string;
}

export function AgentRecommendationsPanel({ 
  projectId, 
  currentIntent, 
  currentStep 
}: AgentRecommendationsPanelProps) {
  // Static placeholder recommendations
  // In the future, these would come from real agent analysis
  const placeholderRecommendations: AgentRecommendation[] = [
    {
      id: '1',
      agent: 'Atlas',
      recommendation: 'Review project gate status',
      reasoning: 'Ensure all required gates are passed before proceeding',
      actionable: true,
    },
    {
      id: '2',
      agent: 'Giorgio',
      recommendation: 'Add approved references',
      reasoning: 'References help establish visual direction for your project',
      actionable: true,
    },
  ];

  const handleApply = (recommendationId: string) => {
    // No-op for now - buttons do nothing
    console.log('Apply clicked for recommendation:', recommendationId);
  };

  const handleShowReasoning = (recommendationId: string) => {
    // No-op for now - buttons do nothing
    console.log('Reasoning clicked for recommendation:', recommendationId);
  };

  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Agent Recommendations</h3>
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {placeholderRecommendations.length === 0 ? (
          <div className="text-xs text-gray-500 py-4 text-center">
            No recommendations available
          </div>
        ) : (
          placeholderRecommendations.map((rec) => (
            <div
              key={rec.id}
              className="bg-blue-50 rounded-lg p-3 border border-blue-200"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="text-xs font-semibold text-blue-900 mb-1">
                    {rec.agent}
                  </div>
                  <div className="text-sm text-gray-900 mb-1">{rec.recommendation}</div>
                  <div className="text-xs text-gray-600 mt-1">{rec.reasoning}</div>
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleApply(rec.id)}
                  disabled={!rec.actionable}
                  className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                    rec.actionable
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Apply
                </button>
                <button
                  onClick={() => handleShowReasoning(rec.id)}
                  className="flex-1 px-2 py-1 text-xs rounded border border-blue-300 text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  Reasoning
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="mt-2 text-xs text-gray-400 italic">
        Recommendations are static placeholders. Real agent analysis coming soon.
      </div>
    </div>
  );
}
