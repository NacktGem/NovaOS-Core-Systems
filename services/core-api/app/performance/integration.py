"""
API Performance Optimization Integration

Integrates all performance optimization components:
- Redis caching system
- Database query optimization
- Rate limiting and throttling
- CDN integration
- Response compression
- Performance monitoring and testing

This module provides a unified interface for all performance optimizations.
"""

import asyncio
import time
from typing import Dict, List, Optional, Any
from fastapi import FastAPI, Request, Response, HTTPException, Depends
from fastapi.middleware.base import BaseHTTPMiddleware
from fastapi.responses import JSONResponse
import redis
from contextlib import asynccontextmanager

# Import our performance modules
from .optimizer import (
    RedisPerformanceCache,
    DatabaseOptimizer,
    APIPerformanceMonitor,
    PerformanceTier,
)
from .rate_limiter import AdvancedRateLimiter, rate_limit
from .cdn_system import AdvancedCDNSystem, CDNConfig, CDNProvider, serve_with_cdn
from .testing_suite import PerformanceTester, TestConfig


class PerformanceOptimizationMiddleware(BaseHTTPMiddleware):
    """Middleware that applies all performance optimizations"""

    def __init__(self, app: FastAPI, performance_manager: "PerformanceManager"):
        super().__init__(app)
        self.performance_manager = performance_manager

    async def dispatch(self, request: Request, call_next):
        """Apply performance optimizations to all requests"""
        start_time = time.time()

        # Record request start
        await self.performance_manager.monitor.record_request_start(
            request.url.path, request.method
        )

        try:
            # Check rate limits
            await self.performance_manager.check_rate_limits(request)

            # Try to serve from cache first
            cached_response = await self.performance_manager.try_serve_from_cache(request)
            if cached_response:
                response_time = (time.time() - start_time) * 1000
                await self.performance_manager.monitor.record_request_end(
                    request.url.path, 200, response_time, cached=True
                )
                return cached_response

            # Process request normally
            response = await call_next(request)

            # Apply response optimizations
            response = await self.performance_manager.optimize_response(request, response)

            # Cache response if appropriate
            await self.performance_manager.try_cache_response(request, response)

            # Record metrics
            response_time = (time.time() - start_time) * 1000
            await self.performance_manager.monitor.record_request_end(
                request.url.path, response.status_code, response_time
            )

            return response

        except HTTPException as e:
            # Handle rate limiting and other HTTP exceptions
            response_time = (time.time() - start_time) * 1000
            await self.performance_manager.monitor.record_request_end(
                request.url.path, e.status_code, response_time, error=str(e.detail)
            )
            raise e

        except Exception as e:
            # Handle unexpected errors
            response_time = (time.time() - start_time) * 1000
            await self.performance_manager.monitor.record_request_end(
                request.url.path, 500, response_time, error=str(e)
            )
            return JSONResponse(
                status_code=500, content={"error": "Internal server error", "message": str(e)}
            )


