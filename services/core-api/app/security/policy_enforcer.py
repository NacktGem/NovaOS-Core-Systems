"""
Security Policy Enforcement Module

Comprehensive security middleware and policy enforcement for NovaOS platforms.
Implements role-based access control, age verification, and platform isolation.
"""

from typing import Dict, List, Optional, Tuple, Any
from enum import Enum
from dataclasses import dataclass
from fastapi import HTTPException, Request
from fastapi.security import HTTPBearer
import jwt
import hashlib
import time


class Platform(Enum):
    NOVAOS = "novaos"
    BLACK_ROSE = "black-rose"
    GYPSY_COVE = "gypsy-cove"


class Role(Enum):
    GUEST = "guest"
    USER = "user"
    CREATOR = "creator"
    SUBSCRIBER = "subscriber"
    MODERATOR = "moderator"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"
    GODMODE = "godmode"


class Permission(Enum):
    # NovaOS Console Permissions
    AGENT_VIEW = "agent.view"
    AGENT_CREATE = "agent.create"
    AGENT_DELETE = "agent.delete"
    SYSTEM_MONITOR = "system.monitor"
    SYSTEM_METRICS = "system.metrics"
    SYSTEM_CONTROL = "system.control"

    # Black Rose Collective Permissions
    CONTENT_VIEW = "content.view"
    CONTENT_PREMIUM = "content.premium"
    CONTENT_EXCLUSIVE = "content.exclusive"
    CONTENT_CREATE = "content.create"
    CREATOR_MANAGE_SUBSCRIBERS = "creator.manage_subscribers"
    CREATOR_VIEW_EARNINGS = "creator.view_earnings"
    CREATOR_REQUEST_PAYOUT = "creator.request_payout"
    SUBSCRIPTION_CREATE = "subscription.create"
    SUBSCRIPTION_CANCEL = "subscription.cancel"
    MODERATION_VIEW_REPORTS = "moderation.view_reports"
    MODERATION_TAKE_ACTION = "moderation.take_action"
    MODERATION_BAN_USER = "moderation.ban_user"

    # GypsyCove Permissions
    POSTS_VIEW = "posts.view"
    POSTS_CREATE = "posts.create"
    POSTS_DELETE_OWN = "posts.delete_own"
    POSTS_DELETE_ANY = "posts.delete_any"
    COMMUNITY_JOIN = "community.join"
    COMMUNITY_CREATE = "community.create"
    COMMUNITY_MODERATE = "community.moderate"

    # Admin Permissions
    ADMIN_VIEW_USERS = "admin.view_users"
    ADMIN_CREATE_USER = "admin.create_user"
    ADMIN_DEACTIVATE_USER = "admin.deactivate_user"
    ADMIN_VIEW_CONFIG = "admin.view_config"
    ADMIN_UPDATE_CONFIG = "admin.update_config"
    ADMIN_EMERGENCY_CONTROL = "admin.emergency_control"

    # Compliance Permissions
    COMPLIANCE_VIEW_DASHBOARD = "compliance.view_dashboard"
    COMPLIANCE_PROCESS_VERIFICATION = "compliance.process_verification"
    COMPLIANCE_HANDLE_DMCA = "compliance.handle_dmca"


