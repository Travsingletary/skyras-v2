"""
SkyRas v2 FastAPI Hub
Central orchestration API for agent communication
"""

import os
import asyncio
from datetime import datetime
from typing import Dict, Any, List
import httpx
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from shared.models import (
    TaskCreate, Task, TaskListResponse, APIResponse, 
    FileCreate, File, FileListResponse, SearchQuery, SearchResponse,
    AgentStatus, HealthCheck
)
from shared.redis_client import get_redis_client
from shared.events import get_event_bus, EventTypes


# Service URLs
MARCUS_SERVICE_URL = os.getenv('MARCUS_SERVICE_URL', 'http://localhost:8001')
LETITIA_SERVICE_URL = os.getenv('LETITIA_SERVICE_URL', 'http://localhost:8002')

# Initialize Redis and Event Bus
redis_client = get_redis_client()
event_bus = get_event_bus()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    print("🚀 Starting SkyRas v2 FastAPI Hub...")
    
    # Start event listener in background
    asyncio.create_task(event_bus.listen())
    
    yield
    
    print("🛑 Shutting down SkyRas v2 FastAPI Hub...")


app = FastAPI(
    title="SkyRas v2 Hub",
    description="Central orchestration API for SkyRas v2 agents",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "skyras-v2-hub"
    }


# Agent status endpoint
@app.get("/api/v2/agents/status")
async def get_agent_status():
    """Get status of all agents"""
    agents = {}
    
    # Check Marcus
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{MARCUS_SERVICE_URL}/health", timeout=5.0)
            agents["marcus"] = AgentStatus(
                name="Marcus",
                status="healthy" if response.status_code == 200 else "unhealthy",
                last_seen=datetime.utcnow()
            )
    except Exception:
        agents["marcus"] = AgentStatus(
            name="Marcus",
            status="unhealthy",
            last_seen=datetime.utcnow()
        )
    
    # Check Letitia
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{LETITIA_SERVICE_URL}/health", timeout=5.0)
            agents["letitia"] = AgentStatus(
                name="Letitia",
                status="healthy" if response.status_code == 200 else "unhealthy",
                last_seen=datetime.utcnow()
            )
    except Exception:
        agents["letitia"] = AgentStatus(
            name="Letitia",
            status="unhealthy",
            last_seen=datetime.utcnow()
        )
    
    return HealthCheck(
        status="healthy",
        timestamp=datetime.utcnow(),
        services=agents
    )


# Marcus agent routes
@app.post("/api/v2/agents/marcus/task", response_model=APIResponse)
async def create_task_via_marcus(task: TaskCreate, background_tasks: BackgroundTasks):
    """Create a task via Marcus agent"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{MARCUS_SERVICE_URL}/api/tasks",
                json=task.dict(),
                timeout=10.0
            )
            
            if response.status_code == 200:
                task_data = response.json()
                
                # Publish task created event
                event = await event_bus.create_event(
                    EventTypes.TASK_CREATED,
                    "marcus",
                    task_data
                )
                await event_bus.publish(event)
                
                return APIResponse(
                    success=True,
                    message="Task created successfully",
                    data=task_data
                )
            else:
                raise HTTPException(status_code=response.status_code, detail=response.text)
                
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Marcus service timeout")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating task: {str(e)}")


@app.get("/api/v2/agents/marcus/tasks", response_model=TaskListResponse)
async def get_tasks_via_marcus():
    """Get all tasks via Marcus agent"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{MARCUS_SERVICE_URL}/api/tasks", timeout=10.0)
            
            if response.status_code == 200:
                tasks = response.json()
                return TaskListResponse(
                    success=True,
                    message="Tasks retrieved successfully",
                    data=tasks
                )
            else:
                raise HTTPException(status_code=response.status_code, detail=response.text)
                
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Marcus service timeout")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving tasks: {str(e)}")


# Letitia agent routes
@app.post("/api/v2/agents/letitia/search", response_model=SearchResponse)
async def search_via_letitia(query: SearchQuery):
    """Search files via Letitia agent"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{LETITIA_SERVICE_URL}/api/search",
                json=query.dict(),
                timeout=10.0
            )
            
            if response.status_code == 200:
                search_data = response.json()
                return SearchResponse(
                    success=True,
                    message="Search completed successfully",
                    **search_data
                )
            else:
                raise HTTPException(status_code=response.status_code, detail=response.text)
                
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Letitia service timeout")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching files: {str(e)}")


@app.post("/api/v2/agents/letitia/upload", response_model=APIResponse)
async def upload_file_via_letitia(file_data: FileCreate):
    """Upload a file via Letitia agent"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{LETITIA_SERVICE_URL}/api/files",
                json=file_data.dict(),
                timeout=10.0
            )
            
            if response.status_code == 200:
                file_info = response.json()
                
                # Publish file uploaded event
                event = await event_bus.create_event(
                    EventTypes.FILE_UPLOADED,
                    "letitia",
                    file_info
                )
                await event_bus.publish(event)
                
                return APIResponse(
                    success=True,
                    message="File uploaded successfully",
                    data=file_info
                )
            else:
                raise HTTPException(status_code=response.status_code, detail=response.text)
                
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Letitia service timeout")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")


# Event stream endpoint
@app.get("/api/v2/events")
async def get_events():
    """Get recent events from Redis"""
    try:
        # Get recent events from Redis
        events = redis_client.lrange("skyras:events", 0, 99)  # Last 100 events
        return APIResponse(
            success=True,
            message="Events retrieved successfully",
            data={"events": events}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving events: {str(e)}")


# Cross-agent operations
@app.post("/api/v2/agents/associate-file-task")
async def associate_file_with_task(task_id: str, file_id: str):
    """Associate a file with a task (cross-agent operation)"""
    try:
        # Notify both agents
        event_data = {"task_id": task_id, "file_id": file_id}
        
        # Create association event
        event = await event_bus.create_event(
            "file.associated",
            "hub",
            event_data
        )
        await event_bus.publish(event)
        
        return APIResponse(
            success=True,
            message="File associated with task successfully",
            data=event_data
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error associating file with task: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)



