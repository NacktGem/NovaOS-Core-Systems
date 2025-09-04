import os
import json
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urlparse

import redis.asyncio as aioredis


def _parse_redis_db_from_url(redis_url: str) -> int:
    """Parse Redis database number from URL, defaulting to 0."""
    try:
        parsed = urlparse(redis_url)
        if parsed.path and len(parsed.path) > 1:
            # Extract DB number from path like '/2'
            db_str = parsed.path.lstrip('/')
            return int(db_str) if db_str.isdigit() else 0
    except:
        pass
    return 0

class RedisBus:
    """
    A simple Redis Streams client for task and result queues.
    Uses consumer groups to ensure at-least-once delivery. Messages
    are JSON-encoded dictionaries. Applications can subclass this for
    specialized behavior.
    """

    def __init__(self, redis_url: str, stream_name: str, group_name: str, dlq_stream: Optional[str] = None, redis_db: Optional[int] = None) -> None:
        self.redis_url = redis_url
        self.stream_name = stream_name
        self.group_name = group_name
        self.dlq_stream = dlq_stream or f"{stream_name}:dlq"
        
        # Determine Redis DB
        if redis_db is not None:
            db_num = redis_db
        elif os.getenv("REDIS_DB"):
            db_num = int(os.getenv("REDIS_DB"))
        else:
            db_num = _parse_redis_db_from_url(redis_url)
        
        # Create base URL without database path
        parsed = urlparse(redis_url)
        base_url = f"{parsed.scheme}://{parsed.netloc}"
        
        self.client: aioredis.Redis = aioredis.from_url(base_url, db=db_num, decode_responses=True)
        
        # Log Redis connection for audit (basic print since this is a utility class)
        print(f"RedisBus: Connected to Redis database {db_num} at {base_url}")

    async def ensure_group(self) -> None:
        """Create the stream and consumer group if they do not already exist."""
        try:
            # mkstream ensures the stream is created if it does not exist
            await self.client.xgroup_create(name=self.stream_name, groupname=self.group_name, id="0", mkstream=True)
        except aioredis.ResponseError:
            # group already exists
            pass

    async def publish(self, message: Dict[str, Any]) -> str:
        """Publish a message to the stream. Returns the entry ID."""
        # Redis will assign an ID automatically when '*' is used
        entry_id = await self.client.xadd(self.stream_name, fields={"data": json.dumps(message)})
        return entry_id

    async def consume(self, consumer_name: str, count: int = 1, block_ms: int = 5000) -> List[Tuple[str, Dict[str, Any]]]:
        """
        Consume messages for this consumer from the group. Returns a list of
        (entry_id, message dict) pairs. If no messages are available, returns
        an empty list after the block timeout.
        """
        streams = {self.stream_name: ">"}
        try:
            entries = await self.client.xreadgroup(groupname=self.group_name, consumername=consumer_name, streams=streams, count=count, block=block_ms)
        except aioredis.RedisError:
            return []

        results: List[Tuple[str, Dict[str, Any]]] = []
        for _, msgs in entries:
            for entry_id, fields in msgs:
                data = fields.get("data")
                try:
                    payload = json.loads(data) if data else {}
                except json.JSONDecodeError:
                    payload = {}
                results.append((entry_id, payload))
        return results

    async def ack(self, entry_id: str) -> None:
        """Acknowledge processing of a message."""
        await self.client.xack(self.stream_name, self.group_name, entry_id)

    async def move_to_dlq(self, entry_id: str, payload: Dict[str, Any]) -> None:
        """
        Move a failed message to the dead-letter queue and acknowledge it on
        the main stream.
        """
        # Publish to DLQ
        await self.client.xadd(self.dlq_stream, fields={"data": json.dumps(payload)})
        # Acknowledge original message
        await self.client.xack(self.stream_name, self.group_name, entry_id)

    async def close(self) -> None:
        await self.client.close()