@dataclass
class SecurityContext:
    """User security context with platform-specific attributes"""

    user_id: str
    role: Role
    platform: Platform
    age_verified: bool = False
    subscription_active: bool = False
    premium_access: bool = False
    permissions: List[Permission] = None
    session_token: Optional[str] = None
    last_activity: int = 0

    def __post_init__(self):
        if self.permissions is None:
            self.permissions = self._get_role_permissions()
        self.last_activity = int(time.time())

    def _get_role_permissions(self) -> List[Permission]:
        """Get permissions based on role and platform"""
        permissions = []

        # Guest permissions (minimal)
        if self.role == Role.GUEST:
            if self.platform == Platform.GYPSY_COVE:
                permissions.extend([Permission.POSTS_VIEW])

        # User permissions
        elif self.role == Role.USER:
            if self.platform == Platform.NOVAOS:
                permissions.extend([Permission.AGENT_VIEW, Permission.SYSTEM_MONITOR])
            elif self.platform == Platform.BLACK_ROSE:
                permissions.extend([Permission.CONTENT_VIEW, Permission.SUBSCRIPTION_CREATE])
            elif self.platform == Platform.GYPSY_COVE:
                permissions.extend(
                    [
                        Permission.POSTS_VIEW,
                        Permission.POSTS_CREATE,
                        Permission.POSTS_DELETE_OWN,
                        Permission.COMMUNITY_JOIN,
                    ]
                )

        # Creator permissions
        elif self.role == Role.CREATOR:
            # Inherit user permissions
            permissions.extend(
                SecurityContext(self.user_id, Role.USER, self.platform)._get_role_permissions()
            )

            if self.platform == Platform.BLACK_ROSE:
                permissions.extend(
                    [
                        Permission.CONTENT_CREATE,
                        Permission.CREATOR_MANAGE_SUBSCRIBERS,
                        Permission.CREATOR_VIEW_EARNINGS,
                        Permission.CREATOR_REQUEST_PAYOUT,
                    ]
                )
            elif self.platform == Platform.GYPSY_COVE:
                permissions.extend([Permission.COMMUNITY_CREATE])

        # Subscriber permissions
        elif self.role == Role.SUBSCRIBER:
            # Inherit user permissions
            permissions.extend(
                SecurityContext(self.user_id, Role.USER, self.platform)._get_role_permissions()
            )

            if self.platform == Platform.BLACK_ROSE:
                permissions.extend([Permission.CONTENT_PREMIUM, Permission.SUBSCRIPTION_CANCEL])

                if self.premium_access:
                    permissions.append(Permission.CONTENT_EXCLUSIVE)

        # Moderator permissions
        elif self.role == Role.MODERATOR:
            # Inherit user permissions
            permissions.extend(
                SecurityContext(self.user_id, Role.USER, self.platform)._get_role_permissions()
            )

            if self.platform == Platform.BLACK_ROSE:
                permissions.extend(
                    [
                        Permission.MODERATION_VIEW_REPORTS,
                        Permission.MODERATION_TAKE_ACTION,
                        Permission.COMPLIANCE_PROCESS_VERIFICATION,
                    ]
                )
            elif self.platform == Platform.GYPSY_COVE:
                permissions.extend([Permission.POSTS_DELETE_ANY, Permission.COMMUNITY_MODERATE])

        # Admin permissions
        elif self.role == Role.ADMIN:
            # Inherit moderator permissions
            permissions.extend(
                SecurityContext(self.user_id, Role.MODERATOR, self.platform)._get_role_permissions()
            )

            permissions.extend(
                [
                    Permission.ADMIN_VIEW_USERS,
                    Permission.ADMIN_CREATE_USER,
                    Permission.ADMIN_VIEW_CONFIG,
                    Permission.COMPLIANCE_VIEW_DASHBOARD,
                    Permission.COMPLIANCE_HANDLE_DMCA,
                ]
            )

            if self.platform == Platform.NOVAOS:
                permissions.extend([Permission.AGENT_CREATE, Permission.SYSTEM_METRICS])
            elif self.platform == Platform.BLACK_ROSE:
                permissions.append(Permission.MODERATION_BAN_USER)

        # Super Admin permissions
        elif self.role == Role.SUPER_ADMIN:
            # Inherit admin permissions
            permissions.extend(
                SecurityContext(self.user_id, Role.ADMIN, self.platform)._get_role_permissions()
            )

            permissions.extend(
                [
                    Permission.ADMIN_DEACTIVATE_USER,
                    Permission.ADMIN_UPDATE_CONFIG,
                    Permission.AGENT_DELETE,
                ]
            )

        # GODMODE permissions (all permissions)
        elif self.role == Role.GODMODE:
            permissions = list(Permission)

        return list(set(permissions))  # Remove duplicates

    def has_permission(self, permission: Permission) -> bool:
        """Check if user has specific permission"""
        return permission in self.permissions

    def requires_age_verification(self, endpoint: str) -> bool:
        """Check if endpoint requires age verification"""
        return self.platform == Platform.BLACK_ROSE and any(
            adult_path in endpoint.lower()
            for adult_path in ["blackrose", "adult", "nsfw", "content", "creator"]
        )


