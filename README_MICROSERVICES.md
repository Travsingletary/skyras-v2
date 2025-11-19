# SkyRas v2 - Phase 0 Microservices Architecture

## 🎯 Overview

This is the **Phase 0 proof-of-concept** for SkyRas v2's microservices architecture, featuring Marcus (Task Management) and Letitia (Library Management) agents communicating via Redis events.

### Architecture

```
┌─────────────────┐
│  Node.js MVP    │  Port 3000 (Frontend + Chat UI)
│  (Existing)     │
└────────┬────────┘
         │ Proxies /api/v2 requests
         ↓
┌─────────────────┐
│  FastAPI Hub    │  Port 8000 (Central Orchestration)
└────┬────────┬───┘
     │        │
     ↓        ↓
┌─────────┐ ┌──────────┐
│ Marcus  │ │ Letitia  │  Ports 8001, 8002 (Agent Services)
└────┬────┘ └────┬─────┘
     │           │
     └─────┬─────┘
           ↓
     ┌──────────┐
     │  Redis   │  Port 6379 (Event Bus)
     └──────────┘
           │
     ┌──────────┐
     │PostgreSQL│  Port 5432 (Database)
     └──────────┘
```

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for MVP frontend)
- Python 3.11+ (optional, for local development)

### 1. Start the Microservices

```bash
# Start all services with Docker Compose
docker-compose up -d

# Check service health
curl http://localhost:8000/health    # FastAPI Hub
curl http://localhost:8001/health    # Marcus
curl http://localhost:8002/health    # Letitia

# View logs
docker-compose logs -f
```

### 2. Start the Frontend MVP

```bash
# Install dependencies (if not already done)
npm install

# Start the Node.js frontend server
npm start

# Open browser
open http://localhost:3000
```

### 3. Test the System

**Test Chat Interface (MVP):**
- Visit http://localhost:3000
- Chat with Marcus using the existing MVP interface

**Test FastAPI Backend (Direct):**
```bash
# Create a task via Marcus
curl -X POST http://localhost:8000/api/v2/agents/marcus/task \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test microservices architecture",
    "description": "Verify Marcus can create tasks",
    "priority": "high",
    "status": "pending"
  }'

# Get all tasks
curl http://localhost:8000/api/v2/agents/marcus/tasks

# Upload a file via Letitia
curl -X POST http://localhost:8000/api/v2/agents/letitia/upload \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "test-document.pdf",
    "file_type": "document",
    "file_size": 102400,
    "tags": ["test", "documentation"]
  }'

# Search files
curl -X POST http://localhost:8000/api/v2/agents/letitia/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "test",
    "limit": 10
  }'
```

**Test Redis Events:**
```bash
# Monitor Redis events in real-time
docker exec -it $(docker ps -qf "name=redis") redis-cli
> SUBSCRIBE skyras:tasks
> SUBSCRIBE skyras:files
> SUBSCRIBE skyras:system
```

**Test Agent Status:**
```bash
curl http://localhost:8000/api/v2/agents/status
```

## 📁 Project Structure

```
~/Projects/skyras-v2/
├── docker-compose.yml           # Docker services configuration
├── init.sql                     # Database schema initialization
├── server.js                    # Node.js MVP frontend (port 3000)
├── package.json                 # Node.js dependencies
│
├── shared/                      # Shared Python libraries
│   ├── events.py               # Redis pub/sub event system
│   ├── models.py               # Pydantic data models
│   └── redis_client.py         # Redis client utilities
│
├── services/
│   ├── hub/                    # FastAPI Hub (port 8000)
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   └── main.py            # Central orchestration API
│   │
│   ├── marcus/                # Marcus Agent (port 8001)
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   ├── main.py           # Task management agent
│   │   └── mocks/
│   │       ├── calendar.py   # Mock Cal.com integration
│   │       ├── plane.py      # Mock Plane.so integration
│   │       └── n8n.py        # Mock n8n workflows
│   │
│   └── letitia/              # Letitia Agent (port 8002)
│       ├── Dockerfile
│       ├── requirements.txt
│       └── main.py          # Library management agent
│
└── docs/
    └── service-graph.md     # Architecture diagrams
```

## 🔧 Services

### FastAPI Hub (Port 8000)
**Central orchestration API**
- Routes requests to appropriate agents
- Publishes/subscribes to Redis events
- Aggregates responses from multiple agents

**Key Endpoints:**
- `POST /api/v2/agents/marcus/task` - Create task via Marcus
- `GET /api/v2/agents/marcus/tasks` - Get all tasks
- `POST /api/v2/agents/letitia/search` - Search files via Letitia
- `POST /api/v2/agents/letitia/upload` - Upload file via Letitia
- `GET /api/v2/agents/status` - Check agent health
- `GET /api/v2/events` - Get recent events

### Marcus Service (Port 8001)
**Task management & scheduling agent**
- Creates, updates, deletes tasks
- Mock integrations: Cal.com, Plane.so, n8n
- Publishes: `task.created`, `task.updated`, `task.deleted`
- Subscribes: `file.uploaded`

**Key Endpoints:**
- `POST /api/tasks` - Create task
- `GET /api/tasks` - Get all tasks
- `PUT /api/tasks/{id}` - Update task
- `DELETE /api/tasks/{id}` - Delete task
- `GET /api/calendar/events` - Get calendar events (mock)
- `GET /api/plane/issues` - Get Plane.so issues (mock)

### Letitia Service (Port 8002)
**Library & asset management agent**
- Manages file uploads and metadata
- Mock integrations: Supabase Storage, Meilisearch
- Publishes: `file.uploaded`, `file.tagged`, `file.deleted`
- Subscribes: `task.created`

