# Agent Canonical Execution Path

**Date:** 2025-01-27  
**Status:** ✅ DECIDED  
**Canonical Runtime:** TypeScript AgentKit

---

## Decision

**Canonical Runtime:** TypeScript AgentKit (Next.js API routes)

**Non-Canonical Runtime:** Python microservices (FastAPI services in `services/` directory)

---

## Inventory of Agent Entrypoints

### TypeScript AgentKit Routes (Canonical - Production)

All routes are in `frontend/src/app/api/` and use TypeScript agents from `frontend/src/agents/`:

1. **`/api/chat`** (POST)
   - File: `frontend/src/app/api/chat/route.ts`
   - Agent: Marcus (`createMarcusAgent()`)
   - Usage: Main chat interface, orchestrates all agents
   - Production: ✅ Active

2. **`/api/agents/atlas`** (POST, GET)
   - File: `frontend/src/app/api/agents/atlas/route.ts`
   - Agent: Atlas (`createAtlasAgent()`)
   - Usage: PM agent for priority management
   - Production: ✅ Active

3. **`/api/agents/marcus-manager`** (POST, GET)
   - File: `frontend/src/app/api/agents/marcus-manager/route.ts`
   - Agent: Marcus Manager (`createMarcusManagerAgent()`)
   - Usage: Strict PM agent for YouTube Music Growth
   - Production: ✅ Active

4. **`/api/agents/compliance/scan`** (POST)
   - File: `frontend/src/app/api/agents/compliance/scan/route.ts`
   - Agent: Cassidy (`createComplianceAgent()`)
   - Usage: Licensing compliance scanning
   - Production: ✅ Active

5. **`/api/agents/giorgio/test`** (GET)
   - File: `frontend/src/app/api/agents/giorgio/test/route.ts`
   - Agent: Giorgio (`createGiorgioAgent()`)
   - Usage: Test endpoint for creative agent
   - Production: ✅ Active (test endpoint)

6. **`/api/agents/jamal/test`** (GET)
   - File: `frontend/src/app/api/agents/jamal/test/route.ts`
   - Agent: Jamal (`createJamalAgent()`)
   - Usage: Test endpoint for distribution agent
   - Production: ✅ Active (test endpoint)

7. **`/api/agents/letitia/test`** (GET)
   - File: `frontend/src/app/api/agents/letitia/test/route.ts`
   - Agent: Letitia (`createLetitiaAgent()`)
   - Usage: Test endpoint for cataloging agent
   - Production: ✅ Active (test endpoint)

8. **`/api/test/golden-path`** (POST)
   - File: `frontend/src/app/api/test/golden-path/route.ts`
   - Agents: All agents (Marcus, Giorgio, Jamal, Cassidy, Letitia)
   - Usage: End-to-end testing of agent workflows
   - Production: ✅ Active (test endpoint)

### Python Microservices Routes (Non-Canonical - Not Used)

Routes in `services/hub/main.py` and other Python services:

1. **`/api/v2/agents/marcus/task`** (POST)
   - Service: FastAPI Hub (port 8000)
   - Proxies to: Marcus service (port 8001)
   - Status: ❌ Not called by production code

2. **`/api/v2/agents/marcus/tasks`** (GET)
   - Service: FastAPI Hub (port 8000)
   - Proxies to: Marcus service (port 8001)
   - Status: ❌ Not called by production code

3. **`/api/v2/agents/letitia/search`** (POST)
   - Service: FastAPI Hub (port 8000)
   - Proxies to: Letitia service (port 8002)
   - Status: ❌ Not called by production code

4. **`/api/v2/agents/letitia/upload`** (POST)
   - Service: FastAPI Hub (port 8000)
   - Proxies to: Letitia service (port 8002)
   - Status: ❌ Not called by production code

5. **`/api/v2/agents/status`** (GET)
   - Service: FastAPI Hub (port 8000)
   - Status: ❌ Not called by production code

