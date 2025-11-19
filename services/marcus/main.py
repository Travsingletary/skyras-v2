"""
Marcus Agent - Task Management & Scheduling
SkyRas v2 Project Manager Agent
"""

import os
import asyncio
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, List
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from shared.models import (
    TaskCreate, Task, TaskUpdate, TaskListResponse, APIResponse
)
from shared.redis_client import get_redis_client
from shared.events import get_event_bus, EventTypes
from mocks.calendar import CalendarMock
from mocks.plane import PlaneMock
from mocks.n8n import N8nMock
from skysky.episode_manager import EpisodeManager
from skysky.resolve_api import ResolveAPI
from skysky.notion_client import NotionClient


# Initialize Redis and Event Bus
redis_client = get_redis_client()
event_bus = get_event_bus()

# Initialize mock services
calendar_mock = CalendarMock()
plane_mock = PlaneMock()
n8n_mock = N8nMock()

# Initialize SkySky services
episode_manager = EpisodeManager()
resolve_api = ResolveAPI()
notion_client = NotionClient()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    print("🚀 Starting Marcus Agent (Task Management)...")
    
    # Start event listener in background
    asyncio.create_task(event_bus.listen())
    
    # Publish agent started event
    event = await event_bus.create_event(
        EventTypes.AGENT_STARTED,
        "marcus",
        {"version": "1.0.0", "capabilities": ["task_management", "scheduling"]}
    )
    await event_bus.publish(event)
    
    yield
    
    print("🛑 Shutting down Marcus Agent...")


app = FastAPI(
    title="Marcus Agent",
    description="Task Management & Scheduling Agent for SkyRas v2",
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
        "agent": "marcus",
        "version": "1.0.0"
    }


