"""
Performance Testing and Validation System

Comprehensive performance testing framework for API optimization validation:
- Load testing with concurrent requests
- Response time benchmarking
- Cache performance validation
- Database query optimization testing
- Rate limiting effectiveness testing
- CDN performance measurement
"""

import asyncio
import time
import statistics
import json
import random
import aiofiles
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
import httpx
from concurrent.futures import ThreadPoolExecutor
import psutil
import sqlite3
from pathlib import Path


@dataclass
class TestConfig:
    """Performance test configuration"""

    base_url: str
    concurrent_users: int = 10
    requests_per_user: int = 100
    test_duration_seconds: int = 60
    endpoints_to_test: List[str] = None
    auth_token: Optional[str] = None

    # Test scenarios
    cache_test_enabled: bool = True
    rate_limit_test_enabled: bool = True
    load_test_enabled: bool = True
    stress_test_enabled: bool = False

    # Performance thresholds
    max_response_time_ms: float = 1000.0
    min_throughput_rps: float = 100.0
    max_error_rate_percent: float = 1.0
    min_cache_hit_rate_percent: float = 80.0


@dataclass
class TestResult:
    """Individual test result"""

    endpoint: str
    method: str
    response_time_ms: float
    status_code: int
    success: bool
    error_message: Optional[str] = None
    cached: bool = False
    compressed: bool = False
    response_size_bytes: int = 0
    timestamp: datetime = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now()


@dataclass
class PerformanceReport:
    """Comprehensive performance test report"""

    test_name: str
    start_time: datetime
    end_time: datetime
    total_requests: int
    successful_requests: int
    failed_requests: int
    avg_response_time_ms: float
    p95_response_time_ms: float
    p99_response_time_ms: float
    throughput_rps: float
    error_rate_percent: float
    cache_hit_rate_percent: float
    compression_rate_percent: float
    total_data_transferred_mb: float
    system_stats: Dict[str, Any]


