# 🚀 Getting Started with SkyRas v2 Phase 0

## Quick Start Guide

This guide will get you up and running with the SkyRas v2 microservices architecture in **5 minutes**.

---

## Prerequisites

✅ **Docker Desktop** installed and running  
✅ **Node.js 18+** installed  
✅ Terminal/command line access

---

## Step 1: Start the Microservices

```bash
# Navigate to project directory
cd ~/Projects/skyras-v2

# Start all Docker services
docker-compose up -d

# Wait ~30 seconds for services to initialize
```

### Verify Services Are Running

```bash
# Check Docker containers
docker-compose ps

# Should show 5 containers running:
# - redis
# - postgres
# - fastapi-hub
# - marcus
# - letitia
```

---

## Step 2: Test the Backend

```bash
# Test FastAPI Hub
curl http://localhost:8000/health
# Expected: {"status":"healthy","timestamp":"...","service":"skyras-v2-hub"}

# Test Marcus Agent
curl http://localhost:8001/health
# Expected: {"status":"healthy","timestamp":"...","agent":"marcus"}

# Test Letitia Agent
curl http://localhost:8002/health
# Expected: {"status":"healthy","timestamp":"...","agent":"letitia"}
```

✅ **All three should return healthy responses**

---

## Step 3: Start the Frontend

```bash
# Install Node.js dependencies (first time only)
npm install

# Start the Node.js MVP frontend
npm start

# Expected output:
# 🚀 SkyRas v2 running on port 3000
# 📱 Open: http://localhost:3000
```

---

## Step 4: Open the Dashboard

1. **Open your browser**
2. **Navigate to**: `http://localhost:3000`
3. **You should see**: SkyRas v2 dashboard with Marcus chat interface

---

## Step 5: Test the System

### Test 1: MVP Chat (Legacy)

In the chat interface, type:
```
Show me tasks due this week
```

**Expected**: Marcus responds with mock task data (from MVP backend)

---

### Test 2: Create Task via Microservices

```bash
curl -X POST http://localhost:8000/api/v2/agents/marcus/task \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test microservices",
    "description": "Verify the new architecture works",
    "priority": "high",
    "status": "pending"
  }'
```

**Expected**: Task created successfully with JSON response

---

### Test 3: Get All Tasks

```bash
curl http://localhost:8000/api/v2/agents/marcus/tasks
```

**Expected**: List of tasks including the one you just created

---

### Test 4: Upload File to Letitia

```bash
curl -X POST http://localhost:8000/api/v2/agents/letitia/upload \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "test-document.pdf",
    "file_type": "document",
    "file_size": 102400,
    "tags": ["test", "poc"]
  }'
```

**Expected**: File uploaded successfully

---

### Test 5: Monitor Redis Events

```bash
# Open Redis CLI
docker exec -it $(docker ps -qf "name=redis") redis-cli

# Subscribe to events
SUBSCRIBE skyras:tasks skyras:files skyras:system

# In another terminal, create a task (from Test 2)
# You should see events appear in real-time!
```

---

## 🎉 Success Criteria

You've successfully set up SkyRas v2 Phase 0 if:

- ✅ All 5 Docker containers are running
- ✅ Health checks return "healthy" for all services
- ✅ Frontend loads at http://localhost:3000
- ✅ Marcus MVP chat responds
- ✅ New task can be created via API
- ✅ Redis events are flowing
- ✅ Database stores data correctly

---

## 🐛 Troubleshooting

### Problem: Docker containers won't start

```bash
# Check Docker is running
docker info

# Restart Docker Desktop
# Then try again:
docker-compose down
docker-compose up -d
```

---

### Problem: Port already in use

```bash
# Check what's using the ports
lsof -i :3000  # Frontend
lsof -i :8000  # FastAPI Hub
lsof -i :8001  # Marcus
lsof -i :8002  # Letitia
lsof -i :6379  # Redis
lsof -i :5432  # PostgreSQL

# Kill the process or change ports in docker-compose.yml
```

---

### Problem: Services unhealthy

```bash
# View logs
docker-compose logs fastapi-hub
docker-compose logs marcus
docker-compose logs letitia

# Restart specific service
docker-compose restart marcus
```

---

### Problem: Frontend can't connect to backend

```bash
# Make sure proxy middleware is installed
npm install http-proxy-middleware

# Check FastAPI Hub is running
curl http://localhost:8000/health

# Restart frontend
npm start
```

---

### Problem: Database connection failed

```bash
# Check PostgreSQL is running
docker-compose logs postgres

# Verify database exists
docker exec -it $(docker ps -qf "name=postgres") psql -U skyras -d skyras_v2 -c "SELECT 1;"

# If database doesn't exist, recreate containers
docker-compose down -v
docker-compose up -d
```

---

## 📊 View System Status

### Check All Services

```bash
# One-liner to check all services
curl -s http://localhost:8000/api/v2/agents/status | json_pp
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f marcus

# Last 100 lines
docker-compose logs --tail=100
```

### Database Queries

```bash
# Connect to database
docker exec -it $(docker ps -qf "name=postgres") psql -U skyras -d skyras_v2

# View tasks
SELECT * FROM tasks;

# View files
SELECT * FROM files;

# View events
SELECT * FROM events ORDER BY created_at DESC LIMIT 10;

# Exit
\q
```

### Redis Monitoring

```bash
# Connect to Redis
docker exec -it $(docker ps -qf "name=redis") redis-cli

# View all keys
KEYS *

# Get task data
GET task:YOUR_TASK_ID

# Monitor all commands
MONITOR

# Exit
exit
```

---

## 🔄 Restart Everything

```bash
# Stop all services
docker-compose down

# Start fresh (removes volumes/data)
docker-compose down -v
docker-compose up -d

# Rebuild containers (after code changes)
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## 📚 Next Steps

Once everything is working:

1. **Read the Architecture**: `README_MICROSERVICES.md`
2. **View Service Graph**: `docs/service-graph.md`
3. **Test Event Flow**: Create tasks and watch Redis events
4. **Explore APIs**: http://localhost:8000/docs (FastAPI auto-docs)
5. **Monitor Logs**: `docker-compose logs -f`

---

## 🎯 What You've Built

You now have a **fully functional microservices architecture** with:

- **2 AI Agents**: Marcus (task mgmt) & Letitia (library mgmt)
- **Event Bus**: Redis pub/sub for inter-agent communication
- **Shared Database**: PostgreSQL for persistent storage
- **Central Hub**: FastAPI orchestration layer
- **Frontend**: Existing Node.js MVP + proxy to new backend
- **Mock Integrations**: Cal.com, Plane.so, n8n, Supabase, Meilisearch

This is the **Phase 0 proof-of-concept** - ready to validate and expand!

---

## 💬 Need Help?

Check the logs first:
```bash
docker-compose logs -f
```

Common issues are usually:
- Port conflicts
- Docker not running
- Missing dependencies
- Database not initialized

See **README_MICROSERVICES.md** for detailed troubleshooting.

---

**Built with ❤️ for SkyRas v2**


