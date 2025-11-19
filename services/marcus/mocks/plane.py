"""
Mock Plane.so Integration
Simulates project management and issue tracking
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any
import asyncio
import uuid


class PlaneMock:
    """Mock Plane.so project management service"""
    
    def __init__(self):
        self.issues = [
            {
                "id": str(uuid.uuid4()),
                "title": "Design new landing page",
                "description": "Create a modern, responsive landing page design",
                "state": "backlog",
                "priority": "high",
                "assignee": "designer@skyras.com",
                "created_at": (datetime.utcnow() - timedelta(days=2)).isoformat(),
                "updated_at": (datetime.utcnow() - timedelta(days=1)).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Implement user authentication",
                "description": "Add OAuth2 authentication with Google and GitHub",
                "state": "in-progress",
                "priority": "high",
                "assignee": "developer@skyras.com",
                "created_at": (datetime.utcnow() - timedelta(days=5)).isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Write API documentation",
                "description": "Document all REST API endpoints with examples",
                "state": "todo",
                "priority": "medium",
                "assignee": "developer@skyras.com",
                "created_at": (datetime.utcnow() - timedelta(days=1)).isoformat(),
                "updated_at": (datetime.utcnow() - timedelta(days=1)).isoformat()
            }
        ]
    
    async def get_issues(self) -> List[Dict[str, Any]]:
        """Get all issues"""
        await asyncio.sleep(0.1)  # Simulate API delay
        return self.issues
    
    async def create_issue(self, issue_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new issue"""
        await asyncio.sleep(0.1)  # Simulate API delay
        
        new_issue = {
            "id": str(uuid.uuid4()),
            "title": issue_data.get("title", "New Issue"),
            "description": issue_data.get("description", ""),
            "state": issue_data.get("state", "backlog"),
            "priority": issue_data.get("priority", "medium"),
            "assignee": issue_data.get("assignee"),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        self.issues.append(new_issue)
        print(f"📋 Plane.so issue created: {new_issue['title']}")
        return new_issue
    
    async def update_issue(self, issue_id: str, issue_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update an issue"""
        await asyncio.sleep(0.1)  # Simulate API delay
        
        for issue in self.issues:
            if issue["id"] == issue_id:
                issue.update(issue_data)
                issue["updated_at"] = datetime.utcnow().isoformat()
                print(f"📋 Plane.so issue updated: {issue['title']}")
                return issue
        
        raise ValueError(f"Issue {issue_id} not found")
    
    async def delete_issue(self, issue_id: str) -> bool:
        """Delete an issue"""
        await asyncio.sleep(0.1)  # Simulate API delay
        
        for i, issue in enumerate(self.issues):
            if issue["id"] == issue_id:
                deleted_issue = self.issues.pop(i)
                print(f"📋 Plane.so issue deleted: {deleted_issue['title']}")
                return True
        
        return False
    
    async def get_issue(self, issue_id: str) -> Dict[str, Any]:
        """Get a specific issue"""
        await asyncio.sleep(0.1)  # Simulate API delay
        
        for issue in self.issues:
            if issue["id"] == issue_id:
                return issue
        
        raise ValueError(f"Issue {issue_id} not found")



