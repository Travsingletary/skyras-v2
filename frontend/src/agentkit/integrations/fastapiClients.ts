/**
 * Thin wrapper utilities so AgentKit can call the existing FastAPI services
 * without duplicating their logic. Replace the base URLs with environment-configured
 * values when wiring this up to real infrastructure.
 */

const MARCUS_BASE_URL = process.env.MARCUS_URL || "http://localhost:8001";
const GIORGIO_BASE_URL = process.env.GIORGIO_URL || "http://localhost:8002";
const LETITIA_BASE_URL = process.env.LETITIA_URL || "http://localhost:8003";
const HUB_BASE_URL = process.env.HUB_URL || "http://localhost:8000";

async function jsonFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Request failed ${res.status} ${res.statusText}: ${text}`);
  }

  return res.json() as Promise<T>;
}

// ---- MARCUS ----
export async function callMarcusPlanEndpoint(payload: { goal: string; context?: string }) {
  // TODO: align this path with services/marcus/main.py once real endpoints ship.
  return jsonFetch(`${MARCUS_BASE_URL}/plan`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ---- GIORGIO ----
export async function callGiorgioScriptEndpoint(payload: {
  brief: string;
  format: "script" | "social" | "podcast" | "video";
  character?: string;
}) {
  return jsonFetch(`${GIORGIO_BASE_URL}/generate/script`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function callGiorgioPromptEndpoint(payload: { target: "sora" | "suno" | "image"; description: string }) {
  return jsonFetch(`${GIORGIO_BASE_URL}/generate/prompt`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ---- LETITIA ----
export async function callLetitiaSearchAssets(payload: { query: string; tags?: string[] }) {
  return jsonFetch(`${LETITIA_BASE_URL}/assets/search`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function callLetitiaSaveAsset(payload: {
  id?: string;
  type: string;
  tags: string[];
  metadata: Record<string, unknown>;
}) {
  return jsonFetch(`${LETITIA_BASE_URL}/assets/save`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ---- HUB ----
export async function callHubWorkflowEndpoint<TPayload extends Record<string, unknown>, TResponse = unknown>(
  path: string,
  payload: TPayload,
) {
  return jsonFetch<TResponse>(`${HUB_BASE_URL}${path}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
