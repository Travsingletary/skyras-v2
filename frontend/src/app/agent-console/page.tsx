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
    timestamp?: string;
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
  const [includeImage, setIncludeImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<GoldenPathResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    proof: true,
    artifacts: true,
    raw: false,
  });

  // System-owned neutral demo inputs for compliance testing
  // Designed to show mixed results: 2 flagged + 2 clean
  const DEFAULT_SAMPLE_FILES = [
    'video_demo_watermark.mp4',  // flag: DEMO + WATERMARK
    'music_preview_track.wav',   // flag: PREVIEW
    'image_sample_render.png',   // clean: no keywords
    'final_export.mov',          // clean: no keywords
  ];

  // Set default input based on scenario
  const getDefaultInput = (scenario: Scenario) => {
    switch (scenario) {
      case 'compliance':
        return JSON.stringify(DEFAULT_SAMPLE_FILES);
      case 'creative':
        return JSON.stringify({ context: 'A cinematic sequence', mood: 'dynamic' });
      case 'distribution':
        return JSON.stringify({ campaign: 'Test Campaign', platforms: ['instagram', 'tiktok'] });
      default:
        return '';
    }
  };

  // Update input when scenario changes
  const handleScenarioChange = (newScenario: Scenario) => {
    setScenario(newScenario);
    setInput(getDefaultInput(newScenario));
  };

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

      // For creative scenario, add includeImage flag
      if (scenario === 'creative') {
        if (!requestBody.input) {
          requestBody.input = {};
        }
        (requestBody.input as Record<string, unknown>).includeImage = includeImage;
      }

      // Parse input as JSON if provided
      if (input.trim()) {
        try {
          const parsed = JSON.parse(input);
          requestBody = { ...requestBody, ...parsed };
          // Ensure includeImage is set from toggle
          if (scenario === 'creative' && requestBody.input) {
            (requestBody.input as Record<string, unknown>).includeImage = includeImage;
          }
        } catch {
          // If not JSON, treat as plain text context
          if (scenario === 'creative') {
            requestBody.input = { context: input, includeImage };
          } else if (scenario === 'compliance') {
            // Support both comma-separated strings and JSON array
            if (input.trim().startsWith('[')) {
              try {
                const parsed = JSON.parse(input);
                requestBody.input = { files: parsed };
              } catch {
                requestBody.input = { files: input.split(',').map((f) => ({ name: f.trim() })) };
              }
            } else {
              requestBody.input = { files: input.split(',').map((f) => ({ name: f.trim() })) };
            }
          } else {
            requestBody.input = { campaign: input };
          }
        }
      }

      // For compliance, ensure files array is always present (use defaults if empty)
      if (scenario === 'compliance') {
        if (!requestBody.input) {
          requestBody.input = {};
        }
        const inputFiles = (requestBody.input as { files?: unknown[] })?.files;
        if (!inputFiles || !Array.isArray(inputFiles) || inputFiles.length === 0) {
          // Use default sample filenames (system-owned neutral demo inputs)
          (requestBody.input as { files: string[] }).files = [...DEFAULT_SAMPLE_FILES];
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
        return 'text-green-700 bg-green-50 border-green-200';
      case 'INFO':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'ERROR':
        return 'text-red-700 bg-red-50 border-red-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getProofIcon = (status: string) => {
    switch (status) {
      case 'ROUTE_OK':
      case 'AGENT_OK':
      case 'DB_OK':
      case 'DONE':
        return '✓';
      case 'INFO':
        return 'ℹ';
      case 'ERROR':
        return '✗';
      default:
        return '○';
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getScenarioFlow = (scenario: Scenario) => {
    switch (scenario) {
      case 'creative':
        return ['Marcus', '→', 'Giorgio', '→', 'Letitia'];
      case 'compliance':
        return ['Marcus', '→', 'Cassidy', '→', 'Letitia'];
      case 'distribution':
        return ['Marcus', '→', 'Jamal', '→', 'DB'];
      default:
        return [];
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Agent Console</h1>
          <p className="text-gray-600 text-lg">
            Test the 3 golden paths: Creative, Compliance, and Distribution
          </p>
        </div>

        {/* Input Panel */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Scenario
              </label>
              <select
                value={scenario}
                onChange={(e) => handleScenarioChange(e.target.value as Scenario)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="creative">Creative (Marcus → Giorgio → Letitia)</option>
                <option value="compliance">Compliance (Marcus → Cassidy → Letitia)</option>
                <option value="distribution">Distribution (Marcus → Jamal → DB)</option>
              </select>
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                <span className="font-medium">Flow:</span>
                <div className="flex items-center gap-1">
                  {getScenarioFlow(scenario).map((item, idx) => (
                    <span key={idx} className={item === '→' ? 'text-gray-400' : 'font-semibold text-blue-600'}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Project
              </label>
              <input
                type="text"
                defaultValue="SkySky"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                placeholder="Project name"
              />
            </div>
          </div>

          {scenario === 'creative' && (
            <div className="mb-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeImage}
                  onChange={(e) => setIncludeImage(e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-semibold text-gray-700">
                  Include image generation
                </span>
                <span className="text-xs text-gray-500">
                  (Requires GIORGIO_IMAGE_ENABLED=true and REPLICATE_API_TOKEN)
                </span>
              </label>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Input (Optional - JSON or plain text)
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                scenario === 'creative'
                  ? '{"context": "A cinematic sequence", "mood": "dynamic"}'
                  : scenario === 'compliance'
                  ? '["video_demo_watermark.mp4", "music_preview_track.wav", "image_sample_render.png", "final_export.mov"]'
                  : '{"campaign": "Test Campaign", "platforms": ["instagram", "tiktok"]}'
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm bg-gray-50"
              rows={4}
            />
          </div>

          <button
            onClick={handleRun}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed font-semibold shadow-md transition-all duration-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Running...
              </>
            ) : (
              <>
                <span>▶</span>
                Run Golden Path
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-5 mb-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="text-red-600 text-2xl">⚠</div>
              <div className="flex-1">
                <h3 className="text-red-900 font-bold mb-1">Error</h3>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {response && (
          <div className="space-y-6">
            {/* Success Banner */}
            <div
              className={`rounded-xl shadow-lg border-2 p-6 ${
                response.success !== false
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300'
                  : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`text-4xl ${
                      response.success !== false ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {response.success !== false ? '✓' : '✗'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-2xl font-bold text-gray-900">
                        {response.success !== false ? 'Golden Path Completed' : 'Golden Path Failed'}
                      </h2>
                      {response.metadata?.used_defaults && (
                        <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded border border-blue-300">
                          Used Defaults
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600">
                      {response.agent ? `${response.agent} → ${response.action}` : 'No routing information'}
                    </p>
                  </div>
                </div>
                <div
                  className={`px-4 py-2 rounded-lg font-semibold ${
                    response.success !== false
                      ? 'bg-green-600 text-white'
                      : 'bg-red-600 text-white'
                  }`}
                >
                  {response.success !== false ? 'SUCCESS' : 'FAILED'}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
                <div className="text-sm text-gray-600 mb-1">Agent</div>
                <div className="text-xl font-bold text-gray-900">{response.agent || 'N/A'}</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-500">
                <div className="text-sm text-gray-600 mb-1">Action</div>
                <div className="text-xl font-bold text-gray-900">{response.action || 'N/A'}</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
                <div className="text-sm text-gray-600 mb-1">Proof Steps</div>
                <div className="text-xl font-bold text-gray-900">{response.proof?.length || 0}</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-orange-500">
                <div className="text-sm text-gray-600 mb-1">Artifacts</div>
                <div className="text-xl font-bold text-gray-900">{response.artifacts?.length || 0}</div>
              </div>
            </div>

            {/* Output */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Output</h2>
                <button
                  onClick={() => copyToClipboard(response.output || response.error?.message || '')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  <span>📋</span> Copy
                </button>
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-5 border border-gray-200">
                <pre className="font-mono text-sm text-gray-800 whitespace-pre-wrap break-words">
                  {response.output || response.error?.message || 'No output'}
                </pre>
              </div>
            </div>

            {/* Proof Markers */}
            {response.proof && response.proof.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <button
                  onClick={() => toggleSection('proof')}
                  className="w-full flex items-center justify-between mb-4"
                >
                  <h2 className="text-xl font-bold text-gray-900">Proof Trail</h2>
                  <span className="text-gray-500">{expandedSections.proof ? '▼' : '▶'}</span>
                </button>
                {expandedSections.proof && (
                  <div className="space-y-3">
                    {response.proof.map((proof, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg border-2 ${getProofStatusColor(proof.status)} transition-all hover:shadow-md`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-2xl font-bold flex-shrink-0">
                            {getProofIcon(proof.status)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-lg">{proof.step}</span>
                              <span className="text-xs font-mono bg-white px-2 py-1 rounded border">
                                {proof.status}
                              </span>
                            </div>
                            <p className="text-sm mb-2">{proof.message}</p>
                            {proof.details && Object.keys(proof.details).length > 0 && (
                              <details className="mt-2">
                                <summary className="text-xs font-medium cursor-pointer text-gray-600 hover:text-gray-900">
                                  View Details
                                </summary>
                                <pre className="text-xs mt-2 bg-white p-2 rounded border overflow-auto">
                                  {JSON.stringify(proof.details, null, 2)}
                                </pre>
                              </details>
                            )}
                            {proof.timestamp && (
                              <p className="text-xs mt-2 opacity-60">
                                {new Date(proof.timestamp).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Artifacts */}
            {response.artifacts && response.artifacts.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <button
                  onClick={() => toggleSection('artifacts')}
                  className="w-full flex items-center justify-between mb-4"
                >
                  <h2 className="text-xl font-bold text-gray-900">Artifacts ({response.artifacts.length})</h2>
                  <span className="text-gray-500">{expandedSections.artifacts ? '▼' : '▶'}</span>
                </button>
                {expandedSections.artifacts && (
                  <div className="grid md:grid-cols-2 gap-4">
                    {response.artifacts.map((artifact, idx) => {
                      const isImage = artifact.type === 'image';
                      const isPromptPackage = artifact.type === 'prompt_package';
                      const isGenerated = isImage && artifact.url;
                      const isFallback = isPromptPackage || (isImage && !artifact.url);

                      return (
                        <div
                          key={idx}
                          className="border-2 border-gray-200 rounded-lg p-4 bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-md transition-all"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm uppercase text-blue-700 bg-blue-100 px-3 py-1 rounded">
                                {artifact.type}
                              </span>
                              {isGenerated && (
                                <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-1 rounded border border-green-300">
                                  GENERATED
                                </span>
                              )}
                              {isFallback && (
                                <span className="text-xs font-semibold bg-yellow-100 text-yellow-700 px-2 py-1 rounded border border-yellow-300">
                                  FALLBACK
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => copyToClipboard(typeof artifact.content === 'string' ? artifact.content : JSON.stringify(artifact.content))}
                              className="text-xs text-blue-600 hover:text-blue-700"
                            >
                              📋 Copy
                            </button>
                          </div>
                          {isImage && artifact.url && (
                            <div className="bg-white rounded p-3 border border-gray-200 mb-2">
                              <img
                                src={artifact.url}
                                alt="Generated image"
                                className="w-full h-auto rounded max-h-64 object-contain"
                              />
                            </div>
                          )}
                          {isPromptPackage && (
                            <div className="bg-white rounded p-3 border border-gray-200 mb-2">
                              <pre className="text-sm text-gray-800 whitespace-pre-wrap break-words max-h-40 overflow-auto">
                                {typeof artifact.content === 'string'
                                  ? artifact.content
                                  : JSON.stringify(artifact.content, null, 2)}
                              </pre>
                            </div>
                          )}
                          {!isImage && !isPromptPackage && (
                            <div className="bg-white rounded p-3 border border-gray-200 mb-2">
                              <pre className="text-sm text-gray-800 whitespace-pre-wrap break-words max-h-40 overflow-auto">
                                {typeof artifact.content === 'string'
                                  ? artifact.content
                                  : JSON.stringify(artifact.content, null, 2)}
                              </pre>
                            </div>
                          )}
                          {artifact.metadata && Object.keys(artifact.metadata).length > 0 && (
                            <details className="mt-2">
                              <summary className="text-xs font-medium cursor-pointer text-gray-600 hover:text-gray-900">
                                View Metadata
                              </summary>
                              <pre className="text-xs mt-2 bg-white p-2 rounded border overflow-auto">
                                {JSON.stringify(artifact.metadata, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Warnings */}
            {response.warnings && response.warnings.length > 0 && (
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="text-yellow-600 text-2xl">⚠</div>
                  <div className="flex-1">
                    <h3 className="text-yellow-900 font-bold mb-2">Warnings ({response.warnings.length})</h3>
                    <ul className="list-disc list-inside text-yellow-800 space-y-1">
                      {response.warnings.map((warning, idx) => (
                        <li key={idx}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* DB Confirmation */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="text-green-600 text-2xl">✓</div>
                <div className="flex-1">
                  <h3 className="text-green-900 font-bold mb-3">Database Confirmation</h3>
                  <div className="space-y-2">
                    <p className="text-green-800 flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      Agent run saved to{' '}
                      <code className="bg-green-100 px-2 py-1 rounded font-mono text-sm">agent_runs</code>{' '}
                      table
                    </p>
                    {response.metadata?.drafts_saved && (
                      <p className="text-green-800 flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        {response.metadata.drafts_saved} draft(s) saved to{' '}
                        <code className="bg-green-100 px-2 py-1 rounded font-mono text-sm">scheduled_posts</code>
                      </p>
                    )}
              {response.metadata?.assets_saved && (
                <p className="text-green-800 flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  {response.metadata.assets_saved} asset(s) saved to{' '}
                  <code className="bg-green-100 px-2 py-1 rounded font-mono text-sm">assets</code>
                </p>
              )}
              {response.metadata?.scan_saved && (
                <p className="text-green-800 flex items-center gap-2 flex-wrap">
                  <span className="text-green-600">✓</span>
                  Compliance scan saved to{' '}
                  <code className="bg-green-100 px-2 py-1 rounded font-mono text-sm">compliance_scans</code>
                  {response.metadata.scan_id && response.metadata.scan_id !== 'unknown' && (
                    <span className="text-green-700 font-mono text-xs">
                      (ID: {String(response.metadata.scan_id).substring(0, 8)}...)
                    </span>
                  )}
                  {response.metadata.flagged_count !== undefined && (
                    <span className="text-green-700">
                      — {response.metadata.flagged_count} flagged, {response.metadata.clean_count || 0} clean
                    </span>
                  )}
                </p>
              )}
                  </div>
                </div>
              </div>
            </div>

            {/* Raw JSON Response */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <button
                onClick={() => toggleSection('raw')}
                className="w-full flex items-center justify-between mb-4"
              >
                <h2 className="text-xl font-bold text-gray-900">Raw JSON Response</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(JSON.stringify(response, null, 2));
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    📋 Copy
                  </button>
                  <span className="text-gray-500">{expandedSections.raw ? '▼' : '▶'}</span>
                </div>
              </button>
              {expandedSections.raw && (
                <pre className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-5 border border-gray-200 overflow-auto text-xs font-mono max-h-96">
                  {JSON.stringify(response, null, 2)}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

