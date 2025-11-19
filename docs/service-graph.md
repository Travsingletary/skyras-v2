# SkyRas v2 - Service Architecture Graph

## System Overview

```
┌──────────────────────────────────────────────────────────────┐
│                     USER INTERFACE LAYER                      │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │         Node.js MVP Frontend (Port 3000)               │  │
│  │  • Existing chat interface                             │  │
│  │  • Project dashboard                                   │  │
│  │  • Proxies /api → MVP backend                          │  │
│  │  • Proxies /api/v2 → FastAPI Hub                       │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                              │
                  ┌───────────┴───────────┐
                  │                       │
                  ↓                       ↓
┌─────────────────────────┐  ┌───────────────────────────────┐
│   MVP Backend (Legacy)  │  │   FastAPI Hub (Port 8000)     │
│   • /api/chat           │  │   • /api/v2/agents/*          │
│   • Mock responses      │  │   • Central orchestration     │
│   • Keeps working       │  │   • Event aggregation         │
└─────────────────────────┘  │   • Agent health checks       │
                              └───────────┬───────────────────┘
                                          │
                      ┌───────────────────┼───────────────────┐
                      │                   │                   │
                      ↓                   ↓                   ↓
        ┌─────────────────────┐ ┌─────────────────────┐ ┌────────┐
        │  Marcus (Port 8001) │ │ Letitia (Port 8002) │ │ Future │
        │                     │ │                     │ │ Agents │
        │  Task Management    │ │  Library Management │ │        │
        │  • Create tasks     │ │  • File uploads     │ │ • Ari  │
        │  • Schedule         │ │  • Metadata         │ │ • Jamal│
        │  • Cal.com (mock)   │ │  • Search (mock)    │ │ • Giorg│
        │  • Plane.so (mock)  │ │  • Storage (mock)   │ │        │
        │  • n8n (mock)       │ │  • Meilisearch      │ │        │
        └──────┬──────────────┘ └──────┬──────────────┘ └────────┘
               │                       │
               └───────────┬───────────┘
                           │
                           ↓
┌──────────────────────────────────────────────────────────────┐
│                      DATA & EVENT LAYER                       │
│                                                                │
│  ┌─────────────────────┐          ┌──────────────────────┐  │
│  │  Redis (Port 6379)  │          │ PostgreSQL (5432)    │  │
│  │                     │          │                      │  │
│  │  Event Bus:         │          │  Tables:             │  │
│  │  • skyras:tasks     │          │  • tasks             │  │
│  │  • skyras:files     │          │  • files             │  │
│  │  • skyras:system    │          │  • task_files        │  │
│  │                     │          │  • events            │  │
│  │  Pub/Sub messaging  │          │                      │  │
│  │  between agents     │          │  Shared data store   │  │
│  └─────────────────────┘          └──────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

## Event Flow Diagrams

### Task Creation Flow

```
┌─────────┐  1. Create Task   ┌──────────┐  2. Forward    ┌────────┐
│ User/UI │ ───────────────→  │ FastAPI  │ ────────────→  │ Marcus │
└─────────┘                    │   Hub    │                └───┬────┘
                               └────┬─────┘                    │
                                    │                          │
                                    │    7. Response           │ 3. Store
                                    │    ←──────────────────── │    in DB
                                    ↓                          │
                               ┌─────────┐                     │
                               │ Return  │                     │
                               │ to User │                     ↓
                               └─────────┘              ┌──────────┐
                                    ↑                   │  Redis   │
                                    │                   │  Pub/Sub │
                                    │                   └────┬─────┘
                                    │                        │
                                    │   6. Acknowledge       │ 4. Publish
                                    │   ←────────────────    │    event
                                    │                        │
                                    │                        ↓
                               ┌────┴────┐           ┌──────────┐
                               │ FastAPI │  5. React │ Letitia  │
                               │   Hub   │  ←────────│  Agent   │
                               └─────────┘           └──────────┘
```

### File Upload Flow

```
┌─────────┐  1. Upload File  ┌──────────┐  2. Forward   ┌─────────┐
│ User/UI │ ───────────────→ │ FastAPI  │ ───────────→  │ Letitia │
└─────────┘                   │   Hub    │               └────┬────┘
                              └────┬─────┘                    │
                                   │                          │
                                   │    7. Response           │ 3. Extract
                                   │    ←──────────────────── │    metadata
                                   ↓                          │
                              ┌─────────┐                     │ 4. Store
                              │ Return  │                     │    in DB
                              │ to User │                     │
                              └─────────┘                     ↓
                                   ↑                   ┌──────────┐
                                   │                   │  Redis   │
                                   │                   │  Pub/Sub │
                                   │                   └────┬─────┘
                                   │                        │
                                   │   6. Acknowledge       │ 5. Publish
                                   │   ←────────────────    │    event
                                   │                        │
                                   │                        ↓
                              ┌────┴────┐           ┌──────────┐
                              │ FastAPI │  Watch    │  Marcus  │
                              │   Hub   │  ←────────│  Agent   │
                              └─────────┘  events   └──────────┘
```

### Cross-Agent Communication

```
Task Created → File Association → Notification

