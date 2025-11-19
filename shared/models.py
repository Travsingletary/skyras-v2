"""
SkyRas v2 Data Models
Pydantic models for API serialization and validation
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import uuid


class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in-progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class FileType(str, Enum):
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"
    DOCUMENT = "document"
    ARCHIVE = "archive"
    OTHER = "other"


# Task Models
class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    status: TaskStatus = TaskStatus.PENDING
    priority: TaskPriority = TaskPriority.MEDIUM
    due_date: Optional[datetime] = None
    created_by: Optional[str] = None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    due_date: Optional[datetime] = None


class Task(TaskBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# File Models
class FileBase(BaseModel):
    filename: str = Field(..., min_length=1, max_length=255)
    file_path: Optional[str] = None
    file_type: Optional[FileType] = None
    file_size: Optional[int] = Field(None, ge=0)
    metadata: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None


class FileCreate(FileBase):
    pass


class FileUpdate(BaseModel):
    filename: Optional[str] = Field(None, min_length=1, max_length=255)
    file_path: Optional[str] = None
    file_type: Optional[FileType] = None
    metadata: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None


class File(FileBase):
    id: uuid.UUID
    uploaded_at: datetime
    
    class Config:
        from_attributes = True


# Task-File Relationship
class TaskFileAssociation(BaseModel):
    task_id: uuid.UUID
    file_id: uuid.UUID


# Event Models
class EventBase(BaseModel):
    event_type: str
    agent: str
    data: Dict[str, Any]


class Event(EventBase):
    id: uuid.UUID
    created_at: datetime
    
    class Config:
        from_attributes = True


# API Response Models
class APIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None


class TaskListResponse(APIResponse):
    data: List[Task]


class FileListResponse(APIResponse):
    data: List[File]


# Agent Status Models
class AgentStatus(BaseModel):
    name: str
    status: str
    last_seen: datetime
    version: Optional[str] = None


class HealthCheck(BaseModel):
    status: str
    timestamp: datetime
    services: Dict[str, AgentStatus]


# Search Models
class SearchQuery(BaseModel):
    query: str = Field(..., min_length=1)
    filters: Optional[Dict[str, Any]] = None
    limit: int = Field(10, ge=1, le=100)
    offset: int = Field(0, ge=0)


class SearchResult(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    type: str
    score: float
    metadata: Optional[Dict[str, Any]] = None


class SearchResponse(APIResponse):
    data: List[SearchResult]
    total: int
    query: str