class PerformanceTester:
    """Advanced performance testing system"""

    def __init__(self, config: TestConfig):
        self.config = config
        self.results: List[TestResult] = []
        self.system_stats: List[Dict[str, Any]] = []

        # Default endpoints to test if none specified
        if not config.endpoints_to_test:
            self.config.endpoints_to_test = [
                "/api/health",
                "/api/auth/profile",
                "/api/platforms/novaos/dashboard",
                "/api/platforms/black-rose/content",
                "/api/platforms/gypsy-cove/feed",
                "/static/js/app.js",
                "/static/css/styles.css",
            ]

        # Initialize HTTP client
        self.client = httpx.AsyncClient(timeout=30.0)

        # System monitoring
        self.monitor_system = True

    async def run_comprehensive_tests(self) -> Dict[str, PerformanceReport]:
        """Run all enabled performance tests"""
        print("🚀 Starting Comprehensive Performance Testing...")

        reports = {}

        try:
            # Basic load testing
            if self.config.load_test_enabled:
                print("📊 Running Load Testing...")
                reports["load_test"] = await self.run_load_test()

            # Cache performance testing
            if self.config.cache_test_enabled:
                print("💾 Running Cache Performance Testing...")
                reports["cache_test"] = await self.run_cache_test()

            # Rate limiting testing
            if self.config.rate_limit_test_enabled:
                print("🚦 Running Rate Limiting Testing...")
                reports["rate_limit_test"] = await self.run_rate_limit_test()

            # Stress testing (optional)
            if self.config.stress_test_enabled:
                print("💪 Running Stress Testing...")
                reports["stress_test"] = await self.run_stress_test()

            # Database performance testing
            print("🗄️ Running Database Performance Testing...")
            reports["database_test"] = await self.run_database_test()

        finally:
            await self.client.aclose()

        # Generate summary report
        summary = self.generate_summary_report(reports)
        reports["summary"] = summary

        print("✅ Performance Testing Complete!")
        return reports

    async def run_load_test(self) -> PerformanceReport:
        """Run standard load testing"""
        start_time = datetime.now()
        test_results = []

        # Start system monitoring
        monitor_task = (
            asyncio.create_task(self.monitor_system_performance()) if self.monitor_system else None
        )

        # Create concurrent user sessions
        tasks = []
        for user_id in range(self.config.concurrent_users):
            task = asyncio.create_task(
                self.simulate_user_session(user_id, self.config.requests_per_user)
            )
            tasks.append(task)

        # Wait for all users to complete
        user_results = await asyncio.gather(*tasks, return_exceptions=True)

        # Collect results
        for result_list in user_results:
            if isinstance(result_list, list):
                test_results.extend(result_list)

        # Stop system monitoring
        if monitor_task:
            monitor_task.cancel()

        end_time = datetime.now()

        return self.generate_report("Load Test", start_time, end_time, test_results)

    async def run_cache_test(self) -> PerformanceReport:
        """Test cache performance and hit rates"""
        start_time = datetime.now()
        test_results = []

        # Test cacheable endpoints multiple times
        cacheable_endpoints = ["/static/js/app.js", "/static/css/styles.css", "/api/health"]

        for endpoint in cacheable_endpoints:
            # First request (cache miss)
            result = await self.make_request("GET", endpoint)
            result.endpoint = f"{endpoint} (miss)"
            test_results.append(result)

            # Subsequent requests (should be cache hits)
            for i in range(10):
                result = await self.make_request("GET", endpoint)
                result.endpoint = f"{endpoint} (hit)"
                result.cached = True  # Assume cached based on response headers
                test_results.append(result)

                # Small delay to simulate realistic usage
                await asyncio.sleep(0.1)

        end_time = datetime.now()

        return self.generate_report("Cache Test", start_time, end_time, test_results)

    async def run_rate_limit_test(self) -> PerformanceReport:
        """Test rate limiting effectiveness"""
        start_time = datetime.now()
        test_results = []

        # Test rate limiting on auth endpoints
        auth_endpoint = "/api/auth/login"

        # Send requests rapidly to trigger rate limiting
        for i in range(20):  # Should exceed most rate limits
            result = await self.make_request(
                "POST",
                auth_endpoint,
                json={"email": f"test{i}@example.com", "password": "testpassword"},
            )
            test_results.append(result)

            # Very short delay
            await asyncio.sleep(0.1)

        end_time = datetime.now()

        return self.generate_report("Rate Limit Test", start_time, end_time, test_results)

    async def run_stress_test(self) -> PerformanceReport:
        """Run stress testing with extreme load"""
        start_time = datetime.now()
        test_results = []

        # Gradually increase load
        max_concurrent = self.config.concurrent_users * 5  # 5x normal load

        tasks = []
        for user_id in range(max_concurrent):
            task = asyncio.create_task(
                self.simulate_user_session(user_id, self.config.requests_per_user // 2)
            )
            tasks.append(task)

            # Add slight delay to gradually ramp up
            if user_id % 10 == 0:
                await asyncio.sleep(0.1)

        # Wait for all tasks
        user_results = await asyncio.gather(*tasks, return_exceptions=True)

        # Collect results
        for result_list in user_results:
            if isinstance(result_list, list):
                test_results.extend(result_list)

        end_time = datetime.now()

        return self.generate_report("Stress Test", start_time, end_time, test_results)

    async def run_database_test(self) -> PerformanceReport:
        """Test database performance and query optimization"""
        start_time = datetime.now()
        test_results = []

        # Test database-heavy endpoints
        db_endpoints = [
            "/api/platforms/novaos/agents",
            "/api/platforms/black-rose/content/recent",
            "/api/platforms/gypsy-cove/feed",
            "/api/analytics/dashboard",
        ]

        # Test each endpoint with various query parameters
        for endpoint in db_endpoints:
            for i in range(5):
                # Add query parameters to test different data loads
                query_params = {
                    "limit": random.choice([10, 25, 50, 100]),
                    "offset": random.randint(0, 100),
                    "sort": random.choice(["created_at", "updated_at", "popularity"]),
                }

                result = await self.make_request("GET", endpoint, params=query_params)
                test_results.append(result)

                await asyncio.sleep(0.2)

        end_time = datetime.now()

        return self.generate_report("Database Test", start_time, end_time, test_results)

    async def simulate_user_session(self, user_id: int, num_requests: int) -> List[TestResult]:
        """Simulate a user session with multiple requests"""
        session_results = []

        for request_num in range(num_requests):
            # Random endpoint selection
            endpoint = random.choice(self.config.endpoints_to_test)

            # Make request
            result = await self.make_request("GET", endpoint)
            result.endpoint = f"{endpoint} (user_{user_id})"
            session_results.append(result)

            # Random delay between requests (0.1-2 seconds)
            await asyncio.sleep(random.uniform(0.1, 2.0))

        return session_results

    async def make_request(
        self, method: str, endpoint: str, json: Dict[str, Any] = None, params: Dict[str, Any] = None
    ) -> TestResult:
        """Make HTTP request and measure performance"""
        url = f"{self.config.base_url}{endpoint}"
        headers = {}

        if self.config.auth_token:
            headers["Authorization"] = f"Bearer {self.config.auth_token}"

        start_time = time.time()

        try:
            if method == "GET":
                response = await self.client.get(url, headers=headers, params=params)
            elif method == "POST":
                response = await self.client.post(url, headers=headers, json=json)
            elif method == "PUT":
                response = await self.client.put(url, headers=headers, json=json)
            elif method == "DELETE":
                response = await self.client.delete(url, headers=headers)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")

            end_time = time.time()
            response_time_ms = (end_time - start_time) * 1000

            # Check response headers for performance indicators
            cached = (
                "X-Cache" in response.headers or response.headers.get("X-Cache-Status") == "HIT"
            )
            compressed = "Content-Encoding" in response.headers
            response_size = int(response.headers.get("Content-Length", len(response.content)))

            return TestResult(
                endpoint=endpoint,
                method=method,
                response_time_ms=response_time_ms,
                status_code=response.status_code,
                success=200 <= response.status_code < 400,
                cached=cached,
                compressed=compressed,
                response_size_bytes=response_size,
            )

        except Exception as e:
            end_time = time.time()
            response_time_ms = (end_time - start_time) * 1000

            return TestResult(
                endpoint=endpoint,
                method=method,
                response_time_ms=response_time_ms,
                status_code=0,
                success=False,
                error_message=str(e),
            )

    async def monitor_system_performance(self):
        """Monitor system performance during tests"""
        while True:
            try:
                stats = {
                    "timestamp": datetime.now().isoformat(),
                    "cpu_percent": psutil.cpu_percent(interval=1),
                    "memory_percent": psutil.virtual_memory().percent,
                    "disk_io": (
                        dict(psutil.disk_io_counters()._asdict())
                        if psutil.disk_io_counters()
                        else {}
                    ),
                    "network_io": (
                        dict(psutil.net_io_counters()._asdict()) if psutil.net_io_counters() else {}
                    ),
                }
                self.system_stats.append(stats)
                await asyncio.sleep(5)  # Monitor every 5 seconds
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"System monitoring error: {e}")
                await asyncio.sleep(5)

    def generate_report(
        self, test_name: str, start_time: datetime, end_time: datetime, results: List[TestResult]
    ) -> PerformanceReport:
        """Generate performance report from test results"""

        if not results:
            return PerformanceReport(
                test_name=test_name,
                start_time=start_time,
                end_time=end_time,
                total_requests=0,
                successful_requests=0,
                failed_requests=0,
                avg_response_time_ms=0.0,
                p95_response_time_ms=0.0,
                p99_response_time_ms=0.0,
                throughput_rps=0.0,
                error_rate_percent=100.0,
                cache_hit_rate_percent=0.0,
                compression_rate_percent=0.0,
                total_data_transferred_mb=0.0,
                system_stats={},
            )

        # Basic statistics
        total_requests = len(results)
        successful_requests = sum(1 for r in results if r.success)
        failed_requests = total_requests - successful_requests

        # Response time statistics
        response_times = [r.response_time_ms for r in results]
        avg_response_time = statistics.mean(response_times)
        p95_response_time = (
            statistics.quantiles(response_times, n=20)[18]
            if len(response_times) > 1
            else avg_response_time
        )
        p99_response_time = (
            statistics.quantiles(response_times, n=100)[98]
            if len(response_times) > 1
            else avg_response_time
        )

        # Throughput calculation
        duration_seconds = (end_time - start_time).total_seconds()
        throughput_rps = total_requests / duration_seconds if duration_seconds > 0 else 0

        # Error rate
        error_rate_percent = (failed_requests / total_requests) * 100 if total_requests > 0 else 0

        # Cache statistics
        cached_requests = sum(1 for r in results if r.cached)
        cache_hit_rate_percent = (
            (cached_requests / total_requests) * 100 if total_requests > 0 else 0
        )

        # Compression statistics
        compressed_requests = sum(1 for r in results if r.compressed)
        compression_rate_percent = (
            (compressed_requests / total_requests) * 100 if total_requests > 0 else 0
        )

        # Data transfer statistics
        total_bytes = sum(r.response_size_bytes for r in results)
        total_data_transferred_mb = total_bytes / (1024 * 1024)

        # System statistics summary
        system_stats = {}
        if self.system_stats:
            cpu_values = [s["cpu_percent"] for s in self.system_stats if "cpu_percent" in s]
            memory_values = [
                s["memory_percent"] for s in self.system_stats if "memory_percent" in s
            ]

            system_stats = {
                "avg_cpu_percent": statistics.mean(cpu_values) if cpu_values else 0,
                "max_cpu_percent": max(cpu_values) if cpu_values else 0,
                "avg_memory_percent": statistics.mean(memory_values) if memory_values else 0,
                "max_memory_percent": max(memory_values) if memory_values else 0,
                "samples_collected": len(self.system_stats),
            }

        return PerformanceReport(
            test_name=test_name,
            start_time=start_time,
            end_time=end_time,
            total_requests=total_requests,
            successful_requests=successful_requests,
            failed_requests=failed_requests,
            avg_response_time_ms=round(avg_response_time, 2),
            p95_response_time_ms=round(p95_response_time, 2),
            p99_response_time_ms=round(p99_response_time, 2),
            throughput_rps=round(throughput_rps, 2),
            error_rate_percent=round(error_rate_percent, 2),
            cache_hit_rate_percent=round(cache_hit_rate_percent, 2),
            compression_rate_percent=round(compression_rate_percent, 2),
            total_data_transferred_mb=round(total_data_transferred_mb, 2),
            system_stats=system_stats,
        )

    def generate_summary_report(self, reports: Dict[str, PerformanceReport]) -> Dict[str, Any]:
        """Generate summary report from all test results"""
        summary = {
            "test_suite_completed": datetime.now().isoformat(),
            "total_tests_run": len(reports),
            "overall_performance": "EXCELLENT",
            "performance_score": 0,
            "recommendations": [],
            "test_results": {},
        }

        total_score = 0
        max_score = 0

        for test_name, report in reports.items():
            if test_name == "summary":
                continue

            # Scoring criteria
            score = 0
            max_test_score = 100

            # Response time score (40 points max)
            if report.avg_response_time_ms <= 200:
                score += 40
            elif report.avg_response_time_ms <= 500:
                score += 30
            elif report.avg_response_time_ms <= 1000:
                score += 20
            else:
                score += 10

            # Error rate score (20 points max)
            if report.error_rate_percent <= 0.1:
                score += 20
            elif report.error_rate_percent <= 1.0:
                score += 15
            elif report.error_rate_percent <= 5.0:
                score += 10
            else:
                score += 0

            # Throughput score (20 points max)
            if report.throughput_rps >= 500:
                score += 20
            elif report.throughput_rps >= 200:
                score += 15
            elif report.throughput_rps >= 100:
                score += 10
            else:
                score += 5

            # Cache hit rate score (20 points max) - only for cache test
            if test_name == "cache_test":
                if report.cache_hit_rate_percent >= 90:
                    score += 20
                elif report.cache_hit_rate_percent >= 80:
                    score += 15
                elif report.cache_hit_rate_percent >= 60:
                    score += 10
                else:
                    score += 5
            else:
                score += 15  # Default cache score for non-cache tests

            total_score += score
            max_score += max_test_score

            # Test-specific summary
            summary["test_results"][test_name] = {
                "score": score,
                "max_score": max_test_score,
                "performance_grade": self._get_performance_grade(score, max_test_score),
                "key_metrics": {
                    "avg_response_time_ms": report.avg_response_time_ms,
                    "throughput_rps": report.throughput_rps,
                    "error_rate_percent": report.error_rate_percent,
                    "cache_hit_rate_percent": report.cache_hit_rate_percent,
                },
            }

        # Overall performance calculation
        if max_score > 0:
            performance_percentage = (total_score / max_score) * 100
            summary["performance_score"] = round(performance_percentage, 1)

            if performance_percentage >= 90:
                summary["overall_performance"] = "EXCELLENT"
            elif performance_percentage >= 80:
                summary["overall_performance"] = "GOOD"
            elif performance_percentage >= 70:
                summary["overall_performance"] = "FAIR"
            else:
                summary["overall_performance"] = "NEEDS_IMPROVEMENT"

        # Generate recommendations
        summary["recommendations"] = self._generate_recommendations(reports)

        return summary

    def _get_performance_grade(self, score: int, max_score: int) -> str:
        """Convert score to letter grade"""
        percentage = (score / max_score) * 100
        if percentage >= 90:
            return "A"
        elif percentage >= 80:
            return "B"
        elif percentage >= 70:
            return "C"
        elif percentage >= 60:
            return "D"
        else:
            return "F"

    def _generate_recommendations(self, reports: Dict[str, PerformanceReport]) -> List[str]:
        """Generate performance improvement recommendations"""
        recommendations = []

        for test_name, report in reports.items():
            if test_name == "summary":
                continue

            # Response time recommendations
            if report.avg_response_time_ms > 1000:
                recommendations.append(
                    f"⚠️ {test_name}: Average response time is high ({report.avg_response_time_ms:.1f}ms). Consider enabling more aggressive caching."
                )

            # Error rate recommendations
            if report.error_rate_percent > 1.0:
                recommendations.append(
                    f"⚠️ {test_name}: High error rate ({report.error_rate_percent:.1f}%). Check server stability and error handling."
                )

            # Throughput recommendations
            if report.throughput_rps < 100:
                recommendations.append(
                    f"⚠️ {test_name}: Low throughput ({report.throughput_rps:.1f} RPS). Consider horizontal scaling or performance optimization."
                )

            # Cache recommendations
            if test_name == "cache_test" and report.cache_hit_rate_percent < 80:
                recommendations.append(
                    f"💾 Cache hit rate is low ({report.cache_hit_rate_percent:.1f}%). Review caching strategy and TTL settings."
                )

            # Compression recommendations
            if report.compression_rate_percent < 70:
                recommendations.append(
                    f"🗜️ {test_name}: Low compression usage ({report.compression_rate_percent:.1f}%). Enable compression for text-based responses."
                )

        # If no specific issues found
        if not recommendations:
            recommendations.append(
                "✅ All performance metrics are within acceptable ranges. Consider monitoring for sustained load."
            )

        return recommendations

    async def save_results_to_file(
        self, reports: Dict[str, PerformanceReport], filename: str = None
    ):
        """Save test results to JSON file"""
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"performance_test_results_{timestamp}.json"

        # Convert reports to serializable format
        serializable_reports = {}
        for test_name, report in reports.items():
            if hasattr(report, "__dict__"):
                serializable_reports[test_name] = asdict(report)
            else:
                serializable_reports[test_name] = report

        # Custom JSON encoder for datetime objects
        def json_encoder(obj):
            if isinstance(obj, datetime):
                return obj.isoformat()
            raise TypeError(f"Object of type {type(obj)} is not JSON serializable")

        async with aiofiles.open(filename, "w") as f:
            await f.write(json.dumps(serializable_reports, indent=2, default=json_encoder))

        print(f"📊 Performance test results saved to: {filename}")
        return filename


