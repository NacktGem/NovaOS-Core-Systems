from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from fastapi import status

SAFE_METHODS = {"GET", "HEAD", "OPTIONS", "TRACE"}


class CSRFMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, cookie_name: str = "csrf_token", header_name: str = "x-csrf-token"):
        super().__init__(app)
        self.cookie_name = cookie_name
        self.header_name = header_name

    async def dispatch(self, request: Request, call_next):
        if request.method.upper() in SAFE_METHODS or request.url.path == "/auth/login":
            return await call_next(request)
        cookie = request.cookies.get(self.cookie_name)
        header = request.headers.get(self.header_name)
        if not cookie or not header or cookie != header:
            return Response(status_code=status.HTTP_403_FORBIDDEN)
        return await call_next(request)
