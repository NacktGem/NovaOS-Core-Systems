import redis.asyncio as redis
from fastapi import Request, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response


class LoginRateLimit(BaseHTTPMiddleware):
    def __init__(self, app, redis_url: str, limit: int = 5, window: int = 60):
        super().__init__(app)
        self.redis = redis.from_url(redis_url, decode_responses=True)
        self.limit = limit
        self.window = window

    async def dispatch(self, request: Request, call_next):
        if request.url.path == "/auth/login" and request.method == "POST":
            ip = request.client.host if request.client else "unknown"
            try:
                body = await request.json()
                email = body.get("email", "").lower()
            except Exception:
                email = ""
            key = f"rl:login:{ip}:{email}"
            try:
                pipe = self.redis.pipeline()
                pipe.incr(key, 1)
                pipe.expire(key, self.window)
                count, _ = await pipe.execute()
                if int(count) > self.limit:
                    return Response(status_code=status.HTTP_429_TOO_MANY_REQUESTS)
            except Exception:
                pass
        return await call_next(request)