**Key Endpoints:**
- `POST /api/files` - Create file record
- `GET /api/files` - Get all files
- `GET /api/files/{id}` - Get specific file
- `DELETE /api/files/{id}` - Delete file
- `POST /api/search` - Search files
- `POST /api/files/{id}/tags` - Add tags to file

### Redis (Port 6379)
**Event bus for inter-agent communication**

**Channels:**
- `skyras:tasks` - Task-related events
- `skyras:files` - File-related events
- `skyras:system` - System events

### PostgreSQL (Port 5432)
**Shared database**

**Tables:**
- `tasks` - Task records
- `files` - File metadata
- `task_files` - Task-file relationships
- `events` - Event audit trail

## 🔄 Event Flow Example

**Creating a Task with File Association:**

1. Frontend → Hub: `POST /api/v2/agents/marcus/task`
2. Hub → Marcus: Forward request
3. Marcus: Create task in database
4. Marcus → Redis: Publish `task.created` event to `skyras:tasks`
5. Letitia: Subscribe to event, receive notification
6. Letitia: Check if files should be associated
7. Letitia → Redis: Publish `file.associated` event
8. Hub: Aggregate responses
9. Hub → Frontend: Return complete response

## 🧪 Testing Checklist

### Phase 0 Success Criteria

- [ ] All Docker containers start successfully
- [ ] FastAPI Hub responds to health check
- [ ] Marcus can create/read/update/delete tasks
- [ ] Letitia can manage file records
- [ ] Redis receives and distributes events
- [ ] PostgreSQL stores data correctly
- [ ] Node.js MVP proxies requests to FastAPI
- [ ] Frontend chat still works with MVP backend
- [ ] Mock integrations return test data

### Test Commands

```bash
# Health checks
curl http://localhost:8000/health
curl http://localhost:8001/health
curl http://localhost:8002/health

# Create task
curl -X POST http://localhost:8000/api/v2/agents/marcus/task \
  -H "Content-Type: application/json" \
  -d '{"title":"Test task","priority":"high"}'

# Monitor events
docker exec -it $(docker ps -qf "name=redis") redis-cli MONITOR

# Check database
docker exec -it $(docker ps -qf "name=postgres") psql -U skyras -d skyras_v2 -c "SELECT * FROM tasks;"

# View logs
docker-compose logs marcus
docker-compose logs letitia
docker-compose logs fastapi-hub
```

## 🐛 Troubleshooting

### Services Won't Start
```bash
# Check Docker is running
docker info

# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Redis Connection Issues
```bash
# Check Redis is accessible
docker exec -it $(docker ps -qf "name=redis") redis-cli PING

# Should return: PONG
```

### Database Connection Issues
```bash
# Check PostgreSQL is running
docker exec -it $(docker ps -qf "name=postgres") psql -U skyras -d skyras_v2 -c "SELECT 1;"

# View database logs
docker-compose logs postgres
```

### Agent Not Responding
```bash
# Check agent logs
docker-compose logs marcus
docker-compose logs letitia

# Restart specific service
docker-compose restart marcus
```

### Frontend Proxy Issues
```bash
# Make sure FastAPI Hub is running
curl http://localhost:8000/health

# Install proxy middleware
npm install http-proxy-middleware

# Check server logs
npm start
```

## 📊 Monitoring

### View All Logs
```bash
docker-compose logs -f
```

### View Specific Service
```bash
docker-compose logs -f marcus
docker-compose logs -f letitia
docker-compose logs -f fastapi-hub
```

### Redis Event Monitoring
```bash
# Subscribe to all events
docker exec -it $(docker ps -qf "name=redis") redis-cli
> PSUBSCRIBE skyras:*
```

### Database Queries
```bash
# Connect to PostgreSQL
docker exec -it $(docker ps -qf "name=postgres") psql -U skyras -d skyras_v2

# Useful queries
SELECT * FROM tasks ORDER BY created_at DESC LIMIT 10;
SELECT * FROM files ORDER BY uploaded_at DESC LIMIT 10;
SELECT * FROM events ORDER BY created_at DESC LIMIT 20;
```

## 🔜 Next Steps (Post-POC)

Once this Phase 0 architecture is validated:

1. **Replace Mock Integrations**
   - Real Cal.com API
   - Real Plane.so API
   - Real Supabase Storage
   - Real Meilisearch
   - Real n8n workflows

2. **Add More Agents**
   - Ari (Audio Finisher)
   - Jamal (Distribution)
   - Giorgio (Creative Generator)

3. **Implement CrewAI**
   - Agent-to-agent delegation
   - Complex task orchestration
   - Multi-agent workflows

4. **Production Hardening**
   - Authentication & authorization
   - Rate limiting
   - Error handling
   - Logging & monitoring
   - CI/CD pipeline

5. **Scale Infrastructure**
   - Load balancing
   - Service mesh
   - Kubernetes deployment
   - Database replication

## 📖 Additional Documentation

- [Service Graph](docs/service-graph.md) - Visual architecture diagrams
- [API Documentation](http://localhost:8000/docs) - Auto-generated FastAPI docs
- [Event Types](shared/events.py) - Complete event type definitions
- [Data Models](shared/models.py) - All Pydantic models

## 🤝 Contributing

This is Phase 0 - a proof of concept. Focus on:
- Testing the event flow
- Validating the architecture
- Identifying bottlenecks
- Documenting issues

---

**Built with ❤️ for SkyRas v2 Adaptive Creative Operating System**



