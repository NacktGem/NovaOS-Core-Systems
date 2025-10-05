"""
CDN Integration and Response Compression System

Provides comprehensive content delivery network integration with:
- Multi-CDN support (AWS CloudFront, Cloudflare, Azure CDN)
- Intelligent content routing and caching strategies
- Response compression (gzip, brotli, zstd)
- Static asset optimization and delivery
- Real-time cache invalidation and purging
"""

import gzip
import zstandard as zstd
import brotli
import asyncio
import hashlib
import json
import time
import mimetypes
from typing import Dict, List, Optional, Any, Union, Callable
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
import aiohttp
from fastapi import Request, Response, HTTPException
from fastapi.responses import StreamingResponse
import boto3
from botocore.exceptions import ClientError


class CDNProvider(Enum):
    """Supported CDN providers"""

    CLOUDFRONT = "cloudfront"
    CLOUDFLARE = "cloudflare"
    AZURE_CDN = "azure_cdn"
    FASTLY = "fastly"
    LOCAL = "local"


class CompressionType(Enum):
    """Compression algorithms"""

    GZIP = "gzip"
    BROTLI = "br"
    ZSTD = "zstd"
    NONE = "none"


class CacheStrategy(Enum):
    """Content caching strategies"""

    AGGRESSIVE = "aggressive"  # Long cache times, good for static content
    MODERATE = "moderate"  # Medium cache times, good for semi-static content
    CONSERVATIVE = "conservative"  # Short cache times, good for dynamic content
    NO_CACHE = "no_cache"  # No caching, good for sensitive content
    CUSTOM = "custom"  # Custom cache rules


@dataclass
class CDNConfig:
    """CDN configuration settings"""

    provider: CDNProvider
    distribution_id: str
    domain: str
    region: str = "us-east-1"
    api_key: Optional[str] = None
    api_secret: Optional[str] = None
    zone_id: Optional[str] = None  # For Cloudflare
    enabled: bool = True

    # Cache settings
    default_ttl: int = 86400  # 24 hours
    max_ttl: int = 31536000  # 1 year
    browser_ttl: int = 3600  # 1 hour

    # Compression settings
    compression_enabled: bool = True
    min_compression_size: int = 1000  # Minimum size to compress (bytes)


@dataclass
class ContentRule:
    """Content-specific delivery rules"""

    path_pattern: str  # URL pattern to match
    cache_strategy: CacheStrategy = CacheStrategy.MODERATE
    custom_ttl: Optional[int] = None
    compression_type: CompressionType = CompressionType.GZIP
    headers: Dict[str, str] = field(default_factory=dict)
    allowed_methods: List[str] = field(default_factory=lambda: ["GET", "HEAD"])
    origin_shield: bool = False
    geo_restrictions: List[str] = field(default_factory=list)