class PerformanceManager:
    """Central manager for all performance optimizations"""

    def __init__(
        self,
        redis_url: str = "redis://localhost:6379",
        performance_tier: PerformanceTier = PerformanceTier.STANDARD,
        cdn_config: Optional[CDNConfig] = None,
    ):
        # Initialize components
        self.cache = RedisPerformanceCache(redis_url, performance_tier)
        self.db_optimizer = DatabaseOptimizer()
        self.monitor = APIPerformanceMonitor()
        self.rate_limiter = AdvancedRateLimiter(redis_url)

        # Initialize CDN if configured
        self.cdn_system = None
        if cdn_config:
            self.cdn_system = AdvancedCDNSystem(cdn_config)

        # Performance configuration
        self.performance_tier = performance_tier
        self.optimization_enabled = True

        # Caching rules
        self.cache_rules = self._initialize_cache_rules()

        # Performance metrics
        self.metrics = {
            "requests_processed": 0,
            "cache_hits": 0,
            "cache_misses": 0,
            "rate_limits_applied": 0,
            "optimizations_applied": 0,
        }

    def _initialize_cache_rules(self) -> Dict[str, Dict[str, Any]]:
        """Initialize caching rules for different endpoints"""
        return {
            # Static assets - long cache
            "static": {
                "patterns": ["/static/*", "*.css", "*.js", "*.png", "*.jpg", "*.svg"],
                "ttl": 86400,  # 24 hours
                "compress": True,
                "strategy": "aggressive",
            },
            # API responses - short cache
            "api": {
                "patterns": ["/api/health", "/api/version", "/api/status"],
                "ttl": 300,  # 5 minutes
                "compress": True,
                "strategy": "moderate",
            },
            # User data - very short cache
            "user_data": {
                "patterns": ["/api/auth/profile", "/api/user/*"],
                "ttl": 60,  # 1 minute
                "compress": True,
                "strategy": "conservative",
            },
            # Platform content - moderate cache
            "platform_content": {
                "patterns": [
                    "/api/platforms/*/dashboard",
                    "/api/platforms/*/content",
                    "/api/platforms/*/feed",
                ],
                "ttl": 600,  # 10 minutes
                "compress": True,
                "strategy": "moderate",
            },
            # No cache for sensitive operations
            "no_cache": {
                "patterns": [
                    "/api/auth/login",
                    "/api/auth/logout",
                    "/api/payments/*",
                    "/api/admin/*",
                ],
                "ttl": 0,
                "compress": False,
                "strategy": "none",
            },
        }

    def find_cache_rule(self, path: str) -> Optional[Dict[str, Any]]:
        """Find applicable cache rule for given path"""
        import fnmatch

        for rule_name, rule_config in self.cache_rules.items():
            for pattern in rule_config["patterns"]:
                if fnmatch.fnmatch(path, pattern):
                    return rule_config

        return None

    async def check_rate_limits(self, request: Request):
        """Check rate limits for incoming request"""
        # Determine rate limit category based on endpoint
        path = request.url.path

        if path.startswith("/api/auth/"):
            category, limit_type = "auth", "login"
        elif path.startswith("/api/"):
            # Determine user type from request (simplified)
            category, limit_type = "api", "user"  # Default to user limits
        elif path.startswith("/black-rose/"):
            category, limit_type = "black_rose", "content_upload"
        elif path.startswith("/gypsy-cove/"):
            category, limit_type = "gypsy_cove", "post_creation"
        elif path.startswith("/novaos/"):
            category, limit_type = "novaos", "agent_creation"
        else:
            return  # No rate limiting for other endpoints

        # Check rate limit
        allowed, info = await self.rate_limiter.check_rate_limit(category, limit_type, request)

        if not allowed:
            self.metrics["rate_limits_applied"] += 1
            rate_limit_config = self.rate_limiter.rate_limits[category][limit_type]
            await self.rate_limiter.handle_rate_limit_exceeded(rate_limit_config, info, request)

    async def try_serve_from_cache(self, request: Request) -> Optional[Response]:
        """Try to serve request from cache"""
        if not self.optimization_enabled:
            return None

        # Only cache GET requests
        if request.method != "GET":
            return None

        # Find cache rule
        cache_rule = self.find_cache_rule(request.url.path)
        if not cache_rule or cache_rule["ttl"] == 0:
            return None

        # Generate cache key
        cache_key = self._generate_cache_key(request)

        try:
            # Try to get from cache
            cached_data = await self.cache.get(cache_key)
            if cached_data:
                self.metrics["cache_hits"] += 1

                # Parse cached response
                content = cached_data.get("content", b"")
                headers = cached_data.get("headers", {})
                media_type = cached_data.get("media_type", "application/json")

                # Add cache headers
                headers["X-Cache"] = "HIT"
                headers["X-Cache-Key"] = cache_key[:16]  # Shortened for security

                return Response(content=content, media_type=media_type, headers=headers)

            self.metrics["cache_misses"] += 1
            return None

        except Exception as e:
            print(f"Cache retrieval error: {e}")
            self.metrics["cache_misses"] += 1
            return None

    async def try_cache_response(self, request: Request, response: Response):
        """Try to cache the response"""
        if not self.optimization_enabled:
            return

        # Only cache successful GET responses
        if request.method != "GET" or response.status_code != 200:
            return

        # Find cache rule
        cache_rule = self.find_cache_rule(request.url.path)
        if not cache_rule or cache_rule["ttl"] == 0:
            return

        try:
            # Generate cache key
            cache_key = self._generate_cache_key(request)

            # Prepare cache data
            cache_data = {
                "content": response.body,
                "headers": dict(response.headers),
                "media_type": response.media_type,
                "cached_at": time.time(),
            }

            # Cache with TTL
            await self.cache.set(cache_key, cache_data, ttl=cache_rule["ttl"])

        except Exception as e:
            print(f"Cache storage error: {e}")

    async def optimize_response(self, request: Request, response: Response) -> Response:
        """Apply response optimizations"""
        if not self.optimization_enabled:
            return response

        # CDN optimization
        if self.cdn_system and hasattr(response, "body"):
            try:
                response = await serve_with_cdn(
                    request,
                    response.body,
                    response.media_type or "application/octet-stream",
                    request.url.path,
                )
            except Exception as e:
                print(f"CDN optimization error: {e}")

        # Add performance headers
        response.headers["X-Performance-Tier"] = self.performance_tier.value
        response.headers["X-Optimization-Enabled"] = (
            "true" if self.optimization_enabled else "false"
        )

        self.metrics["optimizations_applied"] += 1
        return response

    def _generate_cache_key(self, request: Request) -> str:
        """Generate cache key for request"""
        import hashlib

        # Include path, query params, and relevant headers
        key_parts = [
            request.url.path,
            str(request.query_params),
            request.headers.get("accept", ""),
            request.headers.get("accept-encoding", ""),
        ]

        # Add user context if authenticated
        if hasattr(request.state, "user_id"):
            key_parts.append(str(request.state.user_id))

        key_string = "|".join(key_parts)
        return f"api_cache:{hashlib.md5(key_string.encode()).hexdigest()}"

    async def get_performance_metrics(self) -> Dict[str, Any]:
        """Get comprehensive performance metrics"""
        # Get component metrics
        cache_stats = await self.cache.get_cache_stats()
        monitor_stats = await self.monitor.get_performance_report()
        rate_limit_stats = self.rate_limiter.get_rate_limit_stats()

        # Combine metrics
        return {
            "system_metrics": self.metrics,
            "cache_performance": cache_stats,
            "api_performance": monitor_stats,
            "rate_limiting": rate_limit_stats,
            "cdn_stats": await self.cdn_system.get_cdn_statistics() if self.cdn_system else {},
            "performance_tier": self.performance_tier.value,
            "optimization_enabled": self.optimization_enabled,
            "timestamp": time.time(),
        }

    async def run_performance_test(self, base_url: str = "http://localhost:8000") -> Dict[str, Any]:
        """Run performance testing suite"""
        config = TestConfig(
            base_url=base_url,
            concurrent_users=10,
            requests_per_user=50,
            cache_test_enabled=True,
            rate_limit_test_enabled=True,
            load_test_enabled=True,
        )

        tester = PerformanceTester(config)
        return await tester.run_comprehensive_tests()

    async def optimize_database_queries(self, queries: List[str]) -> Dict[str, Any]:
        """Optimize database queries"""
        results = {}
        for query in queries:
            result = await self.db_optimizer.optimize_query(query)
            results[query[:50] + "..."] = result

        return {
            "optimization_results": results,
            "total_queries_optimized": len(queries),
            "cache_enabled": self.db_optimizer.use_query_cache,
        }

    def enable_optimization(self):
        """Enable performance optimizations"""
        self.optimization_enabled = True

    def disable_optimization(self):
        """Disable performance optimizations"""
        self.optimization_enabled = False

    async def invalidate_cache_pattern(self, pattern: str) -> Dict[str, Any]:
        """Invalidate cache entries matching pattern"""
        try:
            result = await self.cache.invalidate_pattern(pattern)
            return {"success": True, "pattern": pattern, "invalidated_keys": result}
        except Exception as e:
            return {"success": False, "pattern": pattern, "error": str(e)}


