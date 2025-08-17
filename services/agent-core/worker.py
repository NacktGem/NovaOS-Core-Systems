import asyncio
from typing import Any, Dict, Tuple, List, Optional

from .bus import RedisBus


class AgentWorker:
    """
    Base class for long-running agent workers that consume tasks from a
    Redis stream via a `RedisBus`. Subclasses must implement
    `handle_task()` to process each task.
    """

    def __init__(self, bus: RedisBus, consumer_name: str, *, max_retries: int = 3, retry_delay: float = 1.0) -> None:
        self.bus = bus
        self.consumer_name = consumer_name
        self.max_retries = max_retries
        self.retry_delay = retry_delay

    async def handle_task(self, task: Dict[str, Any]) -> None:
        """
        Override this method to implement task-specific logic.
        Should raise an exception if the task fails and should be retried.
        """
        raise NotImplementedError("AgentWorker subclasses must implement handle_task()")

    async def run_forever(self) -> None:
        """
        Continuously consume tasks from the bus and process them. Implements
        exponential backoff retries and DLQ behavior when the max retry
        threshold is exceeded.
        """
        await self.bus.ensure_group()
        while True:
            # Read a batch of messages (if available)
            messages = await self.bus.consume(consumer_name=self.consumer_name, count=10, block_ms=5000)
            if not messages:
                # Nothing to process; yield control
                await asyncio.sleep(0.1)
                continue

            for entry_id, payload in messages:
                retries = payload.get("_retries", 0)
                try:
                    await self.handle_task(payload)
                    await self.bus.ack(entry_id)
                except Exception:
                    # Decide whether to retry or move to DLQ
                    if retries < self.max_retries:
                        # schedule a retry: increment retry counter and republish
                        payload["_retries"] = retries + 1
                        await self.bus.publish(payload)
                        await self.bus.ack(entry_id)
                        # exponential backoff
                        await asyncio.sleep(self.retry_delay * (2 ** retries))
                    else:
                        # move to dead-letter queue
                        await self.bus.move_to_dlq(entry_id, payload)
            # short sleep to avoid tight loop
            await asyncio.sleep(0.0)
