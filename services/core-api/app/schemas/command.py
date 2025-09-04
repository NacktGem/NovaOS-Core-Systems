from pydantic import BaseModel, Field
from typing import Optional, Literal, Dict

class AgentCommand(BaseModel):
    agent: str = Field(..., min_length=2, max_length=40)  # use "all" to broadcast
    op: Literal["ping", "cycle", "task"]
    args: Dict[str, str] = {}
    reply_to: Optional[str] = None