# Global performance manager instance
performance_manager: Optional[PerformanceManager] = None


def initialize_performance_system(
    app: FastAPI,
    redis_url: str = "redis://localhost:6379",
    performance_tier: PerformanceTier = PerformanceTier.STANDARD,
    cdn_config: Optional[CDNConfig] = None,
):
    """Initialize the performance optimization system"""
    global performance_manager

    print("🚀 Initializing Performance Optimization System...")

    # Create performance manager
    performance_manager = PerformanceManager(
        redis_url=redis_url, performance_tier=performance_tier, cdn_config=cdn_config
    )

    # Add middleware
    app.add_middleware(PerformanceOptimizationMiddleware, performance_manager=performance_manager)

    # Add performance endpoints
    @app.get("/api/performance/metrics")
    async def get_performance_metrics():
        """Get performance metrics"""
        if not performance_manager:
            return {"error": "Performance system not initialized"}

        return await performance_manager.get_performance_metrics()

    @app.post("/api/performance/test")
    async def run_performance_test():
        """Run performance test suite"""
        if not performance_manager:
            return {"error": "Performance system not initialized"}

        return await performance_manager.run_performance_test()

    @app.post("/api/performance/cache/invalidate")
    async def invalidate_cache(pattern: str):
        """Invalidate cache entries matching pattern"""
        if not performance_manager:
            return {"error": "Performance system not initialized"}

        return await performance_manager.invalidate_cache_pattern(pattern)

    @app.post("/api/performance/optimization/enable")
    async def enable_optimization():
        """Enable performance optimizations"""
        if not performance_manager:
            return {"error": "Performance system not initialized"}

        performance_manager.enable_optimization()
        return {"message": "Performance optimization enabled"}

    @app.post("/api/performance/optimization/disable")
    async def disable_optimization():
        """Disable performance optimizations"""
        if not performance_manager:
            return {"error": "Performance system not initialized"}

        performance_manager.disable_optimization()
        return {"message": "Performance optimization disabled"}

    print("✅ Performance Optimization System initialized successfully!")

    return performance_manager