**Note:** Python services exist in `docker-compose.yml` and `services/` directory but are **not referenced** by any production frontend or API code. They appear to be legacy Phase 0 architecture.

---

## Routing Decision Logic

### Current State (Before Consolidation)

**TypeScript AgentKit:**
- All production API routes use TypeScript agents
- Agents are imported from `@/agents/*` modules
- Execution happens in-process within Next.js API routes
- Frontend calls use `same-origin` (no external API calls)

**Python Microservices:**
- Exist in `services/` directory
- Defined in `docker-compose.yml` but not used by production
- No code paths call `/api/v2/agents/*` endpoints
- Appear to be Phase 0 proof-of-concept architecture

### Decision Rationale

**Why TypeScript AgentKit is Canonical:**

1. **Deployment Simplicity**
   - Single deployment (Next.js on Vercel)
   - No microservices orchestration required
   - No Docker Compose needed in production
   - Simpler environment variable management

2. **Latency**
   - In-process execution (no network overhead)
   - No inter-service communication delays
   - Faster response times for agent operations

3. **Observability**
   - All code in one codebase
   - Unified logging and error handling
   - Easier debugging (single runtime environment)
   - TypeScript type safety end-to-end

4. **Security**
   - No exposed microservice endpoints
   - All agent execution behind Next.js API routes
   - Unified authentication/authorization
   - No network attack surface between services

5. **Maintenance**
   - Single codebase to maintain
   - Shared types and utilities
   - Easier testing (no service mocks needed)
   - Consistent error handling patterns

6. **Production Reality**
   - Already deployed and working in production
   - Used by all active frontend routes
   - Proven stable and reliable

**Why Python Microservices are Non-Canonical:**

- Not used by any production code
- Require Docker Compose setup (additional complexity)
- No frontend integration
- Legacy Phase 0 architecture
- No production deployment evidence

---

## Non-Canonical Path Definition

**Non-Canonical Runtime:** Python microservices (FastAPI services)

**Status:** Disabled/Archived

**Definition:**
- Python microservices in `services/` directory are **not part of the canonical execution path**
- They are **dev-only / archived** code
- They may be kept for reference or future migration but should not be used in production
- No production code should call `/api/v2/agents/*` endpoints
- Docker Compose services are for local development/testing only

**Guard Strategy:**
- No environment variable guard needed (services are not called)
- Document clearly that Python services are non-canonical
- If future migration is needed, add explicit `AGENT_RUNTIME=python` guard and route switching logic

---

## Canonical Execution Flow

```
User Request (UI)
    ↓
Next.js API Route (/api/chat, /api/agents/*, etc.)
    ↓
TypeScript Agent Creation (createMarcusAgent(), etc.)
    ↓
Agent Execution (agent.run())
    ↓
Agent Actions (compliance, creative, distribution, cataloging)
    ↓
Database Operations (Supabase via TypeScript client)
    ↓
Response (NextResponse.json())
```

**Key Characteristics:**
- All execution happens in-process within Next.js
- No external service calls for agent execution
- Direct database access via Supabase client
- Unified error handling and logging

---

## Implementation Status

**Current State:**
- ✅ TypeScript AgentKit is already the canonical runtime
- ✅ All production routes use TypeScript agents
- ✅ Python services exist but are not called
- ⚠️ No explicit guards preventing accidental Python service usage
- ⚠️ No centralized logging for canonical runtime identification

**Consolidation Actions:**
1. ✅ Document canonical path (this document)
2. ⏳ Add server-side logging with runtime identification
3. ⏳ Document Python services as non-canonical
4. ⏳ Create E2E proof in production

---

## Related Documentation

- `docs/E2E_AGENT_PROOF.md` - Production E2E verification
- `README_MICROSERVICES.md` - Python microservices documentation (legacy)
- `docs/service-graph.md` - Service architecture overview (legacy)

---

**Last Updated:** 2025-01-27  
**Next Review:** After E2E verification complete
