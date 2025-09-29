import uuid
from datetime import datetime
from pydantic import BaseModel, Field

class WSIn(BaseModel):
    body: str

class UserOut(BaseModel):
    id: uuid.UUID | None = None
    role: str

class WSOut(BaseModel):
    id: uuid.UUID | None = None
    body: str
    user: UserOut
    room: str
    ts: datetime = Field(default_factory=lambda: datetime.utcnow().replace(microsecond=0))
