# SkyRas Agency v2 Roadmap

## Phase 1 — Structure & Baseline Workflows (Now)
- Create canonical `/agents`, `/workflows`, `/memory`, `/integrations` packages with thin contracts so every service exposes its role/IO clearly.
- Document SkySky Show v1 workflow and align Marcus orchestration states with declarative workflow specs.
- Keep FastAPI services shipping while adding tests for shared models, event bus, and mock integrations.
- Define Jamal’s distribution surface area (deliverable schema, output channels, analytics hooks).

## Phase 2 — Memory & Integrations (Near Term)
- Implement Redis/Postgres-backed memory adapters that capture task history, asset lineage, and user preferences per agent.
- Replace mock creative/service clients with production-ready integrations (Suno, Notion, Resolve, HeyGen, etc.) managed from `/integrations`.
- Add permissioned secret/config management and health checks for each integration.
- Teach Marcus and Letitia to read/write shared memory so orchestration decisions accumulate context over time.

## Phase 3 — Advanced Automation & Analytics (Upcoming)
- Enable autonomous routing across agents (e.g., Marcus delegates creative subtasks to Giorgio based on workload; Jamal auto-selects distribution packages).
- Add telemetry + analytics dashboards that show workflow throughput, asset quality, and delivery performance.
- Layer reinforcement loops (feedback capture, retraining prompts, dynamic prioritization) so workflows self-improve.
- Expand Docs Harvester coverage and stitch harvested knowledge into Letitia’s search index and Jamal’s narrative briefs.
