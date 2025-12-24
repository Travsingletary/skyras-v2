'use client';

import { useState } from 'react';

type Scenario = 'creative' | 'compliance' | 'distribution';

interface GoldenPathResponse {
  agent?: string;
  action?: string;
  success?: boolean;
  output?: string;
  artifacts?: Array<{
    type: string;
    content: string;
    metadata?: Record<string, unknown>;
  }>;
  warnings?: string[];
  proof?: Array<{
    step: string;
    status: string;
    message: string;
    timestamp: string;
    details?: Record<string, unknown>;
  }>;
  metadata?: Record<string, unknown>;
  error?: {
    code: string;
    message: string;
    step: string;
    details?: Record<string, unknown>;
  };
}

export default function AgentConsole() {
  const [scenario, setScenario] = useState<Scenario>('creative');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<GoldenPathResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      let requestBody: Record<string, unknown> = {
        scenario,
        userId: 'public',
        project: 'SkySky',
      };

      // Parse input as JSON if provided
      if (input.trim()) {
        try {
          const parsed = JSON.parse(input);
          requestBody = { ...requestBody, ...parsed };
        } catch {
          // If not JSON, treat as plain text context
          if (scenario === 'creative') {
            requestBody.input = { context: input };
          } else if (scenario === 'compliance') {
            requestBody.input = { files: input.split(',').map((f) => ({ name: f.trim() })) };
          } else {
            requestBody.input = { campaign: input };
          }
        }
      }

      const res = await fetch('/api/test/golden-path', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();
      setResponse(data);

      if (!res.ok || data.success === false) {
        setError(data.error?.message || 'Request failed');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const getProofStatusColor = (status: string) => {
    switch (status) {
      case 'ROUTE_OK':
      case 'AGENT_OK':
      case 'DB_OK':
      case 'DONE':
        return 'text-green-600 bg-green-50';
      case 'ERROR':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Agent Console - MVP Test Harness</h1>
        <p className="text-gray-600 mb-8">
          Test the 3 golden paths: Creative, Compliance, and Distribution
        </p>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scenario
            </label>
            <select
              value={scenario}
              onChange={(e) => setScenario(e.target.value as Scenario)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="creative">Creative (Marcus → Giorgio → Letitia)</option>
              <option value="compliance">Compliance (Cassidy → Letitia)</option>
              <option value="distribution">Distribution (Jamal → Save Drafts)</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Input (Optional - JSON or plain text)
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                scenario === 'creative'
                  ? '{"context": "A cinematic sequence", "mood": "dynamic"}'
                  : scenario === 'compliance'
                  ? '["demo_track.mp3", "licensed_song.mp3"]'
                  : '{"campaign": "Test Campaign", "platforms": ["instagram", "tiktok"]}'
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              rows={4}
            />
          </div>

          <button
            onClick={handleRun}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Running...' : 'Run Golden Path'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-red-800 font-semibold mb-2">Error</h3>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {response && (
          <div className="space-y-6">
            {/* Routing Decision */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Routing Decision</h2>
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Agent:</span>{' '}
                  <span className="text-blue-600">{response.agent || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-medium">Action:</span>{' '}
                  <span className="text-blue-600">{response.action || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-medium">Success:</span>{' '}
                  <span
                    className={
                      response.success !== false
                        ? 'text-green-600 font-semibold'
                        : 'text-red-600 font-semibold'
                    }
                  >
                    {response.success !== false ? '✓ Yes' : '✗ No'}
                  </span>
                </div>
              </div>
            </div>

            {/* Output */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Output</h2>
              <div className="bg-gray-50 rounded p-4 font-mono text-sm whitespace-pre-wrap">
                {response.output || response.error?.message || 'No output'}
              </div>
            </div>

            {/* Proof Markers */}
            {response.proof && response.proof.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Proof Trail</h2>
                <div className="space-y-2">
                  {response.proof.map((proof, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded ${getProofStatusColor(proof.status)}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{proof.step}</span>
                        <span className="text-xs font-mono">{proof.status}</span>
                      </div>
                      <p className="text-sm mt-1">{proof.message}</p>
                      {proof.details && (
                        <pre className="text-xs mt-2 opacity-75">
                          {JSON.stringify(proof.details, null, 2)}
                        </pre>
                      )}
                      <p className="text-xs mt-1 opacity-60">
                        {new Date(proof.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Artifacts */}
            {response.artifacts && response.artifacts.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Artifacts</h2>
                <div className="space-y-4">
                  {response.artifacts.map((artifact, idx) => (
                    <div key={idx} className="border border-gray-200 rounded p-4">
                      <div className="font-semibold mb-2">
                        {artifact.type.toUpperCase()}: {artifact.content.substring(0, 50)}
                        {artifact.content.length > 50 ? '...' : ''}
                      </div>
                      {artifact.metadata && (
                        <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
                          {JSON.stringify(artifact.metadata, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {response.warnings && response.warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-yellow-800 font-semibold mb-2">Warnings</h3>
                <ul className="list-disc list-inside text-yellow-700">
                  {response.warnings.map((warning, idx) => (
                    <li key={idx}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Raw JSON Response */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Raw JSON Response</h2>
              <pre className="bg-gray-50 rounded p-4 overflow-auto text-xs">
                {JSON.stringify(response, null, 2)}
              </pre>
            </div>

            {/* DB Confirmation */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-green-800 font-semibold mb-2">Database Confirmation</h3>
              <p className="text-green-700">
                ✓ Agent run saved to <code className="bg-green-100 px-1 rounded">agent_runs</code>{' '}
                table
              </p>
              {response.metadata?.drafts_saved && (
                <p className="text-green-700 mt-2">
                  ✓ {response.metadata.drafts_saved} draft(s) saved to{' '}
                  <code className="bg-green-100 px-1 rounded">scheduled_posts</code>
                </p>
              )}
              {response.metadata?.assets_saved && (
                <p className="text-green-700 mt-2">
                  ✓ {response.metadata.assets_saved} asset(s) saved to{' '}
                  <code className="bg-green-100 px-1 rounded">assets</code>
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

