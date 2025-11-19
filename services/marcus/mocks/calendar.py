"""
Mock Cal.com Calendar Integration
Simulates calendar event management
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any
import asyncio


class CalendarMock:
    """Mock Cal.com calendar service"""
    
    def __init__(self):
        self.events = [
            {
                "id": "1",
                "title": "Team Standup",
                "start": (datetime.utcnow() + timedelta(days=1, hours=10)).isoformat(),
                "end": (datetime.utcnow() + timedelta(days=1, hours=10, minutes=30)).isoformat(),
                "description": "Daily team standup meeting"
            },
            {
                "id": "2", 
                "title": "Client Meeting",
                "start": (datetime.utcnow() + timedelta(days=2, hours=15)).isoformat(),
                "end": (datetime.utcnow() + timedelta(days=2, hours=16)).isoformat(),
                "description": "Project review with client"
            },
            {
                "id": "3",
                "title": "Sprint Planning",
                "start": (datetime.utcnow() + timedelta(days=3, hours=9)).isoformat(),
                "end": (datetime.utcnow() + timedelta(days=3, hours=11)).isoformat(),
                "description": "Weekly sprint planning session"
            }
        ]
    
    async def get_events(self) -> List[Dict[str, Any]]:
        """Get all calendar events"""
        await asyncio.sleep(0.1)  # Simulate API delay
        return self.events
    
    async def create_event(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new calendar event"""
        await asyncio.sleep(0.1)  # Simulate API delay
        
        new_event = {
            "id": str(len(self.events) + 1),
            "title": event_data.get("title", "New Event"),
            "start": event_data.get("start", datetime.utcnow().isoformat()),
            "end": event_data.get("end", (datetime.utcnow() + timedelta(hours=1)).isoformat()),
            "description": event_data.get("description", "")
        }
        
        self.events.append(new_event)
        print(f"📅 Calendar event created: {new_event['title']}")
        return new_event
    
    async def update_event(self, event_id: str, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a calendar event"""
        await asyncio.sleep(0.1)  # Simulate API delay
        
        for event in self.events:
            if event["id"] == event_id:
                event.update(event_data)
                print(f"📅 Calendar event updated: {event['title']}")
                return event
        
        raise ValueError(f"Event {event_id} not found")
    
    async def delete_event(self, event_id: str) -> bool:
        """Delete a calendar event"""
        await asyncio.sleep(0.1)  # Simulate API delay
        
        for i, event in enumerate(self.events):
            if event["id"] == event_id:
                deleted_event = self.events.pop(i)
                print(f"📅 Calendar event deleted: {deleted_event['title']}")
                return True
        
        return False



