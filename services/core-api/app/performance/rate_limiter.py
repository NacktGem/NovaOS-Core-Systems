"""
Advanced Rate Limiting and Request Throttling System

Implements sophisticated rate limiting with multiple algorithms:
- Token bucket for burst handling
- Sliding window for precise rate control
- Fixed window for simple limits
- Adaptive throttling based on system load
"""

import time
import asyncio
import json
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, field
from enum import Enum
from fastapi import HTTPException, Request
import redis
import hashlib


class RateLimitAlgorithm(Enum):
    """Rate limiting algorithms"""

    FIXED_WINDOW = "fixed_window"
    SLIDING_WINDOW = "sliding_window"
    TOKEN_BUCKET = "token_bucket"
    LEAKY_BUCKET = "leaky_bucket"
    ADAPTIVE = "adaptive"


class ThrottleAction(Enum):
    """Actions to take when rate limit is exceeded"""

    REJECT = "reject"  # HTTP 429 Too Many Requests
    DELAY = "delay"  # Introduce artificial delay
    QUEUE = "queue"  # Queue request for later processing
    DEGRADE = "degrade"  # Serve cached/simplified response


@dataclass
class RateLimit:
    """Rate limit configuration"""

    requests: int  # Number of requests allowed
    window_seconds: int  # Time window in seconds
    algorithm: RateLimitAlgorithm = RateLimitAlgorithm.SLIDING_WINDOW
    burst_multiplier: float = 1.5  # Allow burst up to this multiplier
    action: ThrottleAction = ThrottleAction.REJECT
    key_pattern: str = "user:{user_id}"  # Redis key pattern
    description: str = ""


@dataclass
class AdaptiveConfig:
    """Adaptive rate limiting configuration"""

    base_limit: int
    max_limit: int
    min_limit: int
    load_threshold_percent: float = 80.0  # CPU/Memory threshold
    scale_factor: float = 0.1  # How much to adjust limits
    adjustment_interval_seconds: int = 60


