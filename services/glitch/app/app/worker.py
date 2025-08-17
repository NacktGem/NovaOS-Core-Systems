"""Glitch worker module.

This worker subscribes to moderation tasks from the Redis bus and applies
basic heuristic rules to detect problematic content. When a message is
flagged, an event is emitted to the results stream for further handling
by core-api and Audita services.
"""

import asyncio
import json
from typing import Any, Dict

from agent_core import AgentWorker, RedisBus


# Simple banned keywords list; in production this could be a ML model or rule set
BANNED_KEYWORDS = {"spam", "hate", "illegal", "violence"}


class GlitchWorker(AgentWorker):
    async def handle_task(self, task: Dict[str, Any]) -> None:
        """
        Inspect the incoming task payload. Expects keys like 'message_id',
        'room_id', and 'content'. If banned keywords are detected in the
        content, flag the message for moderation.
        """
        content = (task.get("content") or "").lower()
        message_id = task.get("message_id")
        room_id = task.get("room_id")

        flagged = False
        reason = None
        for keyword in BANNED_KEYWORDS:
            if keyword in content:
                flagged = True
                reason = f"contains banned keyword '{keyword}'"
                break

        if flagged:
            # Construct a moderation.flagged event to publish to results bus
            flag_event = {
                "type": "moderation.flagged",
                "message_id": message_id,
                "room_id": room_id,
                "reason": reason,
                "severity": "high",
            }
            # Publish to results stream; this will be consumed by core-api glue
            await self.bus.client.xadd(
                self.bus.stream_name.replace("agents:tasks", "agents:results"),
                fields={"data": json.dumps(flag_event)},
            )
        # Simulate work time
        await asyncio.sleep(0)