class SecurityPolicyEnforcer:
    """Comprehensive security policy enforcement system"""

    def __init__(self):
        self.active_sessions: Dict[str, SecurityContext] = {}
        self.failed_attempts: Dict[str, List[int]] = {}
        self.rate_limits: Dict[str, List[int]] = {}

    def create_security_context(
        self, user_id: str, role: str, platform: str, **kwargs
    ) -> SecurityContext:
        """Create security context from user data"""
        return SecurityContext(
            user_id=user_id, role=Role(role), platform=Platform(platform), **kwargs
        )

    def enforce_authentication(self, request: Request) -> SecurityContext:
        """Enforce authentication requirements"""
        # Extract JWT token from cookie or Authorization header
        token = self._extract_token(request)

        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")

        # Validate and decode token
        try:
            payload = jwt.decode(token, verify=False)  # In real implementation, use proper key
            user_id = payload.get("sub")
            role = payload.get("role", "guest")
            platform = self._determine_platform(request)

            # Additional claims
            age_verified = payload.get("age_verified", False)
            subscription_active = payload.get("subscription_active", False)
            premium_access = payload.get("premium_access", False)

            context = self.create_security_context(
                user_id=user_id,
                role=role,
                platform=platform,
                age_verified=age_verified,
                subscription_active=subscription_active,
                premium_access=premium_access,
                session_token=token,
            )

            # Store active session
            self.active_sessions[token] = context
            return context

        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid authentication token")

    def enforce_authorization(
        self, context: SecurityContext, required_permission: Permission, request: Request
    ) -> bool:
        """Enforce authorization based on permissions"""

        # Check if user has required permission
        if not context.has_permission(required_permission):
            raise HTTPException(
                status_code=403,
                detail=f"Insufficient permissions. Required: {required_permission.value}",
            )

        # Platform isolation check
        request_platform = self._determine_platform(request)
        if context.platform != request_platform and context.role not in [
            Role.SUPER_ADMIN,
            Role.GODMODE,
        ]:
            raise HTTPException(status_code=403, detail="Cross-platform access denied")

        return True

    def enforce_age_verification(self, context: SecurityContext, request: Request) -> bool:
        """Enforce age verification for adult content"""

        if context.requires_age_verification(str(request.url)):
            if not context.age_verified:
                raise HTTPException(
                    status_code=403, detail="Age verification required for adult content access"
                )

            # Additional header check for Black Rose Collective
            age_verified_header = request.headers.get("X-Age-Verified")
            if age_verified_header != "true":
                raise HTTPException(
                    status_code=403, detail="Age verification header missing or invalid"
                )

        return True

    def enforce_subscription_requirements(
        self,
        context: SecurityContext,
        subscription_required: bool = False,
        premium_required: bool = False,
    ) -> bool:
        """Enforce subscription and premium access requirements"""

        if subscription_required and not context.subscription_active:
            raise HTTPException(status_code=402, detail="Active subscription required")

        if premium_required and not context.premium_access:
            raise HTTPException(status_code=402, detail="Premium access required")

        return True

    def enforce_rate_limiting(
        self,
        context: SecurityContext,
        request: Request,
        max_requests: int = 100,
        time_window: int = 3600,  # 1 hour
    ) -> bool:
        """Enforce rate limiting per user"""

        current_time = int(time.time())
        key = f"{context.user_id}:{request.url.path}"

        # Initialize or clean old entries
        if key not in self.rate_limits:
            self.rate_limits[key] = []

        # Remove old requests outside time window
        self.rate_limits[key] = [
            timestamp
            for timestamp in self.rate_limits[key]
            if current_time - timestamp < time_window
        ]

        # Check rate limit
        if len(self.rate_limits[key]) >= max_requests:
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded. Max {max_requests} requests per {time_window} seconds",
            )

        # Record current request
        self.rate_limits[key].append(current_time)
        return True

    def enforce_content_policy(
        self, context: SecurityContext, content_data: Dict[str, Any]
    ) -> bool:
        """Enforce content policy based on platform and user role"""

        # NSFW content restrictions
        if content_data.get("nsfw", False):
            if context.platform != Platform.BLACK_ROSE:
                raise HTTPException(
                    status_code=403, detail="NSFW content only allowed on Black Rose Collective"
                )

            if not context.age_verified:
                raise HTTPException(
                    status_code=403, detail="Age verification required for NSFW content"
                )

        # Creator content restrictions
        if context.role == Role.CREATOR:
            # Creators must own the content they're modifying
            if content_data.get("creator_id") != context.user_id:
                if context.role not in [Role.MODERATOR, Role.ADMIN, Role.SUPER_ADMIN, Role.GODMODE]:
                    raise HTTPException(status_code=403, detail="Can only modify your own content")

        return True

    def log_security_event(
        self, context: SecurityContext, event_type: str, details: Dict[str, Any]
    ):
        """Log security events for audit and monitoring"""
        event = {
            "timestamp": int(time.time()),
            "user_id": context.user_id,
            "role": context.role.value,
            "platform": context.platform.value,
            "event_type": event_type,
            "details": details,
        }

        # In production, send to logging system
        print(f"SECURITY EVENT: {event}")

    def _extract_token(self, request: Request) -> Optional[str]:
        """Extract JWT token from request"""
        # Try cookie first
        token = request.cookies.get("access_token")
        if token:
            return token

        # Try Authorization header
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            return auth_header[7:]  # Remove "Bearer " prefix

        return None

    def _determine_platform(self, request: Request) -> Platform:
        """Determine platform from request"""
        host = request.headers.get("Host", "").lower()
        path = str(request.url.path).lower()

        if "blackrose" in host or "blackrose" in path:
            return Platform.BLACK_ROSE
        elif "gypsycove" in host or "gypsycove" in path:
            return Platform.GYPSY_COVE
        else:
            return Platform.NOVAOS

    def get_session_info(self, token: str) -> Optional[SecurityContext]:
        """Get active session information"""
        return self.active_sessions.get(token)

    def invalidate_session(self, token: str):
        """Invalidate user session"""
        if token in self.active_sessions:
            del self.active_sessions[token]

    def get_security_metrics(self) -> Dict[str, Any]:
        """Get security metrics for monitoring"""
        return {
            "active_sessions": len(self.active_sessions),
            "rate_limited_endpoints": len(self.rate_limits),
            "failed_attempts_tracked": len(self.failed_attempts),
            "platform_distribution": {
                platform.value: sum(
                    1 for ctx in self.active_sessions.values() if ctx.platform == platform
                )
                for platform in Platform
            },
            "role_distribution": {
                role.value: sum(1 for ctx in self.active_sessions.values() if ctx.role == role)
                for role in Role
            },
        }


