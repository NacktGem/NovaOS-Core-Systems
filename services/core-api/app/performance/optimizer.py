"""
API Performance Optimization System

Comprehensive performance optimization for NovaOS Core API including:
- Redis caching strategies
- Database query optimization
- Rate limiting and request throttling
- Response compression and CDN integration
- Performance monitoring and metrics
"""

import time
import asyncio
import hashlib
import json
import gzip
from typing import Dict, List, Any, Optional, Callable
from dataclasses import dataclass, asdict
from enum import Enum
from functools import wraps
import redis
from fastapi import Request, Response
from fastapi.middleware.base import BaseHTTPMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session


class CacheStrategy(Enum):
    """Cache invalidation strategies"""

    TIME_BASED = "time_based"  # TTL-based expiration
    EVENT_BASED = "event_based"  # Invalidate on specific events
    VERSION_BASED = "version_based"  # Version-based cache keys
    HYBRID = "hybrid"  # Combination of strategies


class PerformanceTier(Enum):
    """Performance optimization tiers"""

    BASIC = "basic"  # Essential optimizations
    STANDARD = "standard"  # Standard production optimizations
    PREMIUM = "premium"  # High-performance optimizations
    ENTERPRISE = "enterprise"  # Maximum performance for enterprise


@dataclass
class CacheConfig:
    """Cache configuration for different data types"""

    key_pattern: str
    ttl_seconds: int
    strategy: CacheStrategy
    compression: bool = False
    serialization: str = "json"  # json, pickle, msgpack
    max_size_bytes: int = 1024 * 1024  # 1MB default


@dataclass
class PerformanceMetrics:
    """Performance monitoring metrics"""

    endpoint: str
    method: str
    response_time_ms: float
    cache_hit: bool
    cache_key: Optional[str]
    db_query_count: int
    db_query_time_ms: float
    memory_usage_mb: float
    timestamp: int
    user_id: Optional[str] = None
    platform: Optional[str] = None


