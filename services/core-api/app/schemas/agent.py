from pydantic import BaseModel, Field
from typing import List, Optional

class AgentBeat(BaseModel):
    agent: str = Field(..., min_length=2, max_length=40)
    version: str = "1.0.0"
    host: Optional[str] = None
    pid: Optional[int] = None
    capabilities: List[str] = []