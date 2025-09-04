from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    redis_url: str = "redis://redis:6379/0"
    redis_db: Optional[int] = None  # Allow override of Redis DB via env
    agent_shared_token: str

    class Config:
        env_file = ".env"
        env_prefix = ""
        case_sensitive = False
        extra = "ignore"  # Allow extra fields in .env without validation

settings = Settings()