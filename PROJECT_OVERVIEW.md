# SkyRas Agency v2 Overview

SkyRas Agency v2 is an adaptive multi-agent creative operating system that turns ideas into finished media. The platform coordinates specialized agents, a shared hub, and supporting services so teams can request episodes, campaigns, or deliverables and receive production-ready assets with minimal manual intervention.

## Vision
- Treat creative production as a programmable workflow with human-in-the-loop checkpoints.
- Keep agent personalities and responsibilities explicit so each service can evolve independently.
- Use memory, contextual awareness, and integrations to keep work synchronized across design, writing, media generation, and distribution.

## Core Agents & Services
| Component | Role | Key Interfaces |
| --- | --- | --- |
| Marcus (services/marcus) | Orchestrator for tasks, schedules, and SkySky episode state. Publishes task events, syncs calendars/Plane, triggers n8n hooks. | REST `/api/tasks`, Redis event bus, Notion + Resolve adapters. |
| Giorgio (services/giorgio) | Creative generator that requests Midjourney, HeyGen, ElevenLabs, and Suno outputs per scene spec. | REST `/api/generate/*`, Redis events `asset.generated`. |
| Letitia (services/letitia) | Librarian that tracks files, metadata, and search. Owns asset tagging and associations. | REST `/api/files`, `/api/search`, Redis events `file.uploaded`. |
| Jamal (agents/jamal) | Distribution strategist (scaffolded). Will compile deliverables, push to channels, and report analytics. | Planned REST + webhook triggers, subscribes to `asset.generated` and `task.completed`. |
| FastAPI Hub (services/hub) | Central API gateway that proxies client requests to agents, aggregates health, and re-emits events. | `/api/v2/agents/*` endpoints, Redis. |
| Docs Harvester (services/docs-harvester) | Async agent that ingests third-party knowledge (docs, wikis) and exports structured markdown for agents. | `/harvest/run`, `/export/md`. |
| Legacy Dashboard (server.js + frontend/) | Existing Node/Next UI used for chat, monitoring, and API proxying while the v2 UI matures. | `/api` mock chat, `/api/v2` proxy to hub. |

## Supporting Layers
- `shared/` contains event bus, Redis client, and Pydantic models reused by every service.
- `workflows/` defines declarative pipelines (SkySky Show episodes, etc.) so orchestrators know each step and required agents.
- `memory/` abstracts Redis/Postgres stores for persistent agent context and cross-agent knowledge.
- `integrations/` hosts first-class clients for creative APIs (Midjourney, Suno, Notion, etc.) to keep service code thin.

## Flow Summary
1. Requests enter via the legacy dashboard or directly through the FastAPI hub.
2. Marcus decomposes the request into tasks, referencing `workflows/` definitions and current memory state.
3. Giorgio fulfills creative subtasks, Letitia stores resulting assets, and Jamal (next) packages delivery.
4. Docs Harvester keeps reference knowledge fresh for Letitia/Jamal to cite.
5. Redis-based events keep every agent in sync and allow future automation (analytics, routing, escalation).

SkyRas Agency v2 is intentionally modular: each agent can ship independently while still contributing to the adaptive creative OS.
