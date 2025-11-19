"""
Mock n8n Integration
Simulates workflow automation triggers
"""

from datetime import datetime
from typing import Dict, Any
import asyncio
import uuid


class N8nMock:
    """Mock n8n workflow automation service"""
    
    def __init__(self):
        self.workflows = {
            "task-created": {
                "id": "workflow-001",
                "name": "Task Created Workflow",
                "status": "active",
                "description": "Automatically notify team when new task is created"
            },
            "task-updated": {
                "id": "workflow-002", 
                "name": "Task Updated Workflow",
                "status": "active",
                "description": "Update project status when task is modified"
            },
            "task-deleted": {
                "id": "workflow-003",
                "name": "Task Deleted Workflow", 
                "status": "active",
                "description": "Clean up related resources when task is deleted"
            }
        }
        
        self.executions = []
    
    async def trigger_task_created(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Trigger workflow when task is created"""
        await asyncio.sleep(0.2)  # Simulate API delay
        
        execution = {
            "id": str(uuid.uuid4()),
            "workflow_id": self.workflows["task-created"]["id"],
            "status": "success",
            "triggered_at": datetime.utcnow().isoformat(),
            "data": {
                "task_id": task_data.get("id"),
                "task_title": task_data.get("title"),
                "action": "task_created"
            }
        }
        
        self.executions.append(execution)
        print(f"🔄 n8n workflow triggered: {execution['workflow_id']} for task {task_data.get('title')}")
        return execution
    
    async def trigger_task_updated(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Trigger workflow when task is updated"""
        await asyncio.sleep(0.2)  # Simulate API delay
        
        execution = {
            "id": str(uuid.uuid4()),
            "workflow_id": self.workflows["task-updated"]["id"],
            "status": "success",
            "triggered_at": datetime.utcnow().isoformat(),
            "data": {
                "task_id": task_data.get("id"),
                "task_title": task_data.get("title"),
                "action": "task_updated"
            }
        }
        
        self.executions.append(execution)
        print(f"🔄 n8n workflow triggered: {execution['workflow_id']} for task {task_data.get('title')}")
        return execution
    
    async def trigger_task_deleted(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Trigger workflow when task is deleted"""
        await asyncio.sleep(0.2)  # Simulate API delay
        
        execution = {
            "id": str(uuid.uuid4()),
            "workflow_id": self.workflows["task-deleted"]["id"],
            "status": "success",
            "triggered_at": datetime.utcnow().isoformat(),
            "data": {
                "task_id": task_data.get("task_id"),
                "action": "task_deleted"
            }
        }
        
        self.executions.append(execution)
        print(f"🔄 n8n workflow triggered: {execution['workflow_id']} for task deletion")
        return execution
    
    async def get_workflows(self) -> Dict[str, Any]:
        """Get all workflows"""
        await asyncio.sleep(0.1)  # Simulate API delay
        return {"workflows": list(self.workflows.values())}
    
    async def get_executions(self) -> Dict[str, Any]:
        """Get all executions"""
        await asyncio.sleep(0.1)  # Simulate API delay
        return {"executions": self.executions}
    
    async def webhook_handler(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Handle incoming webhook"""
        await asyncio.sleep(0.1)  # Simulate API delay
        
        webhook_response = {
            "id": str(uuid.uuid4()),
            "status": "received",
            "received_at": datetime.utcnow().isoformat(),
            "payload": payload
        }
        
        print(f"🔗 n8n webhook received: {webhook_response['id']}")
        return webhook_response