# Global security policy enforcer instance
security_enforcer = SecurityPolicyEnforcer()


def require_permission(permission: Permission):
    """Decorator to require specific permission for endpoint access"""

    def decorator(func):
        async def wrapper(request: Request, *args, **kwargs):
            context = security_enforcer.enforce_authentication(request)
            security_enforcer.enforce_authorization(context, permission, request)
            security_enforcer.enforce_age_verification(context, request)
            security_enforcer.enforce_rate_limiting(context, request)

            # Add context to request state for use in endpoint
            request.state.security_context = context

            return await func(request, *args, **kwargs)

        return wrapper

    return decorator


def require_platform(platform: Platform):
    """Decorator to restrict endpoint to specific platform"""

    def decorator(func):
        async def wrapper(request: Request, *args, **kwargs):
            request_platform = security_enforcer._determine_platform(request)
            if request_platform != platform:
                raise HTTPException(
                    status_code=404, detail="Endpoint not available on this platform"
                )
            return await func(request, *args, **kwargs)

        return wrapper

    return decorator


def require_age_verification(func):
    """Decorator to require age verification"""

    async def wrapper(request: Request, *args, **kwargs):
        context = getattr(request.state, "security_context", None)
        if context:
            security_enforcer.enforce_age_verification(context, request)
        return await func(request, *args, **kwargs)

    return wrapper


def require_subscription(premium: bool = False):
    """Decorator to require subscription access"""

    def decorator(func):
        async def wrapper(request: Request, *args, **kwargs):
            context = getattr(request.state, "security_context", None)
            if context:
                security_enforcer.enforce_subscription_requirements(
                    context, subscription_required=True, premium_required=premium
                )
            return await func(request, *args, **kwargs)

        return wrapper

    return decorator