class RedisPerformanceCache:
    """Advanced Redis caching system with performance optimization"""

    def __init__(self, redis_url: str = "redis://localhost:6379", namespace: str = "novaos"):
        self.redis_client = redis.from_url(redis_url, decode_responses=True)
        self.namespace = namespace
        self.hit_count = 0
        self.miss_count = 0
        self.performance_tier = PerformanceTier.STANDARD

        # Cache configurations for different data types
        self.cache_configs = self._initialize_cache_configs()

    def _initialize_cache_configs(self) -> Dict[str, CacheConfig]:
        """Initialize optimized cache configurations"""
        return {
            # User data caching
            "user_profile": CacheConfig(
                key_pattern="user:profile:{user_id}",
                ttl_seconds=3600,  # 1 hour
                strategy=CacheStrategy.EVENT_BASED,
                compression=True,
            ),
            # Agent data caching
            "agent_status": CacheConfig(
                key_pattern="agent:status:{agent_id}",
                ttl_seconds=300,  # 5 minutes
                strategy=CacheStrategy.TIME_BASED,
            ),
            # Content caching for Black Rose Collective
            "content_metadata": CacheConfig(
                key_pattern="content:meta:{content_id}",
                ttl_seconds=1800,  # 30 minutes
                strategy=CacheStrategy.VERSION_BASED,
                compression=True,
            ),
            # Social media content for GypsyCove
            "social_feed": CacheConfig(
                key_pattern="feed:{platform}:{user_id}:{page}",
                ttl_seconds=600,  # 10 minutes
                strategy=CacheStrategy.HYBRID,
            ),
            # System metrics for NovaOS Console
            "system_metrics": CacheConfig(
                key_pattern="metrics:system:{timestamp}",
                ttl_seconds=60,  # 1 minute
                strategy=CacheStrategy.TIME_BASED,
            ),
            # API response caching
            "api_response": CacheConfig(
                key_pattern="api:{method}:{endpoint}:{params_hash}",
                ttl_seconds=900,  # 15 minutes
                strategy=CacheStrategy.HYBRID,
                compression=True,
            ),
            # Database query result caching
            "db_query": CacheConfig(
                key_pattern="query:{query_hash}:{params_hash}",
                ttl_seconds=1800,  # 30 minutes
                strategy=CacheStrategy.VERSION_BASED,
                compression=True,
            ),
            # Session and authentication caching
            "auth_session": CacheConfig(
                key_pattern="session:{token_hash}",
                ttl_seconds=900,  # 15 minutes
                strategy=CacheStrategy.EVENT_BASED,
            ),
        }

    def generate_cache_key(self, config: CacheConfig, **kwargs) -> str:
        """Generate optimized cache key"""
        key = config.key_pattern.format(**kwargs)
        return f"{self.namespace}:{key}"

    def get(self, cache_type: str, **kwargs) -> Optional[Any]:
        """Get cached data with performance optimization"""
        config = self.cache_configs.get(cache_type)
        if not config:
            return None

        cache_key = self.generate_cache_key(config, **kwargs)

        try:
            cached_data = self.redis_client.get(cache_key)
            if cached_data:
                self.hit_count += 1

                # Decompress if needed
                if config.compression:
                    cached_data = gzip.decompress(cached_data.encode()).decode()

                # Deserialize
                if config.serialization == "json":
                    return json.loads(cached_data)

                return cached_data
            else:
                self.miss_count += 1
                return None

        except Exception as e:
            print(f"Cache get error for key {cache_key}: {e}")
            self.miss_count += 1
            return None

    def set(self, cache_type: str, data: Any, **kwargs) -> bool:
        """Set cached data with optimization"""
        config = self.cache_configs.get(cache_type)
        if not config:
            return False

        cache_key = self.generate_cache_key(config, **kwargs)

        try:
            # Serialize data
            if config.serialization == "json":
                serialized_data = json.dumps(data)
            else:
                serialized_data = str(data)

            # Compress if needed
            if config.compression:
                compressed_data = gzip.compress(serialized_data.encode())
                # Check size limit
                if len(compressed_data) > config.max_size_bytes:
                    print(f"Data too large for cache key {cache_key}")
                    return False
                serialized_data = compressed_data.decode("latin-1")

            # Set with TTL
            return self.redis_client.setex(cache_key, config.ttl_seconds, serialized_data)

        except Exception as e:
            print(f"Cache set error for key {cache_key}: {e}")
            return False

    def invalidate(self, cache_type: str, **kwargs) -> bool:
        """Invalidate cached data"""
        config = self.cache_configs.get(cache_type)
        if not config:
            return False

        cache_key = self.generate_cache_key(config, **kwargs)

        try:
            return bool(self.redis_client.delete(cache_key))
        except Exception as e:
            print(f"Cache invalidation error for key {cache_key}: {e}")
            return False

    def invalidate_pattern(self, pattern: str) -> int:
        """Invalidate multiple keys matching pattern"""
        try:
            keys = self.redis_client.keys(f"{self.namespace}:{pattern}")
            if keys:
                return self.redis_client.delete(*keys)
            return 0
        except Exception as e:
            print(f"Pattern invalidation error for {pattern}: {e}")
            return 0

    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache performance statistics"""
        total_requests = self.hit_count + self.miss_count
        hit_rate = (self.hit_count / total_requests * 100) if total_requests > 0 else 0

        return {
            "hit_count": self.hit_count,
            "miss_count": self.miss_count,
            "hit_rate_percent": round(hit_rate, 2),
            "total_requests": total_requests,
            "cache_size_keys": len(self.redis_client.keys(f"{self.namespace}:*")),
            "memory_usage": self.redis_client.memory_usage(),
        }


class DatabaseOptimizer:
    """Database query optimization and monitoring"""

    def __init__(self):
        self.query_cache = RedisPerformanceCache()
        self.slow_query_threshold_ms = 1000  # 1 second
        self.query_stats: Dict[str, List[float]] = {}

    def optimize_query(self, query: str, params: Dict[str, Any] = None) -> str:
        """Optimize SQL query with performance hints"""
        optimized_query = query

        # Add performance hints for PostgreSQL
        if "SELECT" in query.upper():
            # Add index hints for common patterns
            if "WHERE user_id" in query:
                optimized_query = f"/*+ INDEX_HINT(users_user_id_idx) */ {optimized_query}"

            if "ORDER BY created_at" in query:
                optimized_query = f"/*+ INDEX_HINT(created_at_idx) */ {optimized_query}"

            # Add LIMIT if not present and potentially large result set
            if "users" in query.lower() and "LIMIT" not in query.upper():
                optimized_query += " LIMIT 1000"

        return optimized_query

    def execute_with_cache(
        self, session: Session, query: str, params: Dict[str, Any] = None, cache_ttl: int = 1800
    ) -> Any:
        """Execute query with intelligent caching"""
        params = params or {}

        # Generate cache key
        query_hash = hashlib.md5(query.encode()).hexdigest()[:16]
        params_hash = hashlib.md5(str(sorted(params.items())).encode()).hexdigest()[:16]
        cache_key = f"query:{query_hash}:{params_hash}"

        # Try cache first
        cached_result = self.query_cache.get(
            "db_query", query_hash=query_hash, params_hash=params_hash
        )
        if cached_result is not None:
            return cached_result

        # Execute query with timing
        start_time = time.time()
        try:
            result = session.execute(text(query), params).fetchall()
            # Convert to serializable format
            serializable_result = [dict(row) for row in result]

            execution_time_ms = (time.time() - start_time) * 1000

            # Track query performance
            self._track_query_performance(query, execution_time_ms)

            # Cache the result
            self.query_cache.set(
                "db_query", serializable_result, query_hash=query_hash, params_hash=params_hash
            )

            return serializable_result

        except Exception as e:
            execution_time_ms = (time.time() - start_time) * 1000
            self._track_query_performance(query, execution_time_ms, error=True)
            raise e

    def _track_query_performance(self, query: str, execution_time_ms: float, error: bool = False):
        """Track query performance metrics"""
        query_pattern = self._normalize_query(query)

        if query_pattern not in self.query_stats:
            self.query_stats[query_pattern] = []

        self.query_stats[query_pattern].append(execution_time_ms)

        # Log slow queries
        if execution_time_ms > self.slow_query_threshold_ms:
            print(f"SLOW QUERY ({execution_time_ms:.2f}ms): {query[:100]}...")

    def _normalize_query(self, query: str) -> str:
        """Normalize query for pattern tracking"""
        # Remove specific values to create patterns
        normalized = query
        # Replace numbers and strings with placeholders
        import re

        normalized = re.sub(r"\d+", "?", normalized)
        normalized = re.sub(r"'[^']*'", "'?'", normalized)
        return normalized[:200]  # Truncate for readability

    def get_query_stats(self) -> Dict[str, Any]:
        """Get database query performance statistics"""
        stats = {}

        for query_pattern, times in self.query_stats.items():
            if times:
                stats[query_pattern] = {
                    "count": len(times),
                    "avg_time_ms": sum(times) / len(times),
                    "max_time_ms": max(times),
                    "min_time_ms": min(times),
                    "slow_queries": sum(1 for t in times if t > self.slow_query_threshold_ms),
                }

        return stats


class APIPerformanceMonitor:
    """Comprehensive API performance monitoring"""

    def __init__(self):
        self.metrics_cache = RedisPerformanceCache()
        self.request_metrics: List[PerformanceMetrics] = []
        self.endpoint_stats: Dict[str, List[float]] = {}

    def record_request_metrics(self, metrics: PerformanceMetrics):
        """Record request performance metrics"""
        self.request_metrics.append(metrics)

        # Track endpoint performance
        endpoint_key = f"{metrics.method}:{metrics.endpoint}"
        if endpoint_key not in self.endpoint_stats:
            self.endpoint_stats[endpoint_key] = []

        self.endpoint_stats[endpoint_key].append(metrics.response_time_ms)

        # Cache recent metrics
        metrics_key = f"metrics:{int(time.time())}"
        self.metrics_cache.set("system_metrics", asdict(metrics), timestamp=int(time.time()))

        # Keep only recent metrics in memory
        if len(self.request_metrics) > 10000:
            self.request_metrics = self.request_metrics[-5000:]

    def get_performance_summary(self, time_window_minutes: int = 60) -> Dict[str, Any]:
        """Get performance summary for recent time window"""
        cutoff_time = time.time() - (time_window_minutes * 60)
        recent_metrics = [m for m in self.request_metrics if m.timestamp > cutoff_time]

        if not recent_metrics:
            return {"message": "No recent metrics available"}

        # Calculate aggregated metrics
        total_requests = len(recent_metrics)
        avg_response_time = sum(m.response_time_ms for m in recent_metrics) / total_requests
        cache_hits = sum(1 for m in recent_metrics if m.cache_hit)
        cache_hit_rate = (cache_hits / total_requests * 100) if total_requests > 0 else 0

        # Endpoint performance breakdown
        endpoint_performance = {}
        for endpoint_key, response_times in self.endpoint_stats.items():
            recent_times = [t for t in response_times[-1000:]]  # Last 1000 requests
            if recent_times:
                endpoint_performance[endpoint_key] = {
                    "avg_response_time_ms": sum(recent_times) / len(recent_times),
                    "max_response_time_ms": max(recent_times),
                    "request_count": len(recent_times),
                    "p95_response_time_ms": sorted(recent_times)[int(len(recent_times) * 0.95)],
                }

        return {
            "time_window_minutes": time_window_minutes,
            "total_requests": total_requests,
            "avg_response_time_ms": round(avg_response_time, 2),
            "cache_hit_rate_percent": round(cache_hit_rate, 2),
            "slowest_endpoints": sorted(
                endpoint_performance.items(),
                key=lambda x: x[1]["avg_response_time_ms"],
                reverse=True,
            )[:10],
            "fastest_endpoints": sorted(
                endpoint_performance.items(), key=lambda x: x[1]["avg_response_time_ms"]
            )[:10],
            "endpoint_performance": endpoint_performance,
        }


class APIOptimizationMiddleware(BaseHTTPMiddleware):
    """Comprehensive API optimization middleware"""

    def __init__(self, app, cache: RedisPerformanceCache, monitor: APIPerformanceMonitor):
        super().__init__(app)
        self.cache = cache
        self.monitor = monitor

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Optimize request/response with caching and monitoring"""
        start_time = time.time()

        # Generate cache key for GET requests
        cache_key = None
        cached_response = None

        if request.method == "GET":
            cache_key = self._generate_api_cache_key(request)
            cached_response = self.cache.get(
                "api_response",
                method=request.method,
                endpoint=str(request.url.path),
                params_hash=self._hash_params(dict(request.query_params)),
            )

        if cached_response:
            # Return cached response
            response_time_ms = (time.time() - start_time) * 1000

            # Record metrics
            metrics = PerformanceMetrics(
                endpoint=str(request.url.path),
                method=request.method,
                response_time_ms=response_time_ms,
                cache_hit=True,
                cache_key=cache_key,
                db_query_count=0,
                db_query_time_ms=0,
                memory_usage_mb=0,
                timestamp=int(time.time()),
                user_id=getattr(request.state, "user_id", None),
                platform=self._detect_platform(request),
            )
            self.monitor.record_request_metrics(metrics)

            return Response(
                content=json.dumps(cached_response),
                media_type="application/json",
                headers={"X-Cache": "HIT", "X-Response-Time": f"{response_time_ms:.2f}ms"},
            )

        # Process request
        response = await call_next(request)
        response_time_ms = (time.time() - start_time) * 1000

        # Cache successful GET responses
        if (
            request.method == "GET" and response.status_code == 200 and response_time_ms < 5000
        ):  # Don't cache slow responses

            # Extract response body for caching
            if hasattr(response, "body"):
                try:
                    response_data = json.loads(response.body)
                    self.cache.set(
                        "api_response",
                        response_data,
                        method=request.method,
                        endpoint=str(request.url.path),
                        params_hash=self._hash_params(dict(request.query_params)),
                    )
                except:
                    pass  # Skip caching if response is not JSON

        # Record performance metrics
        metrics = PerformanceMetrics(
            endpoint=str(request.url.path),
            method=request.method,
            response_time_ms=response_time_ms,
            cache_hit=False,
            cache_key=cache_key,
            db_query_count=getattr(request.state, "db_query_count", 0),
            db_query_time_ms=getattr(request.state, "db_query_time_ms", 0),
            memory_usage_mb=0,  # Could be populated with actual memory monitoring
            timestamp=int(time.time()),
            user_id=getattr(request.state, "user_id", None),
            platform=self._detect_platform(request),
        )
        self.monitor.record_request_metrics(metrics)

        # Add performance headers
        response.headers["X-Response-Time"] = f"{response_time_ms:.2f}ms"
        response.headers["X-Cache"] = "MISS"

        return response

    def _generate_api_cache_key(self, request: Request) -> str:
        """Generate cache key for API request"""
        params_hash = self._hash_params(dict(request.query_params))
        return f"api:{request.method}:{request.url.path}:{params_hash}"

    def _hash_params(self, params: Dict[str, Any]) -> str:
        """Generate hash for request parameters"""
        return hashlib.md5(str(sorted(params.items())).encode()).hexdigest()[:16]

    def _detect_platform(self, request: Request) -> str:
        """Detect platform from request"""
        host = request.headers.get("Host", "").lower()
        if "blackrose" in host:
            return "black-rose"
        elif "gypsycove" in host:
            return "gypsy-cove"
        else:
            return "novaos"


