"""
SkyRas v2 Redis Client
Centralized Redis connection and utilities
"""

import redis
import json
import asyncio
from typing import Any, Optional, Dict
import os


class RedisClient:
    """Centralized Redis client for SkyRas v2"""
    
    def __init__(self, redis_url: str = None):
        self.redis_url = redis_url or os.getenv('REDIS_URL', 'redis://localhost:6379')
        self.client = redis.from_url(self.redis_url, decode_responses=True)
        self.pubsub = self.client.pubsub()
    
    def ping(self) -> bool:
        """Check if Redis is accessible"""
        try:
            return self.client.ping()
        except Exception:
            return False
    
    def set(self, key: str, value: Any, expire: Optional[int] = None) -> bool:
        """Set a key-value pair in Redis"""
        try:
            if isinstance(value, (dict, list)):
                value = json.dumps(value)
            return self.client.set(key, value, ex=expire)
        except Exception as e:
            print(f"❌ Redis SET error: {e}")
            return False
    
    def get(self, key: str) -> Optional[Any]:
        """Get a value from Redis"""
        try:
            value = self.client.get(key)
            if value is None:
                return None
            
            # Try to parse as JSON
            try:
                return json.loads(value)
            except (json.JSONDecodeError, TypeError):
                return value
        except Exception as e:
            print(f"❌ Redis GET error: {e}")
            return None
    
    def delete(self, key: str) -> bool:
        """Delete a key from Redis"""
        try:
            return bool(self.client.delete(key))
        except Exception as e:
            print(f"❌ Redis DELETE error: {e}")
            return False
    
    def publish(self, channel: str, message: Any) -> int:
        """Publish a message to a Redis channel"""
        try:
            if isinstance(message, (dict, list)):
                message = json.dumps(message)
            return self.client.publish(channel, message)
        except Exception as e:
            print(f"❌ Redis PUBLISH error: {e}")
            return 0
    
    def subscribe(self, *channels: str):
        """Subscribe to Redis channels"""
        try:
            self.pubsub.subscribe(*channels)
        except Exception as e:
            print(f"❌ Redis SUBSCRIBE error: {e}")
    
    def unsubscribe(self, *channels: str):
        """Unsubscribe from Redis channels"""
        try:
            self.pubsub.unsubscribe(*channels)
        except Exception as e:
            print(f"❌ Redis UNSUBSCRIBE error: {e}")
    
    def get_message(self, timeout: float = 1.0) -> Optional[Dict[str, Any]]:
        """Get a message from subscribed channels"""
        try:
            message = self.pubsub.get_message(timeout=timeout)
            if message and message['type'] == 'message':
                # Try to parse data as JSON
                try:
                    message['data'] = json.loads(message['data'])
                except (json.JSONDecodeError, TypeError):
                    pass
            return message
        except Exception as e:
            print(f"❌ Redis GET_MESSAGE error: {e}")
            return None
    
    def lpush(self, key: str, *values: Any) -> int:
        """Push values to the left of a list"""
        try:
            serialized_values = []
            for value in values:
                if isinstance(value, (dict, list)):
                    serialized_values.append(json.dumps(value))
                else:
                    serialized_values.append(str(value))
            return self.client.lpush(key, *serialized_values)
        except Exception as e:
            print(f"❌ Redis LPUSH error: {e}")
            return 0
    
    def rpop(self, key: str) -> Optional[Any]:
        """Pop a value from the right of a list"""
        try:
            value = self.client.rpop(key)
            if value is None:
                return None
            
            # Try to parse as JSON
            try:
                return json.loads(value)
            except (json.JSONDecodeError, TypeError):
                return value
        except Exception as e:
            print(f"❌ Redis RPOP error: {e}")
            return None
    
    def llen(self, key: str) -> int:
        """Get the length of a list"""
        try:
            return self.client.llen(key)
        except Exception as e:
            print(f"❌ Redis LLEN error: {e}")
            return 0
    
    def keys(self, pattern: str = "*") -> list:
        """Get keys matching a pattern"""
        try:
            return self.client.keys(pattern)
        except Exception as e:
            print(f"❌ Redis KEYS error: {e}")
            return []
    
    def flushdb(self) -> bool:
        """Flush the current database"""
        try:
            return self.client.flushdb()
        except Exception as e:
            print(f"❌ Redis FLUSHDB error: {e}")
            return False


# Global Redis client instance
redis_client = None

def get_redis_client(redis_url: str = None) -> RedisClient:
    """Get or create the global Redis client instance"""
    global redis_client
    if redis_client is None:
        redis_client = RedisClient(redis_url)
    return redis_client