class CompressionManager:
    """Handles response compression with multiple algorithms"""

    def __init__(self):
        self.compressors = {
            CompressionType.GZIP: self._gzip_compress,
            CompressionType.BROTLI: self._brotli_compress,
            CompressionType.ZSTD: self._zstd_compress,
        }

        # Compression quality settings
        self.compression_levels = {
            CompressionType.GZIP: 6,  # Balance of speed and compression
            CompressionType.BROTLI: 4,  # Good compression with reasonable speed
            CompressionType.ZSTD: 3,  # Fast compression with good ratio
        }

    def should_compress(self, content_type: str, content_length: int, min_size: int = 1000) -> bool:
        """Determine if content should be compressed"""
        if content_length < min_size:
            return False

        compressible_types = {
            "text/",
            "application/json",
            "application/javascript",
            "application/xml",
            "application/rss+xml",
            "application/atom+xml",
            "image/svg+xml",
            "application/x-font-ttf",
            "font/opentype",
        }

        return any(content_type.startswith(ct) for ct in compressible_types)

    def get_best_compression(self, accept_encoding: str) -> CompressionType:
        """Determine best compression method based on client support"""
        accept_encoding = accept_encoding.lower()

        # Priority order: Brotli > Zstandard > Gzip
        if "br" in accept_encoding:
            return CompressionType.BROTLI
        elif "zstd" in accept_encoding:
            return CompressionType.ZSTD
        elif "gzip" in accept_encoding or "deflate" in accept_encoding:
            return CompressionType.GZIP
        else:
            return CompressionType.NONE

    async def compress_content(self, content: bytes, compression_type: CompressionType) -> bytes:
        """Compress content using specified algorithm"""
        if compression_type == CompressionType.NONE:
            return content

        compressor = self.compressors.get(compression_type)
        if not compressor:
            return content

        try:
            # Run compression in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            compressed = await loop.run_in_executor(None, compressor, content)
            return compressed
        except Exception as e:
            print(f"Compression error with {compression_type.value}: {e}")
            return content

    def _gzip_compress(self, content: bytes) -> bytes:
        """Gzip compression"""
        return gzip.compress(content, compresslevel=self.compression_levels[CompressionType.GZIP])

    def _brotli_compress(self, content: bytes) -> bytes:
        """Brotli compression"""
        return brotli.compress(content, quality=self.compression_levels[CompressionType.BROTLI])

    def _zstd_compress(self, content: bytes) -> bytes:
        """Zstandard compression"""
        cctx = zstd.ZstdCompressor(level=self.compression_levels[CompressionType.ZSTD])
        return cctx.compress(content)