class RateLimitTracker:
    """Redis-based rate limit tracking"""

    def __init__(self, redis_url: str = "redis://localhost:6379", namespace: str = "ratelimit"):
        self.redis_client = redis.from_url(redis_url, decode_responses=True)
        self.namespace = namespace
        self.system_load_cache = {}

    def _get_key(self, pattern: str, **kwargs) -> str:
        """Generate Redis key for rate limiting"""
        key = pattern.format(**kwargs)
        return f"{self.namespace}:{key}"

    async def check_rate_limit(
        self, limit: RateLimit, identifier: str, **key_args
    ) -> Tuple[bool, Dict[str, Any]]:
        """Check if request is within rate limit"""

        if limit.algorithm == RateLimitAlgorithm.FIXED_WINDOW:
            return await self._check_fixed_window(limit, identifier, **key_args)
        elif limit.algorithm == RateLimitAlgorithm.SLIDING_WINDOW:
            return await self._check_sliding_window(limit, identifier, **key_args)
        elif limit.algorithm == RateLimitAlgorithm.TOKEN_BUCKET:
            return await self._check_token_bucket(limit, identifier, **key_args)
        elif limit.algorithm == RateLimitAlgorithm.ADAPTIVE:
            return await self._check_adaptive_limit(limit, identifier, **key_args)
        else:
            # Default to sliding window
            return await self._check_sliding_window(limit, identifier, **key_args)

    async def _check_fixed_window(
        self, limit: RateLimit, identifier: str, **key_args
    ) -> Tuple[bool, Dict[str, Any]]:
        """Fixed window rate limiting"""
        current_time = int(time.time())
        window_start = (current_time // limit.window_seconds) * limit.window_seconds

        key = self._get_key(limit.key_pattern, **key_args) + f":fw:{window_start}"

        try:
            current_count = self.redis_client.get(key)
            current_count = int(current_count) if current_count else 0

            if current_count >= limit.requests:
                return False, {
                    "algorithm": "fixed_window",
                    "current_count": current_count,
                    "limit": limit.requests,
                    "window_start": window_start,
                    "reset_time": window_start + limit.window_seconds,
                    "retry_after": (window_start + limit.window_seconds) - current_time,
                }

            # Increment counter
            pipe = self.redis_client.pipeline()
            pipe.incr(key)
            pipe.expire(key, limit.window_seconds)
            pipe.execute()

            return True, {
                "algorithm": "fixed_window",
                "current_count": current_count + 1,
                "limit": limit.requests,
                "remaining": limit.requests - (current_count + 1),
                "reset_time": window_start + limit.window_seconds,
            }

        except Exception as e:
            print(f"Rate limit check error: {e}")
            return True, {"error": str(e)}  # Fail open

    async def _check_sliding_window(
        self, limit: RateLimit, identifier: str, **key_args
    ) -> Tuple[bool, Dict[str, Any]]:
        """Sliding window rate limiting using Redis sorted sets"""
        current_time = int(time.time() * 1000)  # Use milliseconds for precision
        window_start = current_time - (limit.window_seconds * 1000)

        key = self._get_key(limit.key_pattern, **key_args) + ":sw"

        try:
            # Remove old entries
            self.redis_client.zremrangebyscore(key, 0, window_start)

            # Count current requests in window
            current_count = self.redis_client.zcard(key)

            if current_count >= limit.requests:
                # Get oldest request time for retry-after calculation
                oldest_requests = self.redis_client.zrange(key, 0, 0, withscores=True)
                oldest_time = oldest_requests[0][1] if oldest_requests else current_time
                retry_after = int(
                    (oldest_time + (limit.window_seconds * 1000) - current_time) / 1000
                )

                return False, {
                    "algorithm": "sliding_window",
                    "current_count": current_count,
                    "limit": limit.requests,
                    "retry_after": max(1, retry_after),
                }

            # Add current request
            request_id = f"{identifier}:{current_time}"
            pipe = self.redis_client.pipeline()
            pipe.zadd(key, {request_id: current_time})
            pipe.expire(key, limit.window_seconds + 1)  # Add buffer for cleanup
            pipe.execute()

            return True, {
                "algorithm": "sliding_window",
                "current_count": current_count + 1,
                "limit": limit.requests,
                "remaining": limit.requests - (current_count + 1),
                "window_seconds": limit.window_seconds,
            }

        except Exception as e:
            print(f"Sliding window rate limit error: {e}")
            return True, {"error": str(e)}

    async def _check_token_bucket(
        self, limit: RateLimit, identifier: str, **key_args
    ) -> Tuple[bool, Dict[str, Any]]:
        """Token bucket rate limiting"""
        key = self._get_key(limit.key_pattern, **key_args) + ":tb"
        current_time = time.time()

        try:
            bucket_data = self.redis_client.get(key)

            if bucket_data:
                bucket = json.loads(bucket_data)
                last_refill = bucket.get("last_refill", current_time)
                tokens = bucket.get("tokens", limit.requests)
            else:
                last_refill = current_time
                tokens = limit.requests

            # Calculate tokens to add based on time passed
            time_passed = current_time - last_refill
            tokens_to_add = time_passed * (limit.requests / limit.window_seconds)
            tokens = min(limit.requests * limit.burst_multiplier, tokens + tokens_to_add)

            if tokens < 1:
                # Calculate retry after
                time_for_token = limit.window_seconds / limit.requests
                retry_after = int(time_for_token - (tokens % 1) * time_for_token) + 1

                return False, {
                    "algorithm": "token_bucket",
                    "tokens_available": tokens,
                    "capacity": limit.requests * limit.burst_multiplier,
                    "retry_after": retry_after,
                }

            # Consume token
            tokens -= 1

            # Update bucket
            bucket_data = json.dumps({"tokens": tokens, "last_refill": current_time})
            self.redis_client.setex(key, limit.window_seconds * 2, bucket_data)

            return True, {
                "algorithm": "token_bucket",
                "tokens_remaining": tokens,
                "capacity": limit.requests * limit.burst_multiplier,
                "refill_rate": limit.requests / limit.window_seconds,
            }

        except Exception as e:
            print(f"Token bucket rate limit error: {e}")
            return True, {"error": str(e)}

    async def _check_adaptive_limit(
        self, limit: RateLimit, identifier: str, adaptive_config: AdaptiveConfig = None, **key_args
    ) -> Tuple[bool, Dict[str, Any]]:
        """Adaptive rate limiting based on system load"""
        if not adaptive_config:
            # Use default adaptive configuration
            adaptive_config = AdaptiveConfig(
                base_limit=limit.requests,
                max_limit=limit.requests * 2,
                min_limit=max(1, limit.requests // 4),
            )

        # Get current system load (simulated - in production, use actual metrics)
        system_load = await self._get_system_load()

        # Calculate adjusted limit based on load
        if system_load > adaptive_config.load_threshold_percent:
            # High load - reduce limits
            load_factor = (100 - system_load) / 100
            adjusted_limit = max(
                adaptive_config.min_limit, int(adaptive_config.base_limit * load_factor)
            )
        else:
            # Normal load - use base or increased limits
            load_factor = (
                adaptive_config.load_threshold_percent - system_load
            ) / adaptive_config.load_threshold_percent
            adjusted_limit = min(
                adaptive_config.max_limit,
                int(adaptive_config.base_limit * (1 + load_factor * adaptive_config.scale_factor)),
            )

        # Create temporary limit with adjusted values
        adjusted_rate_limit = RateLimit(
            requests=adjusted_limit,
            window_seconds=limit.window_seconds,
            algorithm=RateLimitAlgorithm.SLIDING_WINDOW,  # Use sliding window for adaptive
            key_pattern=limit.key_pattern,
        )

        # Check using sliding window with adjusted limit
        allowed, info = await self._check_sliding_window(
            adjusted_rate_limit, identifier, **key_args
        )

        # Add adaptive information to response
        info.update(
            {
                "algorithm": "adaptive",
                "base_limit": adaptive_config.base_limit,
                "adjusted_limit": adjusted_limit,
                "system_load_percent": system_load,
                "load_threshold": adaptive_config.load_threshold_percent,
            }
        )

        return allowed, info

    async def _get_system_load(self) -> float:
        """Get current system load percentage (CPU + Memory average)"""
        # In production, this would query actual system metrics
        # For now, simulate based on request patterns
        current_time = int(time.time())
        cache_key = f"system_load:{current_time // 60}"  # Cache for 1 minute

        if cache_key in self.system_load_cache:
            return self.system_load_cache[cache_key]

        # Simulate load calculation (replace with actual metrics)
        import random

        simulated_load = random.uniform(20, 90)  # 20-90% load

        self.system_load_cache[cache_key] = simulated_load

        # Clean old cache entries
        cutoff = current_time // 60 - 5  # Keep last 5 minutes
        self.system_load_cache = {
            k: v for k, v in self.system_load_cache.items() if int(k.split(":")[1]) > cutoff
        }

        return simulated_load


class AdvancedRateLimiter:
    """Advanced rate limiting system with multiple strategies"""

    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.tracker = RateLimitTracker(redis_url)

        # Define rate limits for different endpoints and user types
        self.rate_limits = self._initialize_rate_limits()

    def _initialize_rate_limits(self) -> Dict[str, Dict[str, RateLimit]]:
        """Initialize rate limits for different endpoints and user types"""
        return {
            # Authentication endpoints
            "auth": {
                "login": RateLimit(
                    requests=5,
                    window_seconds=300,  # 5 attempts per 5 minutes
                    algorithm=RateLimitAlgorithm.FIXED_WINDOW,
                    key_pattern="auth:login:{ip}",
                    action=ThrottleAction.DELAY,
                    description="Login attempt rate limit",
                ),
                "signup": RateLimit(
                    requests=3,
                    window_seconds=3600,  # 3 signups per hour per IP
                    algorithm=RateLimitAlgorithm.SLIDING_WINDOW,
                    key_pattern="auth:signup:{ip}",
                    description="Signup rate limit",
                ),
                "password_reset": RateLimit(
                    requests=2,
                    window_seconds=3600,  # 2 resets per hour
                    algorithm=RateLimitAlgorithm.SLIDING_WINDOW,
                    key_pattern="auth:reset:{email}",
                    description="Password reset rate limit",
                ),
            },
            # API endpoints by user type
            "api": {
                "guest": RateLimit(
                    requests=100,
                    window_seconds=3600,  # 100 requests per hour
                    algorithm=RateLimitAlgorithm.SLIDING_WINDOW,
                    key_pattern="api:guest:{ip}",
                    description="Guest user API rate limit",
                ),
                "user": RateLimit(
                    requests=1000,
                    window_seconds=3600,  # 1000 requests per hour
                    algorithm=RateLimitAlgorithm.TOKEN_BUCKET,
                    burst_multiplier=2.0,
                    key_pattern="api:user:{user_id}",
                    description="Authenticated user API rate limit",
                ),
                "premium": RateLimit(
                    requests=5000,
                    window_seconds=3600,  # 5000 requests per hour
                    algorithm=RateLimitAlgorithm.ADAPTIVE,
                    key_pattern="api:premium:{user_id}",
                    description="Premium user API rate limit",
                ),
                "admin": RateLimit(
                    requests=10000,
                    window_seconds=3600,  # 10000 requests per hour
                    algorithm=RateLimitAlgorithm.SLIDING_WINDOW,
                    key_pattern="api:admin:{user_id}",
                    description="Admin API rate limit",
                ),
            },
            # Platform-specific limits
            "black_rose": {
                "content_upload": RateLimit(
                    requests=50,
                    window_seconds=3600,  # 50 uploads per hour
                    algorithm=RateLimitAlgorithm.TOKEN_BUCKET,
                    key_pattern="br:upload:{creator_id}",
                    description="Content upload rate limit",
                ),
                "subscription": RateLimit(
                    requests=10,
                    window_seconds=300,  # 10 subscriptions per 5 minutes
                    algorithm=RateLimitAlgorithm.SLIDING_WINDOW,
                    key_pattern="br:subscribe:{user_id}",
                    description="Subscription rate limit",
                ),
                "payment": RateLimit(
                    requests=20,
                    window_seconds=3600,  # 20 payments per hour
                    algorithm=RateLimitAlgorithm.SLIDING_WINDOW,
                    key_pattern="br:payment:{user_id}",
                    description="Payment processing rate limit",
                ),
            },
            "gypsy_cove": {
                "post_creation": RateLimit(
                    requests=100,
                    window_seconds=3600,  # 100 posts per hour
                    algorithm=RateLimitAlgorithm.TOKEN_BUCKET,
                    burst_multiplier=1.5,
                    key_pattern="gc:post:{user_id}",
                    description="Post creation rate limit",
                ),
                "social_interaction": RateLimit(
                    requests=500,
                    window_seconds=3600,  # 500 interactions per hour
                    algorithm=RateLimitAlgorithm.SLIDING_WINDOW,
                    key_pattern="gc:interact:{user_id}",
                    description="Social interaction rate limit",
                ),
            },
            "novaos": {
                "agent_creation": RateLimit(
                    requests=10,
                    window_seconds=3600,  # 10 agents per hour
                    algorithm=RateLimitAlgorithm.FIXED_WINDOW,
                    key_pattern="nova:agent:{user_id}",
                    description="Agent creation rate limit",
                ),
                "system_monitoring": RateLimit(
                    requests=1000,
                    window_seconds=3600,  # 1000 monitoring calls per hour
                    algorithm=RateLimitAlgorithm.ADAPTIVE,
                    key_pattern="nova:monitor:{user_id}",
                    description="System monitoring rate limit",
                ),
            },
        }

    async def check_rate_limit(
        self, category: str, limit_type: str, request: Request, **additional_args
    ) -> Tuple[bool, Dict[str, Any]]:
        """Check rate limit for specific endpoint"""

        # Get rate limit configuration
        if category not in self.rate_limits or limit_type not in self.rate_limits[category]:
            return True, {"message": "No rate limit configured"}

        rate_limit = self.rate_limits[category][limit_type]

        # Extract identifier based on key pattern
        key_args = self._extract_key_args(rate_limit.key_pattern, request, **additional_args)

        # Generate unique identifier for this request
        identifier = hashlib.md5(str(key_args).encode()).hexdigest()[:16]

        return await self.tracker.check_rate_limit(rate_limit, identifier, **key_args)

    def _extract_key_args(
        self, key_pattern: str, request: Request, **additional_args
    ) -> Dict[str, str]:
        """Extract key arguments from request and additional parameters"""
        key_args = {}

        # Extract from pattern
        if "{ip}" in key_pattern:
            key_args["ip"] = request.client.host if request.client else "unknown"

        if "{user_id}" in key_pattern:
            key_args["user_id"] = getattr(request.state, "user_id", "anonymous")

        if "{email}" in key_pattern:
            key_args["email"] = additional_args.get("email", "unknown")

        if "{creator_id}" in key_pattern:
            key_args["creator_id"] = additional_args.get(
                "creator_id", key_args.get("user_id", "anonymous")
            )

        # Add any additional arguments
        key_args.update(additional_args)

        return key_args

    async def handle_rate_limit_exceeded(
        self, rate_limit: RateLimit, limit_info: Dict[str, Any], request: Request
    ) -> None:
        """Handle rate limit exceeded based on configured action"""

        if rate_limit.action == ThrottleAction.REJECT:
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded: {rate_limit.description}",
                headers={
                    "Retry-After": str(limit_info.get("retry_after", 60)),
                    "X-RateLimit-Limit": str(rate_limit.requests),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(limit_info.get("reset_time", int(time.time()) + 60)),
                },
            )

        elif rate_limit.action == ThrottleAction.DELAY:
            # Introduce artificial delay
            delay_seconds = min(limit_info.get("retry_after", 1), 10)  # Max 10 second delay
            await asyncio.sleep(delay_seconds)

        elif rate_limit.action == ThrottleAction.QUEUE:
            # Queue for later processing (implement queue system)
            pass

        elif rate_limit.action == ThrottleAction.DEGRADE:
            # Serve degraded response (implement degraded service)
            pass

    def get_rate_limit_stats(self) -> Dict[str, Any]:
        """Get rate limiting statistics"""
        stats = {}

        for category, limits in self.rate_limits.items():
            stats[category] = {}
            for limit_type, rate_limit in limits.items():
                stats[category][limit_type] = {
                    "requests": rate_limit.requests,
                    "window_seconds": rate_limit.window_seconds,
                    "algorithm": rate_limit.algorithm.value,
                    "description": rate_limit.description,
                }

        return stats


# Global rate limiter instance
rate_limiter = AdvancedRateLimiter()


def rate_limit(category: str, limit_type: str, **kwargs):
    """Decorator for endpoint rate limiting"""

    def decorator(func):
        async def wrapper(request: Request, *args, **func_kwargs):
            # Check rate limit
            allowed, info = await rate_limiter.check_rate_limit(
                category, limit_type, request, **kwargs
            )

            if not allowed:
                rate_limit_config = rate_limiter.rate_limits[category][limit_type]
                await rate_limiter.handle_rate_limit_exceeded(rate_limit_config, info, request)

            # Add rate limit headers to response
            response = await func(request, *args, **func_kwargs)
            if hasattr(response, "headers"):
                response.headers["X-RateLimit-Limit"] = str(info.get("limit", "unknown"))
                response.headers["X-RateLimit-Remaining"] = str(info.get("remaining", "unknown"))
                response.headers["X-RateLimit-Algorithm"] = info.get("algorithm", "unknown")

            return response

        return wrapper

    return decorator
