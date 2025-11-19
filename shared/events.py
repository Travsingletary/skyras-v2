"""
SkyRas v2 Event System
Handles Redis pub/sub events for inter-agent communication
"""

import json
import redis
import asyncio
from datetime import datetime
from typing import Dict, Any, Optional, Callable
from dataclasses import dataclass, asdict


@dataclass
class SkyRasEvent:
    """Standard event structure for SkyRas v2"""
    event_type: str
    agent: str
    timestamp: str
    data: Dict[str, Any]
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'SkyRasEvent':
        return cls(**data)


class EventBus:
    """Redis-based event bus for inter-agent communication"""
    
    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis_client = redis.from_url(redis_url, decode_responses=True)
        self.pubsub = self.redis_client.pubsub()
        self.subscribers: Dict[str, list] = {}
    
    async def publish(self, event: SkyRasEvent, channel: str = None) -> None:
        """Publish an event to Redis"""
        if channel is None:
            channel = self._get_channel_for_event_type(event.event_type)
        
        event_data = json.dumps(event.to_dict())
        await asyncio.get_event_loop().run_in_executor(
            None, self.redis_client.publish, channel, event_data
        )
        print(f"📡 Published {event.event_type} from {event.agent} to {channel}")
    
    async def subscribe(self, channel: str, callback: Callable[[SkyRasEvent], None]) -> None:
        """Subscribe to a Redis channel"""
        if channel not in self.subscribers:
            self.subscribers[channel] = []
            await asyncio.get_event_loop().run_in_executor(
                None, self.pubsub.subscribe, channel
            )
        
        self.subscribers[channel].append(callback)
        print(f"👂 Subscribed to {channel}")
    
    async def listen(self) -> None:
        """Listen for events and call registered callbacks"""
        while True:
            try:
                message = await asyncio.get_event_loop().run_in_executor(
                    None, self.pubsub.get_message, timeout=1.0
                )
                
                if message and message['type'] == 'message':
                    event_data = json.loads(message['data'])
                    event = SkyRasEvent.from_dict(event_data)
                    
                    channel = message['channel']
                    if channel in self.subscribers:
                        for callback in self.subscribers[channel]:
                            try:
                                await callback(event)
                            except Exception as e:
                                print(f"❌ Error in callback for {channel}: {e}")
                
                await asyncio.sleep(0.1)
            except Exception as e:
                print(f"❌ Error in event listener: {e}")
                await asyncio.sleep(1)
    
    def _get_channel_for_event_type(self, event_type: str) -> str:
        """Map event types to Redis channels"""
        if event_type.startswith('task.'):
            return 'skyras:tasks'
        elif event_type.startswith('file.'):
            return 'skyras:files'
        else:
            return 'skyras:system'
    
    async def create_event(self, event_type: str, agent: str, data: Dict[str, Any]) -> SkyRasEvent:
        """Create a new event"""
        return SkyRasEvent(
            event_type=event_type,
            agent=agent,
            timestamp=datetime.utcnow().isoformat() + 'Z',
            data=data
        )


# Event type constants
class EventTypes:
    # Task events
    TASK_CREATED = "task.created"
    TASK_UPDATED = "task.updated"
    TASK_COMPLETED = "task.completed"
    TASK_DELETED = "task.deleted"
    SCHEDULE_CHANGED = "schedule.changed"
    
    # File events
    FILE_UPLOADED = "file.uploaded"
    FILE_TAGGED = "file.tagged"
    FILE_DELETED = "file.deleted"
    SEARCH_INDEXED = "search.indexed"
    FILE_ASSOCIATED = "file.associated"
    
    # System events
    AGENT_STARTED = "agent.started"
    AGENT_STOPPED = "agent.stopped"
    HEALTH_CHECK = "system.health_check"


# Global event bus instance
event_bus = None

def get_event_bus(redis_url: str = "redis://localhost:6379") -> EventBus:
    """Get or create the global event bus instance"""
    global event_bus
    if event_bus is None:
        event_bus = EventBus(redis_url)
    return event_bus



