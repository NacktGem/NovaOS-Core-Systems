from typing import Any, Dict, Literal, Optional
from pydantic import BaseModel, Field

Level = Literal["debug", "info", "warn", "error"]

class AgentLog(BaseModel):
    agent: str = Field(..., min_length=2, max_length=40)
    level: Level = "info"
    msg: str = Field(..., min_length=1, max_length=4000)
    meta: Optional[Dict[str, Any]] = None