from typing import Any, Dict, List, Optional, Union, Literal
from pydantic import BaseModel


class TaskEnvelope(BaseModel):
    id: str
    type: str
    created_at: str
    priority: Optional[int] = None
    actor: Optional[str] = None
    payload: Any


class ResultEnvelope(BaseModel):
    id: str
    task_id: str
    status: Literal['ok', 'error']
    output: Optional[Any] = None
    error: Optional[str] = None


class ModerationFlagged(BaseModel):
    message_id: str
    room_id: str
    reason: str
    severity: Literal['low', 'medium', 'high']


class FeedUpdated(BaseModel):
    user_id: str
    feed_id: str
    items: List[str]


class SearchIndexed(BaseModel):
    entity: str
    entity_id: str


class AnalyticsSignal(BaseModel):
    event_name: str
    props: Optional[Dict[str, Any]] = None


AgentEvent = Union[ModerationFlagged, FeedUpdated, SearchIndexed, AnalyticsSignal]