# Task management endpoints
@app.post("/api/tasks", response_model=APIResponse)
async def create_task(task: TaskCreate, background_tasks: BackgroundTasks):
    """Create a new task"""
    try:
        # Generate task ID
        task_id = str(uuid.uuid4())
        
        # Create task object
        new_task = Task(
            id=task_id,
            title=task.title,
            description=task.description,
            status=task.status,
            priority=task.priority,
            due_date=task.due_date,
            created_by=task.created_by or "marcus",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        # Store in Redis (in production, this would be in database)
        redis_client.set(f"task:{task_id}", new_task.dict())
        
        # Add to task list
        redis_client.lpush("tasks:list", task_id)
        
        # Publish task created event
        event = await event_bus.create_event(
            EventTypes.TASK_CREATED,
            "marcus",
            new_task.dict()
        )
        await event_bus.publish(event)
        
        # Trigger n8n webhook (mock)
        background_tasks.add_task(n8n_mock.trigger_task_created, new_task.dict())
        
        # Create calendar event if due date is set
        if task.due_date:
            background_tasks.add_task(calendar_mock.create_event, {
                "title": task.title,
                "start": task.due_date.isoformat(),
                "description": task.description
            })
        
        return APIResponse(
            success=True,
            message="Task created successfully",
            data=new_task.dict()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating task: {str(e)}")


@app.get("/api/tasks", response_model=TaskListResponse)
async def get_tasks():
    """Get all tasks"""
    try:
        # Get all task IDs
        task_ids = redis_client.lrange("tasks:list", 0, -1)
        tasks = []
        
        for task_id in task_ids:
            task_data = redis_client.get(f"task:{task_id}")
            if task_data:
                tasks.append(task_data)
        
        return TaskListResponse(
            success=True,
            message="Tasks retrieved successfully",
            data=tasks
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving tasks: {str(e)}")


@app.get("/api/tasks/{task_id}", response_model=APIResponse)
async def get_task(task_id: str):
    """Get a specific task"""
    try:
        task_data = redis_client.get(f"task:{task_id}")
        if not task_data:
            raise HTTPException(status_code=404, detail="Task not found")
        
        return APIResponse(
            success=True,
            message="Task retrieved successfully",
            data=task_data
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving task: {str(e)}")


@app.put("/api/tasks/{task_id}", response_model=APIResponse)
async def update_task(task_id: str, task_update: TaskUpdate, background_tasks: BackgroundTasks):
    """Update a task"""
    try:
        # Get existing task
        task_data = redis_client.get(f"task:{task_id}")
        if not task_data:
            raise HTTPException(status_code=404, detail="Task not found")
        
        # Update task with new data
        updated_data = task_data.copy()
        for field, value in task_update.dict(exclude_unset=True).items():
            updated_data[field] = value
        
        updated_data["updated_at"] = datetime.utcnow().isoformat()
        
        # Store updated task
        redis_client.set(f"task:{task_id}", updated_data)
        
        # Publish task updated event
        event = await event_bus.create_event(
            EventTypes.TASK_UPDATED,
            "marcus",
            updated_data
        )
        await event_bus.publish(event)
        
        # Trigger n8n webhook (mock)
        background_tasks.add_task(n8n_mock.trigger_task_updated, updated_data)
        
        return APIResponse(
            success=True,
            message="Task updated successfully",
            data=updated_data
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating task: {str(e)}")


@app.delete("/api/tasks/{task_id}", response_model=APIResponse)
async def delete_task(task_id: str, background_tasks: BackgroundTasks):
    """Delete a task"""
    try:
        # Get existing task
        task_data = redis_client.get(f"task:{task_id}")
        if not task_data:
            raise HTTPException(status_code=404, detail="Task not found")
        
        # Remove from Redis
        redis_client.delete(f"task:{task_id}")
        redis_client.lrem("tasks:list", 0, task_id)
        
        # Publish task deleted event
        event = await event_bus.create_event(
            EventTypes.TASK_DELETED,
            "marcus",
            {"task_id": task_id}
        )
        await event_bus.publish(event)
        
        # Trigger n8n webhook (mock)
        background_tasks.add_task(n8n_mock.trigger_task_deleted, {"task_id": task_id})
        
        return APIResponse(
            success=True,
            message="Task deleted successfully",
            data={"task_id": task_id}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting task: {str(e)}")


# Calendar integration endpoints
@app.get("/api/calendar/events")
async def get_calendar_events():
    """Get calendar events from Cal.com (mock)"""
    try:
        events = await calendar_mock.get_events()
        return APIResponse(
            success=True,
            message="Calendar events retrieved successfully",
            data={"events": events}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving calendar events: {str(e)}")


# Plane.so integration endpoints
@app.get("/api/plane/issues")
async def get_plane_issues():
    """Get issues from Plane.so (mock)"""
    try:
        issues = await plane_mock.get_issues()
        return APIResponse(
            success=True,
            message="Plane.so issues retrieved successfully",
            data={"issues": issues}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving Plane.so issues: {str(e)}")


# SkySky Show endpoints
@app.post("/api/skysky/episodes")
async def create_episode(episode_data: Dict[str, Any], background_tasks: BackgroundTasks):
    """Create a new SkySky Show episode"""
    try:
        result = await episode_manager.create_episode(
            title=episode_data.get('title'),
            episode_number=episode_data.get('episode_number'),
            theme=episode_data.get('theme'),
            tagline=episode_data.get('tagline')
        )
        
        if result['success']:
            # Create Notion page if configured
            if notion_client.is_configured():
                background_tasks.add_task(
                    notion_client.create_episode_page,
                    result['episode']
                )
                background_tasks.add_task(
                    notion_client.create_scene_tasks,
                    result['episode']['id'],
                    result['scenes']
                )
        
        return APIResponse(
            success=result['success'],
            message=result.get('message', 'Episode created'),
            data=result
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating episode: {str(e)}")


@app.get("/api/skysky/episodes/{episode_id}")
async def get_episode_status(episode_id: str):
    """Get episode status with scenes"""
    try:
        result = await episode_manager.get_episode_status(episode_id)
        return APIResponse(
            success=result['success'],
            message=result.get('message', 'Episode status retrieved'),
            data=result
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting episode status: {str(e)}")


@app.put("/api/skysky/episodes/{episode_id}/scene")
async def update_scene_status(episode_id: str, scene_data: Dict[str, Any], background_tasks: BackgroundTasks):
    """Update scene status"""
    try:
        result = await episode_manager.update_scene_status(
            episode_id=episode_id,
            scene_number=scene_data.get('scene_number'),
            status=scene_data.get('status'),
            error_message=scene_data.get('error_message')
        )
        
        if result['success'] and notion_client.is_configured():
            # Update Notion task status
            background_tasks.add_task(
                notion_client.update_scene_status,
                scene_data.get('task_id'),
                scene_data.get('status'),
                scene_data.get('error_message')
            )
        
        return APIResponse(
            success=result['success'],
            message=result.get('message', 'Scene status updated'),
            data=result
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating scene status: {str(e)}")


@app.post("/api/skysky/resolve/create")
async def create_resolve_project(project_data: Dict[str, Any]):
    """Create DaVinci Resolve project"""
    try:
        if not resolve_api.is_available():
            return APIResponse(
                success=False,
                message="DaVinci Resolve not available",
                data={"error": "Resolve API not connected"}
            )
        
        result = resolve_api.create_project(
            project_name=project_data.get('project_name'),
            project_path=project_data.get('project_path')
        )
        
        return APIResponse(
            success=result['success'],
            message=result.get('message', 'Resolve project created'),
            data=result
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating Resolve project: {str(e)}")


@app.post("/api/skysky/resolve/import")
async def import_media_to_resolve(import_data: Dict[str, Any]):
    """Import media to Resolve project"""
    try:
        if not resolve_api.is_available():
            return APIResponse(
                success=False,
                message="DaVinci Resolve not available",
                data={"error": "Resolve API not connected"}
            )
        
        result = resolve_api.import_media_from_folder(
            folder_path=import_data.get('folder_path')
        )
        
        return APIResponse(
            success=result['success'],
            message=result.get('message', 'Media imported'),
            data=result
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error importing media: {str(e)}")


@app.post("/api/skysky/resolve/build")
async def build_scene_timelines(timeline_data: Dict[str, Any]):
    """Build scene timelines in Resolve"""
    try:
        if not resolve_api.is_available():
            return APIResponse(
                success=False,
                message="DaVinci Resolve not available",
                data={"error": "Resolve API not connected"}
            )
        
        result = resolve_api.build_scene_timelines(
            episode_id=timeline_data.get('episode_id'),
            scenes=timeline_data.get('scenes', [])
        )
        
        return APIResponse(
            success=result['success'],
            message=result.get('message', 'Timelines built'),
            data=result
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error building timelines: {str(e)}")


@app.post("/api/skysky/trigger-agent")
async def trigger_agent(trigger_data: Dict[str, Any]):
    """Trigger another agent via n8n"""
    try:
        result = await episode_manager.trigger_agent(
            agent_name=trigger_data.get('agent_name'),
            task_data=trigger_data.get('task_data', {})
        )
        
        return APIResponse(
            success=result['success'],
            message=result.get('message', 'Agent triggered'),
            data=result
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error triggering agent: {str(e)}")


# Event handlers
async def handle_file_uploaded(event):
    """Handle file uploaded event from Letitia"""
    print(f"📁 Marcus received file uploaded event: {event.data}")
    
    # Check if file is related to any tasks
    # This is where Marcus would analyze file metadata and associate with tasks
    pass


# Subscribe to file events
async def setup_event_subscriptions():
    """Set up event subscriptions"""
    await event_bus.subscribe("skyras:files", handle_file_uploaded)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