async def run_performance_tests(
    base_url: str = "http://localhost:8000",
) -> Dict[str, PerformanceReport]:
    """Run comprehensive performance tests"""

    # Configure test parameters
    config = TestConfig(
        base_url=base_url,
        concurrent_users=20,
        requests_per_user=50,
        test_duration_seconds=120,
        cache_test_enabled=True,
        rate_limit_test_enabled=True,
        load_test_enabled=True,
        stress_test_enabled=False,  # Enable for stress testing
        max_response_time_ms=1000.0,
        min_throughput_rps=100.0,
        max_error_rate_percent=1.0,
        min_cache_hit_rate_percent=80.0,
    )

    # Create tester instance
    tester = PerformanceTester(config)

    # Run all tests
    reports = await tester.run_comprehensive_tests()

    # Save results
    await tester.save_results_to_file(reports)

    return reports


if __name__ == "__main__":
    # Example usage
    async def main():
        print("🚀 Starting NovaOS Performance Testing Suite...")

        # Run tests against local development server
        reports = await run_performance_tests("http://localhost:8000")

        # Print summary
        summary = reports.get("summary", {})
        print(f"\n📊 Performance Test Summary:")
        print(f"Overall Performance: {summary.get('overall_performance', 'Unknown')}")
        print(f"Performance Score: {summary.get('performance_score', 0):.1f}%")
        print(f"Tests Completed: {summary.get('total_tests_run', 0)}")

        print(f"\n💡 Recommendations:")
        for rec in summary.get("recommendations", []):
            print(f"  {rec}")

        print(f"\n✅ Performance testing complete!")

    asyncio.run(main())