class CloudFrontManager:
    """AWS CloudFront CDN management"""

    def __init__(self, config: CDNConfig):
        self.config = config
        self.client = boto3.client("cloudfront", region_name=config.region)

    async def invalidate_cache(self, paths: List[str]) -> Dict[str, Any]:
        """Invalidate CloudFront cache for specified paths"""
        try:
            response = self.client.create_invalidation(
                DistributionId=self.config.distribution_id,
                InvalidationBatch={
                    "Paths": {"Quantity": len(paths), "Items": paths},
                    "CallerReference": f"invalidation-{int(time.time())}",
                },
            )

            return {
                "success": True,
                "invalidation_id": response["Invalidation"]["Id"],
                "status": response["Invalidation"]["Status"],
                "paths": paths,
            }
        except ClientError as e:
            return {"success": False, "error": str(e), "paths": paths}

    async def get_distribution_stats(self) -> Dict[str, Any]:
        """Get CloudFront distribution statistics"""
        try:
            response = self.client.get_distribution(Id=self.config.distribution_id)
            distribution = response["Distribution"]

            return {
                "id": distribution["Id"],
                "domain_name": distribution["DomainName"],
                "status": distribution["Status"],
                "enabled": distribution["DistributionConfig"]["Enabled"],
                "last_modified": distribution["LastModifiedTime"].isoformat(),
                "origins": len(distribution["DistributionConfig"]["Origins"]["Items"]),
            }
        except ClientError as e:
            return {"error": str(e)}

    async def update_cache_behaviors(self, behaviors: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Update CloudFront cache behaviors"""
        try:
            # Get current distribution config
            response = self.client.get_distribution_config(Id=self.config.distribution_id)
            config = response["DistributionConfig"]
            etag = response["ETag"]

            # Update cache behaviors
            config["CacheBehaviors"] = {"Quantity": len(behaviors), "Items": behaviors}

            # Update distribution
            update_response = self.client.update_distribution(
                DistributionConfig=config, Id=self.config.distribution_id, IfMatch=etag
            )

            return {
                "success": True,
                "etag": update_response["ETag"],
                "status": update_response["Distribution"]["Status"],
            }
        except ClientError as e:
            return {"success": False, "error": str(e)}


class CloudflareManager:
    """Cloudflare CDN management"""

    def __init__(self, config: CDNConfig):
        self.config = config
        self.base_url = "https://api.cloudflare.com/v4"
        self.headers = {
            "Authorization": f"Bearer {config.api_key}",
            "Content-Type": "application/json",
        }

    async def purge_cache(
        self, files: List[str] = None, purge_everything: bool = False
    ) -> Dict[str, Any]:
        """Purge Cloudflare cache"""
        url = f"{self.base_url}/zones/{self.config.zone_id}/purge_cache"

        if purge_everything:
            data = {"purge_everything": True}
        else:
            data = {"files": files or []}

        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(url, headers=self.headers, json=data) as response:
                    result = await response.json()
                    return {
                        "success": result.get("success", False),
                        "result": result.get("result"),
                        "errors": result.get("errors", []),
                    }
            except Exception as e:
                return {"success": False, "error": str(e)}

    async def get_cache_analytics(self, since: str = "24h") -> Dict[str, Any]:
        """Get Cloudflare cache analytics"""
        url = f"{self.base_url}/zones/{self.config.zone_id}/analytics/dashboard"
        params = {"since": since}

        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(url, headers=self.headers, params=params) as response:
                    result = await response.json()
                    return result.get("result", {})
            except Exception as e:
                return {"error": str(e)}

    async def update_cache_rules(self, rules: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Update Cloudflare cache rules"""
        url = f"{self.base_url}/zones/{self.config.zone_id}/rulesets"

        data = {
            "name": "Cache Rules",
            "kind": "zone",
            "phase": "http_request_cache_settings",
            "rules": rules,
        }

        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(url, headers=self.headers, json=data) as response:
                    result = await response.json()
                    return {
                        "success": result.get("success", False),
                        "result": result.get("result"),
                        "errors": result.get("errors", []),
                    }
            except Exception as e:
                return {"success": False, "error": str(e)}


class AdvancedCDNSystem:
    """Advanced CDN system with multi-provider support"""

    def __init__(self, primary_config: CDNConfig, fallback_configs: List[CDNConfig] = None):
        self.primary_config = primary_config
        self.fallback_configs = fallback_configs or []
        self.compression_manager = CompressionManager()

        # Initialize CDN managers
        self.managers = {}
        self._initialize_managers()

        # Content delivery rules
        self.content_rules = self._initialize_content_rules()

        # Performance metrics
        self.metrics = {
            "requests_served": 0,
            "bytes_saved_compression": 0,
            "cache_hit_ratio": 0.0,
            "avg_response_time": 0.0,
        }

    def _initialize_managers(self):
        """Initialize CDN provider managers"""
        if self.primary_config.provider == CDNProvider.CLOUDFRONT:
            self.managers["primary"] = CloudFrontManager(self.primary_config)
        elif self.primary_config.provider == CDNProvider.CLOUDFLARE:
            self.managers["primary"] = CloudflareManager(self.primary_config)

        # Initialize fallback managers
        for i, config in enumerate(self.fallback_configs):
            manager_key = f"fallback_{i}"
            if config.provider == CDNProvider.CLOUDFRONT:
                self.managers[manager_key] = CloudFrontManager(config)
            elif config.provider == CDNProvider.CLOUDFLARE:
                self.managers[manager_key] = CloudflareManager(config)

    def _initialize_content_rules(self) -> List[ContentRule]:
        """Initialize content delivery rules for different platforms"""
        return [
            # Static assets - aggressive caching
            ContentRule(
                path_pattern="/static/*",
                cache_strategy=CacheStrategy.AGGRESSIVE,
                custom_ttl=31536000,  # 1 year
                compression_type=CompressionType.BROTLI,
                headers={"Cache-Control": "public, max-age=31536000, immutable"},
            ),
            # API responses - conservative caching
            ContentRule(
                path_pattern="/api/*",
                cache_strategy=CacheStrategy.CONSERVATIVE,
                custom_ttl=300,  # 5 minutes
                compression_type=CompressionType.GZIP,
                headers={"Cache-Control": "public, max-age=300, must-revalidate"},
            ),
            # Black Rose content - moderate caching with geo-restrictions
            ContentRule(
                path_pattern="/black-rose/content/*",
                cache_strategy=CacheStrategy.MODERATE,
                custom_ttl=3600,  # 1 hour
                compression_type=CompressionType.BROTLI,
                headers={
                    "Cache-Control": "private, max-age=3600",
                    "X-Content-Type-Options": "nosniff",
                },
                geo_restrictions=["US", "CA", "EU"],  # Restrict to allowed regions
            ),
            # GypsyCove social content - moderate caching
            ContentRule(
                path_pattern="/gypsy-cove/*",
                cache_strategy=CacheStrategy.MODERATE,
                custom_ttl=1800,  # 30 minutes
                compression_type=CompressionType.GZIP,
                headers={"Cache-Control": "public, max-age=1800"},
            ),
            # NovaOS system files - aggressive caching
            ContentRule(
                path_pattern="/novaos/system/*",
                cache_strategy=CacheStrategy.AGGRESSIVE,
                custom_ttl=86400,  # 24 hours
                compression_type=CompressionType.ZSTD,
                headers={"Cache-Control": "public, max-age=86400"},
                origin_shield=True,
            ),
            # User uploads - no caching for privacy
            ContentRule(
                path_pattern="/uploads/private/*",
                cache_strategy=CacheStrategy.NO_CACHE,
                compression_type=CompressionType.NONE,
                headers={
                    "Cache-Control": "private, no-cache, no-store, must-revalidate",
                    "Pragma": "no-cache",
                    "Expires": "0",
                },
            ),
        ]

    def find_content_rule(self, path: str) -> Optional[ContentRule]:
        """Find matching content rule for given path"""
        import fnmatch

        for rule in self.content_rules:
            if fnmatch.fnmatch(path, rule.path_pattern):
                return rule

        return None

    async def serve_content(
        self, request: Request, content: bytes, content_type: str, path: str = None
    ) -> Response:
        """Serve content with optimal delivery and compression"""
        start_time = time.time()

        # Find applicable content rule
        path = path or request.url.path
        content_rule = self.find_content_rule(path)

        # Determine compression
        accept_encoding = request.headers.get("accept-encoding", "")
        compression_type = self.compression_manager.get_best_compression(accept_encoding)

        # Override compression based on content rule
        if content_rule and content_rule.compression_type != CompressionType.GZIP:
            compression_type = content_rule.compression_type

        # Compress content if applicable
        original_size = len(content)
        should_compress = self.compression_manager.should_compress(
            content_type, original_size, self.primary_config.min_compression_size
        )

        if should_compress and compression_type != CompressionType.NONE:
            content = await self.compression_manager.compress_content(content, compression_type)
            compressed_size = len(content)
            self.metrics["bytes_saved_compression"] += original_size - compressed_size
        else:
            compression_type = CompressionType.NONE

        # Build response headers
        headers = {"Content-Type": content_type, "Content-Length": str(len(content))}

        # Add compression headers
        if compression_type != CompressionType.NONE:
            headers["Content-Encoding"] = compression_type.value
            headers["Vary"] = "Accept-Encoding"

        # Add cache headers based on content rule
        if content_rule:
            headers.update(content_rule.headers)

            # Add CDN headers
            headers["X-CDN-Provider"] = self.primary_config.provider.value
            headers["X-Cache-Strategy"] = content_rule.cache_strategy.value

            if content_rule.custom_ttl:
                headers["X-CDN-TTL"] = str(content_rule.custom_ttl)

        # Add performance headers
        response_time = (time.time() - start_time) * 1000  # Convert to milliseconds
        headers["X-Response-Time"] = f"{response_time:.2f}ms"
        headers["X-Served-By"] = "NovaOS-CDN"

        # Update metrics
        self.metrics["requests_served"] += 1
        self.metrics["avg_response_time"] = (
            self.metrics["avg_response_time"] * (self.metrics["requests_served"] - 1)
            + response_time
        ) / self.metrics["requests_served"]

        return Response(content=content, media_type=content_type, headers=headers)

    async def invalidate_cache(self, paths: List[str], provider: str = "primary") -> Dict[str, Any]:
        """Invalidate cache across CDN providers"""
        manager = self.managers.get(provider)
        if not manager:
            return {"success": False, "error": f"Manager {provider} not found"}

        return await manager.invalidate_cache(paths)

    async def get_cdn_statistics(self) -> Dict[str, Any]:
        """Get comprehensive CDN statistics"""
        stats = {
            "system_metrics": self.metrics.copy(),
            "providers": {},
            "content_rules": len(self.content_rules),
        }

        # Get statistics from each provider
        for manager_name, manager in self.managers.items():
            try:
                if hasattr(manager, "get_distribution_stats"):
                    stats["providers"][manager_name] = await manager.get_distribution_stats()
                elif hasattr(manager, "get_cache_analytics"):
                    stats["providers"][manager_name] = await manager.get_cache_analytics()
            except Exception as e:
                stats["providers"][manager_name] = {"error": str(e)}

        return stats

    async def optimize_delivery(self, content_type: str, size: int) -> Dict[str, Any]:
        """Get optimization recommendations for content delivery"""
        recommendations = []

        # Compression recommendations
        if size > self.primary_config.min_compression_size:
            if content_type.startswith("text/") or "json" in content_type:
                recommendations.append("Enable Brotli compression for better text compression")
            elif content_type.startswith("image/"):
                recommendations.append("Consider WebP format for images")

        # Caching recommendations
        if content_type in ["text/css", "application/javascript"]:
            recommendations.append("Use aggressive caching with long TTL")
        elif content_type.startswith("image/"):
            recommendations.append("Use moderate caching with versioning")

        # CDN recommendations
        if size > 1024 * 1024:  # 1MB
            recommendations.append("Enable Origin Shield for large files")
            recommendations.append("Consider enabling HTTP/2 Push")

        return {
            "content_type": content_type,
            "size": size,
            "recommendations": recommendations,
            "optimal_compression": self.compression_manager.get_best_compression("br, gzip").value,
            "suggested_ttl": self._suggest_ttl(content_type),
        }

    def _suggest_ttl(self, content_type: str) -> int:
        """Suggest optimal TTL based on content type"""
        if content_type in ["text/css", "application/javascript"]:
            return 31536000  # 1 year for static assets
        elif content_type.startswith("image/"):
            return 86400  # 1 day for images
        elif "json" in content_type or "xml" in content_type:
            return 300  # 5 minutes for API responses
        else:
            return 3600  # 1 hour default


# Global CDN system instance
cdn_system = None


def initialize_cdn_system(primary_config: CDNConfig, fallback_configs: List[CDNConfig] = None):
    """Initialize global CDN system"""
    global cdn_system
    cdn_system = AdvancedCDNSystem(primary_config, fallback_configs)


async def serve_with_cdn(
    request: Request, content: bytes, content_type: str, path: str = None
) -> Response:
    """Serve content through CDN system"""
    if not cdn_system:
        # Return basic response if CDN not configured
        return Response(content=content, media_type=content_type)

    return await cdn_system.serve_content(request, content, content_type, path)


def cdn_headers(cache_strategy: CacheStrategy = CacheStrategy.MODERATE):
    """Decorator to add CDN-optimized headers to responses"""

    def decorator(func):
        async def wrapper(request: Request, *args, **kwargs):
            response = await func(request, *args, **kwargs)

            # Add CDN optimization headers based on strategy
            if hasattr(response, "headers"):
                if cache_strategy == CacheStrategy.AGGRESSIVE:
                    response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
                elif cache_strategy == CacheStrategy.MODERATE:
                    response.headers["Cache-Control"] = "public, max-age=3600, must-revalidate"
                elif cache_strategy == CacheStrategy.CONSERVATIVE:
                    response.headers["Cache-Control"] = "public, max-age=300, must-revalidate"
                elif cache_strategy == CacheStrategy.NO_CACHE:
                    response.headers["Cache-Control"] = (
                        "private, no-cache, no-store, must-revalidate"
                    )

                response.headers["X-CDN-Strategy"] = cache_strategy.value

            return response

        return wrapper

    return decorator