def get_performance_manager() -> Optional[PerformanceManager]:
    """Get the global performance manager instance"""
    return performance_manager


# Example usage with different performance tiers
def create_production_performance_config() -> Dict[str, Any]:
    """Create production-grade performance configuration"""
    return {
        "redis_url": "redis://redis-cluster:6379",
        "performance_tier": PerformanceTier.ENTERPRISE,
        "cdn_config": CDNConfig(
            provider=CDNProvider.CLOUDFRONT,
            distribution_id="E1234567890ABC",
            domain="cdn.novaos.com",
            region="us-east-1",
            default_ttl=86400,  # 24 hours
            compression_enabled=True,
        ),
    }


def create_development_performance_config() -> Dict[str, Any]:
    """Create development performance configuration"""
    return {
        "redis_url": "redis://localhost:6379",
        "performance_tier": PerformanceTier.BASIC,
        "cdn_config": None,  # No CDN for development
    }


# Async context manager for performance optimization
@asynccontextmanager
async def performance_optimization_context(config: Dict[str, Any]):
    """Context manager for performance optimization lifecycle"""
    print("🚀 Starting Performance Optimization System...")

    # Initialize components
    manager = PerformanceManager(**config)

    try:
        # Yield control to the application
        yield manager

    finally:
        print("🛑 Shutting down Performance Optimization System...")

        # Cleanup resources
        if manager.cache:
            await manager.cache.close()

        print("✅ Performance Optimization System shutdown complete")


# Example FastAPI integration
def setup_performance_optimized_app() -> FastAPI:
    """Create FastAPI app with performance optimizations"""

    app = FastAPI(
        title="NovaOS Core API",
        description="High-performance multi-platform API with advanced optimizations",
        version="1.0.0",
    )

    # Initialize performance system
    config = create_development_performance_config()  # or create_production_performance_config()
    initialize_performance_system(app, **config)

    return app
