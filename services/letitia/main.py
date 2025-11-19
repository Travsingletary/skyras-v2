"""
Letitia Agent - Library & Asset Management
SkyRas v2 Asset Library & Metadata Agent
"""

import os
import asyncio
import uuid
from datetime import datetime
from typing import Dict, Any, List
from fastapi import FastAPI, HTTPException, BackgroundTasks, UploadFile, File as FastAPIFile
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

import sys
sys.path.append('/app')

from shared.models import FileCreate, File, FileListResponse, APIResponse, SearchQuery, SearchResponse
from shared.redis_client import get_redis_client
from shared.events import get_event_bus, EventTypes


# Initialize Redis and Event Bus
redis_client = get_redis_client()
event_bus = get_event_bus()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    print("🚀 Starting Letitia Agent (Library & Asset Management)...")
    
    # Start event listener in background
    asyncio.create_task(event_bus.listen())
    
    # Publish agent started event
    event = await event_bus.create_event(
        EventTypes.AGENT_STARTED,
        "letitia",
        {"version": "1.0.0", "capabilities": ["file_management", "metadata_extraction", "search"]}
    )
    await event_bus.publish(event)
    
    yield
    
    print("🛑 Shutting down Letitia Agent...")


app = FastAPI(
    title="Letitia Agent",
    description="Library & Asset Management Agent for SkyRas v2",
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


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "agent": "letitia",
        "version": "1.0.0"
    }


@app.post("/api/files", response_model=APIResponse)
async def create_file(file_data: FileCreate, background_tasks: BackgroundTasks):
    """Create a file record"""
    try:
        file_id = str(uuid.uuid4())
        
        new_file = File(
            id=file_id,
            filename=file_data.filename,
            file_path=file_data.file_path or f"/uploads/{file_id}/{file_data.filename}",
            file_type=file_data.file_type,
            file_size=file_data.file_size or 0,
            metadata=file_data.metadata or {},
            tags=file_data.tags or [],
            uploaded_at=datetime.utcnow()
        )
        
        redis_client.set(f"file:{file_id}", new_file.dict())
        redis_client.lpush("files:list", file_id)
        
        event = await event_bus.create_event(
            EventTypes.FILE_UPLOADED,
            "letitia",
            new_file.dict()
        )
        await event_bus.publish(event)
        
        return APIResponse(
            success=True,
            message="File created successfully",
            data=new_file.dict()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating file: {str(e)}")


@app.get("/api/files", response_model=FileListResponse)
async def get_files():
    """Get all files"""
    try:
        file_ids = redis_client.lrange("files:list", 0, -1) or []
        files = []
        
        for file_id in file_ids:
            file_data = redis_client.get(f"file:{file_id}")
            if file_data:
                files.append(file_data)
        
        return FileListResponse(
            success=True,
            message="Files retrieved successfully",
            data=files
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving files: {str(e)}")


@app.post("/api/search", response_model=SearchResponse)
async def search_files(query: SearchQuery):
    """Search files (mock implementation)"""
    try:
        # Simple mock search - just return all files
        file_ids = redis_client.lrange("files:list", 0, query.limit - 1) or []
        results = []
        
        for file_id in file_ids:
            file_data = redis_client.get(f"file:{file_id}")
            if file_data and query.query.lower() in file_data.get('filename', '').lower():
                results.append({
                    "id": file_data['id'],
                    "title": file_data['filename'],
                    "description": f"File type: {file_data.get('file_type', 'unknown')}",
                    "type": "file",
                    "score": 1.0,
                    "metadata": file_data.get('metadata')
                })
        
        return SearchResponse(
            success=True,
            message="Search completed successfully",
            data=results,
            total=len(results),
            query=query.query
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching files: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)