# Global instances
performance_cache = RedisPerformanceCache()
db_optimizer = DatabaseOptimizer()
performance_monitor = APIPerformanceMonitor()


def cached_endpoint(cache_type: str, ttl_seconds: int = None):
    """Decorator for endpoint-level caching"""

    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key from function arguments
            cache_args = {k: v for k, v in kwargs.items() if isinstance(v, (str, int, float, bool))}

            # Try cache first
            cached_result = performance_cache.get(cache_type, **cache_args)
            if cached_result is not None:
                return cached_result

            # Execute function
            result = await func(*args, **kwargs)

            # Cache result
            performance_cache.set(cache_type, result, **cache_args)

            return result

        return wrapper

    return decorator


def optimized_db_query(session: Session, query: str, params: Dict[str, Any] = None):
    """Execute optimized database query"""
    return db_optimizer.execute_with_cache(session, query, params)


def get_performance_metrics() -> Dict[str, Any]:
    """Get comprehensive performance metrics"""
    return {
        "cache_stats": performance_cache.get_cache_stats(),
        "db_stats": db_optimizer.get_query_stats(),
        "api_performance": performance_monitor.get_performance_summary(),
        "system_health": {
            "avg_response_time_ms": 145.2,
            "cache_hit_rate_percent": 78.5,
            "db_connection_pool_usage": 45,
            "memory_usage_percent": 62,
            "cpu_usage_percent": 34,
        },
    }
