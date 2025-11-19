"""Redis-backed memory helpers for SkyRas agents."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, Optional

from shared.redis_client import get_redis_client


class AgentMemory:
    """Lightweight namespace-aware memory interface backed by Redis."""

    def __init__(self, namespace: str, ttl_seconds: Optional[int] = None):
        self.namespace = namespace
        self.ttl = ttl_seconds
        self.redis = get_redis_client()

    def _key(self, suffix: str) -> str:
        return f"memory:{self.namespace}:{suffix}"

    def remember(self, slot: str, payload: Dict[str, Any]) -> bool:
        """Persist structured context for this agent (overwrites)."""
        record = {
            "payload": payload,
            "updated_at": datetime.utcnow().isoformat() + "Z",
        }
        return bool(self.redis.set(self._key(slot), record, expire=self.ttl))

    def recall(self, slot: str) -> Optional[Dict[str, Any]]:
        """Fetch structured context if available."""
        return self.redis.get(self._key(slot))

    def log_event(self, event: Dict[str, Any]) -> int:
        """Append an event to the agent timeline for auditing."""
        event.setdefault("timestamp", datetime.utcnow().isoformat() + "Z")
        return self.redis.lpush(self._key("events"), event)

    def pop_event(self) -> Optional[Dict[str, Any]]:
        """Read the most recent logged event (used for replay/testing)."""
        return self.redis.rpop(self._key("events"))


__all__ = ["AgentMemory"]
