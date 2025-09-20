"""Audit logging middleware for tracking user actions with founder bypass.

This middleware logs all API requests and responses except for:
1. Founders (godmode role) - always bypassed regardless of settings
2. When audit_enabled is False (for all other users)
3. Health check and internal endpoints (optional exclusions)
"""

import json
import time
import uuid
from typing import Optional, Set
from datetime import datetime, timezone

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.orm import Session

from app.db.database import get_session
from app.db.models.audit import AuditLog, SystemConfig
from app.security.jwt import verify_token


class AuditMiddleware(BaseHTTPMiddleware):
    """Middleware for comprehensive audit logging with founder bypass."""

    # Paths to exclude from audit logging (even when enabled)
    EXCLUDED_PATHS: Set[str] = {
        "/metrics",
        "/internal/healthz",
        "/internal/readyz",
        "/version",
        "/docs",
        "/openapi.json",
    }

    # Methods to exclude from audit logging
    EXCLUDED_METHODS: Set[str] = {
        "OPTIONS",  # CORS preflight requests
    }

    def __init__(self, app, redis_client=None):
        super().__init__(app)
        self.redis_client = redis_client

    async def dispatch(self, request: Request, call_next):
        """Main middleware dispatch method."""
        # Skip excluded paths and methods
        if request.url.path in self.EXCLUDED_PATHS or request.method in self.EXCLUDED_METHODS:
            return await call_next(request)

        # Record start time for response time calculation
        start_time = time.time()

        # Get user information from token
        user_info = await self._get_user_info(request)

        # Check if we should log this request
        should_log = await self._should_log_request(user_info)

        # Process the request
        try:
            response = await call_next(request)
            outcome = "success" if response.status_code < 400 else "error"
        except Exception as e:
            # Create error response for logging
            response = Response(
                content=json.dumps({"error": str(e)}),
                status_code=500,
                media_type="application/json",
            )
            outcome = "error"

        # Log the request if needed
        if should_log:
            response_time_ms = int((time.time() - start_time) * 1000)
            await self._log_request(request, response, user_info, outcome, response_time_ms)

        return response

    async def _get_user_info(self, request: Request) -> Optional[dict]:
        """Extract user information from the request token."""
        try:
            # Try to get user from Authorization header
            authorization = request.headers.get("Authorization")
            if not authorization or not authorization.startswith("Bearer "):
                return None

            token = authorization.replace("Bearer ", "")

            # Verify and decode token
            token_data = verify_token(token)
            user_id = token_data.get("sub")

            if not user_id:
                return None

            # Get user from database
            session = next(get_session())
            try:
                from app.db.models import User
                import uuid

                user = session.get(User, uuid.UUID(user_id))
                if not user:
                    return None

                return {
                    "id": str(user.id),
                    "username": user.username,
                    "role": user.role,
                    "email": getattr(user, "email", None),
                }
            finally:
                session.close()

        except Exception:
            # Failed to get user info - likely unauthenticated request
            return None

    async def _should_log_request(self, user_info: Optional[dict]) -> bool:
        """Determine if this request should be logged."""
        # Founders always bypass logging
        if user_info and user_info.get("role") in ["godmode", "founder"]:
            return False

        # Check if audit logging is enabled system-wide
        return await self._is_audit_enabled()

    async def _is_audit_enabled(self) -> bool:
        """Check if audit logging is enabled system-wide."""
        try:
            # Try Redis first (fast cache)
            if self.redis_client:
                cached_value = await self.redis_client.get("system:audit_enabled")
                if cached_value is not None:
                    return json.loads(cached_value)

            # Fall back to database
            session = next(get_session())
            try:
                config = (
                    session.query(SystemConfig).filter(SystemConfig.key == "audit_enabled").first()
                )

                if config:
                    enabled = config.value.get("enabled", True)
                    # Cache in Redis for 5 minutes
                    if self.redis_client:
                        await self.redis_client.setex(
                            "system:audit_enabled", 300, json.dumps(enabled)  # 5 minutes
                        )
                    return enabled
                else:
                    # Default to enabled if not configured
                    return True
            finally:
                session.close()

        except Exception:
            # On error, default to enabled for security
            return True

    async def _log_request(
        self,
        request: Request,
        response: Response,
        user_info: Optional[dict],
        outcome: str,
        response_time_ms: int,
    ):
        """Log the audit entry to the database."""
        try:
            session = next(get_session())
            try:
                # Generate unique audit ID
                audit_id = f"audit_{uuid.uuid4().hex}"

                # Extract request details
                query_string = str(request.url.query) if request.url.query else None
                ip_address = self._get_client_ip(request)
                request_id = request.headers.get("x-request-id")

                # Determine action based on path and method
                action = self._determine_action(request.url.path, request.method)
                resource = self._extract_resource(request.url.path)

                # Create audit log entry
                audit_log = AuditLog(
                    id=audit_id,
                    user_id=user_info.get("id") if user_info else None,
                    username=user_info.get("username") if user_info else None,
                    role=user_info.get("role") if user_info else None,
                    method=request.method,
                    path=request.url.path,
                    query_params=query_string,
                    user_agent=request.headers.get("user-agent"),
                    ip_address=ip_address,
                    request_id=request_id,
                    status_code=str(response.status_code),
                    response_time_ms=str(response_time_ms),
                    action=action,
                    resource=resource,
                    outcome=outcome,
                    details={
                        "content_type": request.headers.get("content-type"),
                        "content_length": request.headers.get("content-length"),
                        "referer": request.headers.get("referer"),
                        "timestamp_iso": datetime.now(timezone.utc).isoformat(),
                    },
                    timestamp=datetime.now(timezone.utc),
                )

                session.add(audit_log)
                session.commit()

            finally:
                session.close()

        except Exception as e:
            # Log error but don't fail the request
            print(f"Audit logging error: {e}")

    def _get_client_ip(self, request: Request) -> str:
        """Extract the real client IP address."""
        # Check for forwarded headers (reverse proxy)
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()

        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip

        # Fall back to direct connection IP
        return request.client.host if request.client else "unknown"

    def _determine_action(self, path: str, method: str) -> str:
        """Determine the audit action based on the request path and method."""
        # Map common paths to actions
        if "/vault" in path:
            if method == "GET":
                return "vault_access"
            elif method == "POST":
                return "vault_purchase"
            else:
                return "vault_action"
        elif "/profile" in path or "/me" in path:
            return "profile_access"
        elif "/messages" in path:
            return "message_access"
        elif "/payments" in path:
            if method == "POST":
                return "payment_action"
            else:
                return "payment_access"
        elif "/auth" in path:
            if "login" in path:
                return "login_attempt"
            elif "logout" in path:
                return "logout"
            else:
                return "auth_action"
        elif "/admin" in path or "/godmode" in path:
            return "admin_access"
        else:
            return f"{method.lower()}_request"

    def _extract_resource(self, path: str) -> Optional[str]:
        """Extract the resource identifier from the path."""
        # Simple resource extraction - could be enhanced
        parts = [p for p in path.split("/") if p]
        if len(parts) >= 2:
            # For paths like /vault/items/123, extract "vault/items"
            return "/".join(parts[:2])
        elif len(parts) == 1:
            return parts[0]
        else:
            return None