┌────────┐  task.created   ┌─────────┐
│ Marcus │ ──────────────→ │  Redis  │
└────────┘    event         │ Pub/Sub │
                            └────┬────┘
                                 │
                                 │ Subscribe
                                 │
                                 ↓
                           ┌──────────┐
                           │ Letitia  │
                           └────┬─────┘
                                │
                                │ Checks for
                                │ related files
                                │
                                ↓
                           ┌──────────┐
                           │  Redis   │ file.associated
                           │ Pub/Sub  │ ─────────────→
                           └────┬─────┘
                                │
                                ↓
                           ┌────────┐
                           │ Marcus │ Updates task
                           └────────┘ with file link
```

## API Route Map

### Frontend (Node.js MVP - Port 3000)

```
GET  /                           → HTML dashboard
POST /api/chat                   → Legacy MVP chat
GET  /health                     → MVP health check

Proxy Routes:
/api/v2/*                        → FastAPI Hub (port 8000)
```

### FastAPI Hub (Port 8000)

```
GET  /health                     → Hub health check
GET  /api/v2/agents/status       → All agent statuses

Marcus Routes:
POST /api/v2/agents/marcus/task  → Create task
GET  /api/v2/agents/marcus/tasks → List tasks

Letitia Routes:
POST /api/v2/agents/letitia/search → Search files
POST /api/v2/agents/letitia/upload → Upload file

Event Routes:
GET  /api/v2/events              → Recent events

Cross-Agent:
POST /api/v2/agents/associate-file-task → Link file to task
```

### Marcus Service (Port 8001)

```
GET  /health                     → Marcus health check

Task Management:
POST /api/tasks                  → Create task
GET  /api/tasks                  → List all tasks
GET  /api/tasks/{id}             → Get task details
PUT  /api/tasks/{id}             → Update task
DELETE /api/tasks/{id}           → Delete task

Mock Integrations:
GET  /api/calendar/events        → Cal.com events (mock)
GET  /api/plane/issues           → Plane.so issues (mock)
POST /api/n8n/webhook            → n8n trigger (mock)
```

### Letitia Service (Port 8002)

```
GET  /health                     → Letitia health check

File Management:
POST /api/files                  → Create file record
GET  /api/files                  → List all files
GET  /api/files/{id}             → Get file details
DELETE /api/files/{id}           → Delete file

Search & Metadata:
POST /api/search                 → Search files (mock)
POST /api/files/{id}/tags        → Add tags to file

Mock Integrations:
POST /api/storage/upload         → Supabase Storage (mock)
GET  /api/storage/{id}           → Download file (mock)
```

## Data Flow

### Task Lifecycle

```
CREATE → PENDING → IN_PROGRESS → COMPLETED
                → ON_HOLD
                → CANCELLED
                → OVERDUE (if due_date < now)

Each state change triggers:
• Database update
• Redis event publication
• n8n workflow trigger (mock)
• Calendar sync (if due date changed)
```

### File Lifecycle

```
UPLOAD → METADATA_EXTRACTION → INDEXING → SEARCHABLE
                             → TAGGING
                             → TASK_ASSOCIATION

Each stage triggers:
• Database update
• Redis event publication
• Search index update (mock)
• Storage confirmation (mock)
```

## Database Schema

### Tasks Table
```sql
tasks
├── id (UUID, PK)
├── title (TEXT)
├── description (TEXT)
├── status (TEXT)
├── priority (TEXT)
├── due_date (TIMESTAMP)
├── created_by (TEXT)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

### Files Table
```sql
files
├── id (UUID, PK)
├── filename (TEXT)
├── file_path (TEXT)
├── file_type (TEXT)
├── file_size (BIGINT)
├── metadata (JSONB)
├── tags (TEXT[])
└── uploaded_at (TIMESTAMP)
```

### Relationships
```sql
task_files
├── task_id (UUID, FK → tasks.id)
└── file_id (UUID, FK → files.id)
```

## Event Types

### Task Events
- `task.created` - New task created
- `task.updated` - Task modified
- `task.completed` - Task marked done
- `task.deleted` - Task removed
- `schedule.changed` - Due date modified

### File Events
- `file.uploaded` - New file added
- `file.tagged` - Tags added/updated
- `file.deleted` - File removed
- `search.indexed` - File indexed for search
- `file.associated` - File linked to task

### System Events
- `agent.started` - Agent service started
- `agent.stopped` - Agent service stopped
- `system.health_check` - Health monitoring

## Deployment Topology

### Development (Current)
```
Docker Compose on localhost
├── Redis container
├── PostgreSQL container
├── FastAPI Hub container
├── Marcus container
├── Letitia container
└── Node.js MVP (host)
```

### Production (Future)
```
Kubernetes cluster
├── Redis StatefulSet
├── PostgreSQL StatefulSet (or cloud RDS)
├── FastAPI Hub Deployment (replicas: 3)
├── Marcus Deployment (replicas: 2)
├── Letitia Deployment (replicas: 2)
├── Ingress (load balancer)
└── Service mesh (Istio/Linkerd)
```

## Monitoring Points

- **Health Endpoints**: `/health` on all services
- **Redis Pub/Sub**: Monitor event channels
- **Database Queries**: Track query performance
- **API Response Times**: Monitor latency
- **Error Rates**: Track failures per service
- **Event Processing**: Monitor event lag

---

**Phase 0 Architecture - Ready for Testing & Validation**



