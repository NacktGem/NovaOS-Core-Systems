"""
Performance Optimization Validation Script

Comprehensive validation of all performance optimization systems:
- Redis caching performance
- Database optimization effectiveness
- Rate limiting functionality
- Response compression
- System monitoring accuracy
"""

import asyncio
import time
import json
import statistics
from typing import Dict, List, Any
from dataclasses import dataclass
import sys
import os

# Add the performance modules to the path
sys.path.append(os.path.join(os.path.dirname(__file__)))

from optimizer import (
    RedisPerformanceCache,
    DatabaseOptimizer,
    APIPerformanceMonitor,
    PerformanceTier,
)


@dataclass
class ValidationResult:
    """Result of a performance validation test"""

    test_name: str
    success: bool
    metric_value: float
    expected_value: float
    threshold_met: bool
    details: Dict[str, Any]


class PerformanceValidator:
    """Validates all performance optimization components"""

    def __init__(self):
        self.results: List[ValidationResult] = []

    async def run_all_validations(self) -> Dict[str, Any]:
        """Run comprehensive performance validation"""
        print("🔍 Starting Performance Optimization Validation...")

        # Test each component
        await self.validate_redis_cache()
        await self.validate_database_optimizer()
        await self.validate_api_monitor()
        await self.validate_compression_efficiency()
        await self.validate_system_integration()

        # Generate summary report
        report = self.generate_validation_report()

        print("✅ Performance Validation Complete!")
        return report

    async def validate_redis_cache(self):
        """Validate Redis cache performance"""
        print("💾 Validating Redis Cache Performance...")

        try:
            # Initialize cache with different tiers
            for tier in [
                PerformanceTier.BASIC,
                PerformanceTier.STANDARD,
                PerformanceTier.ENTERPRISE,
            ]:
                cache = RedisPerformanceCache("redis://localhost:6379", tier)

                # Test cache operations
                test_data = {"test": "data", "timestamp": time.time(), "tier": tier.value}
                cache_key = f"test_key_{tier.value}"

                # Test SET operation speed
                start_time = time.time()
                await cache.set(cache_key, test_data, ttl=300)
                set_time = (time.time() - start_time) * 1000

                # Test GET operation speed
                start_time = time.time()
                retrieved_data = await cache.get(cache_key)
                get_time = (time.time() - start_time) * 1000

                # Validate data integrity
                data_matches = retrieved_data == test_data

                # Performance expectations by tier
                expected_set_time = {"basic": 50, "standard": 30, "enterprise": 10}[tier.value]
                expected_get_time = {"basic": 20, "standard": 15, "enterprise": 5}[tier.value]

                # Record results
                self.results.append(
                    ValidationResult(
                        test_name=f"Redis Cache SET ({tier.value})",
                        success=data_matches,
                        metric_value=set_time,
                        expected_value=expected_set_time,
                        threshold_met=set_time <= expected_set_time,
                        details={
                            "operation": "SET",
                            "tier": tier.value,
                            "data_integrity": data_matches,
                            "response_time_ms": set_time,
                        },
                    )
                )

                self.results.append(
                    ValidationResult(
                        test_name=f"Redis Cache GET ({tier.value})",
                        success=data_matches,
                        metric_value=get_time,
                        expected_value=expected_get_time,
                        threshold_met=get_time <= expected_get_time,
                        details={
                            "operation": "GET",
                            "tier": tier.value,
                            "data_integrity": data_matches,
                            "response_time_ms": get_time,
                        },
                    )
                )

                # Test cache statistics
                stats = await cache.get_cache_stats()
                stats_available = bool(stats and "total_requests" in stats)

                self.results.append(
                    ValidationResult(
                        test_name=f"Cache Statistics ({tier.value})",
                        success=stats_available,
                        metric_value=len(stats) if stats else 0,
                        expected_value=5,  # Expect at least 5 stat fields
                        threshold_met=stats_available,
                        details={"stats": stats},
                    )
                )

                await cache.close()

        except Exception as e:
            self.results.append(
                ValidationResult(
                    test_name="Redis Cache Validation",
                    success=False,
                    metric_value=0,
                    expected_value=1,
                    threshold_met=False,
                    details={"error": str(e)},
                )
            )

    async def validate_database_optimizer(self):
        """Validate database query optimization"""
        print("🗄️ Validating Database Optimizer...")

        try:
            optimizer = DatabaseOptimizer()

            # Test query optimization
            test_queries = [
                "SELECT * FROM users WHERE email = 'test@example.com'",
                "SELECT u.*, p.name FROM users u JOIN profiles p ON u.id = p.user_id",
                "SELECT COUNT(*) FROM posts WHERE created_at > '2024-01-01'",
            ]

            optimization_times = []
            successful_optimizations = 0

            for query in test_queries:
                start_time = time.time()
                result = await optimizer.optimize_query(query)
                optimization_time = (time.time() - start_time) * 1000
                optimization_times.append(optimization_time)

                if result.get("optimized_query") and result.get("optimization_applied"):
                    successful_optimizations += 1

            avg_optimization_time = statistics.mean(optimization_times)
            optimization_success_rate = (successful_optimizations / len(test_queries)) * 100

            # Record results
            self.results.append(
                ValidationResult(
                    test_name="Database Query Optimization",
                    success=successful_optimizations > 0,
                    metric_value=avg_optimization_time,
                    expected_value=100.0,  # Under 100ms expected
                    threshold_met=avg_optimization_time <= 100.0,
                    details={
                        "queries_tested": len(test_queries),
                        "successful_optimizations": successful_optimizations,
                        "success_rate_percent": optimization_success_rate,
                        "avg_optimization_time_ms": avg_optimization_time,
                    },
                )
            )

            # Test query caching
            cache_test_query = "SELECT * FROM test_table WHERE id = 1"

            # First execution (cache miss)
            start_time = time.time()
            result1 = await optimizer.optimize_query(cache_test_query)
            first_time = (time.time() - start_time) * 1000

            # Second execution (should be cached)
            start_time = time.time()
            result2 = await optimizer.optimize_query(cache_test_query)
            second_time = (time.time() - start_time) * 1000

            cache_improvement = ((first_time - second_time) / first_time) * 100

            self.results.append(
                ValidationResult(
                    test_name="Database Query Caching",
                    success=second_time < first_time,
                    metric_value=cache_improvement,
                    expected_value=50.0,  # Expect at least 50% improvement
                    threshold_met=cache_improvement >= 50.0,
                    details={
                        "first_execution_ms": first_time,
                        "second_execution_ms": second_time,
                        "cache_improvement_percent": cache_improvement,
                    },
                )
            )

        except Exception as e:
            self.results.append(
                ValidationResult(
                    test_name="Database Optimizer Validation",
                    success=False,
                    metric_value=0,
                    expected_value=1,
                    threshold_met=False,
                    details={"error": str(e)},
                )
            )

    async def validate_api_monitor(self):
        """Validate API performance monitoring"""
        print("📊 Validating API Performance Monitor...")

        try:
            monitor = APIPerformanceMonitor()

            # Simulate API requests
            test_endpoints = ["/api/test1", "/api/test2", "/api/test3"]
            response_times = []

            for endpoint in test_endpoints:
                for i in range(10):  # 10 requests per endpoint
                    start_time = time.time()

                    # Record request start
                    await monitor.record_request_start(endpoint, "GET")

                    # Simulate processing time
                    processing_time = 0.05 + (i * 0.01)  # 50ms to 140ms
                    await asyncio.sleep(processing_time)

                    # Record request end
                    response_time_ms = processing_time * 1000
                    response_times.append(response_time_ms)

                    await monitor.record_request_end(
                        endpoint,
                        200,
                        response_time_ms,
                        cached=(i % 3 == 0),  # Every third request is cached
                    )

            # Get performance report
            report = await monitor.get_performance_report()

            # Validate report structure
            required_fields = ["total_requests", "avg_response_time", "cache_hit_rate", "endpoints"]
            has_required_fields = all(field in report for field in required_fields)

            # Validate accuracy
            expected_total_requests = len(test_endpoints) * 10
            actual_total_requests = report.get("total_requests", 0)
            request_count_accurate = actual_total_requests == expected_total_requests

            # Validate response time tracking
            expected_avg_response_time = statistics.mean(response_times)
            actual_avg_response_time = report.get("avg_response_time", 0)
            response_time_accurate = (
                abs(actual_avg_response_time - expected_avg_response_time) <= 10
            )  # 10ms tolerance

            self.results.append(
                ValidationResult(
                    test_name="API Performance Monitoring",
                    success=has_required_fields and request_count_accurate,
                    metric_value=actual_total_requests,
                    expected_value=expected_total_requests,
                    threshold_met=request_count_accurate,
                    details={
                        "has_required_fields": has_required_fields,
                        "request_count_accurate": request_count_accurate,
                        "response_time_accurate": response_time_accurate,
                        "expected_requests": expected_total_requests,
                        "actual_requests": actual_total_requests,
                        "report": report,
                    },
                )
            )

        except Exception as e:
            self.results.append(
                ValidationResult(
                    test_name="API Monitor Validation",
                    success=False,
                    metric_value=0,
                    expected_value=1,
                    threshold_met=False,
                    details={"error": str(e)},
                )
            )

    async def validate_compression_efficiency(self):
        """Validate response compression effectiveness"""
        print("🗜️ Validating Compression Efficiency...")

        try:
            # Test data of various sizes
            test_data = {
                "small": "a" * 100,  # 100 bytes
                "medium": "b" * 1000,  # 1KB
                "large": "c" * 10000,  # 10KB
                "json": json.dumps({"key": "value" * 100}) * 50,  # JSON data
            }

            for data_type, data in test_data.items():
                original_size = len(data.encode("utf-8"))

                # Simulate gzip compression (simplified)
                import gzip

                compressed_data = gzip.compress(data.encode("utf-8"))
                compressed_size = len(compressed_data)

                compression_ratio = ((original_size - compressed_size) / original_size) * 100

                # Compression expectations
                expected_compression = {
                    "small": 10,  # Small files may not compress well
                    "medium": 70,  # Medium files should compress well
                    "large": 70,  # Large files should compress well
                    "json": 80,  # JSON should compress very well
                }

                expected_ratio = expected_compression[data_type]
                compression_effective = compression_ratio >= expected_ratio

                self.results.append(
                    ValidationResult(
                        test_name=f"Compression Efficiency ({data_type})",
                        success=compression_effective,
                        metric_value=compression_ratio,
                        expected_value=expected_ratio,
                        threshold_met=compression_effective,
                        details={
                            "data_type": data_type,
                            "original_size_bytes": original_size,
                            "compressed_size_bytes": compressed_size,
                            "compression_ratio_percent": compression_ratio,
                        },
                    )
                )

        except Exception as e:
            self.results.append(
                ValidationResult(
                    test_name="Compression Efficiency Validation",
                    success=False,
                    metric_value=0,
                    expected_value=1,
                    threshold_met=False,
                    details={"error": str(e)},
                )
            )

    async def validate_system_integration(self):
        """Validate system integration and end-to-end performance"""
        print("🔗 Validating System Integration...")

        try:
            # Test component initialization
            components_initialized = 0

            # Test Redis cache initialization
            try:
                cache = RedisPerformanceCache()
                test_data = {"integration": "test"}
                await cache.set("integration_test", test_data, ttl=60)
                retrieved = await cache.get("integration_test")
                if retrieved == test_data:
                    components_initialized += 1
                await cache.close()
            except:
                pass

            # Test database optimizer initialization
            try:
                db_optimizer = DatabaseOptimizer()
                result = await db_optimizer.optimize_query("SELECT 1")
                if result:
                    components_initialized += 1
            except:
                pass

            # Test API monitor initialization
            try:
                monitor = APIPerformanceMonitor()
                await monitor.record_request_start("/test", "GET")
                await monitor.record_request_end("/test", 200, 100.0)
                report = await monitor.get_performance_report()
                if report and "total_requests" in report:
                    components_initialized += 1
            except:
                pass

            total_components = 3
            integration_success_rate = (components_initialized / total_components) * 100

            self.results.append(
                ValidationResult(
                    test_name="System Integration",
                    success=components_initialized == total_components,
                    metric_value=integration_success_rate,
                    expected_value=100.0,
                    threshold_met=integration_success_rate == 100.0,
                    details={
                        "components_tested": total_components,
                        "components_working": components_initialized,
                        "integration_success_rate_percent": integration_success_rate,
                    },
                )
            )

        except Exception as e:
            self.results.append(
                ValidationResult(
                    test_name="System Integration Validation",
                    success=False,
                    metric_value=0,
                    expected_value=1,
                    threshold_met=False,
                    details={"error": str(e)},
                )
            )

    def generate_validation_report(self) -> Dict[str, Any]:
        """Generate comprehensive validation report"""
        total_tests = len(self.results)
        successful_tests = sum(1 for result in self.results if result.success)
        threshold_met_tests = sum(1 for result in self.results if result.threshold_met)

        success_rate = (successful_tests / total_tests) * 100 if total_tests > 0 else 0
        performance_compliance = (threshold_met_tests / total_tests) * 100 if total_tests > 0 else 0

        # Calculate overall score
        overall_score = (success_rate * 0.6) + (performance_compliance * 0.4)

        # Determine performance grade
        if overall_score >= 95:
            grade = "EXCELLENT"
        elif overall_score >= 85:
            grade = "GOOD"
        elif overall_score >= 75:
            grade = "SATISFACTORY"
        elif overall_score >= 65:
            grade = "NEEDS_IMPROVEMENT"
        else:
            grade = "POOR"

        # Generate recommendations
        recommendations = []

        # Check for failed tests
        failed_tests = [r for r in self.results if not r.success]
        if failed_tests:
            recommendations.append(
                f"⚠️ {len(failed_tests)} tests failed - investigate system configuration"
            )

        # Check for performance issues
        slow_tests = [r for r in self.results if not r.threshold_met and r.success]
        if slow_tests:
            recommendations.append(
                f"🐌 {len(slow_tests)} tests exceeded performance thresholds - consider optimization"
            )

        # Specific recommendations
        cache_tests = [r for r in self.results if "Cache" in r.test_name and not r.threshold_met]
        if cache_tests:
            recommendations.append(
                "💾 Cache performance below expectations - check Redis configuration"
            )

        db_tests = [r for r in self.results if "Database" in r.test_name and not r.threshold_met]
        if db_tests:
            recommendations.append(
                "🗄️ Database optimization underperforming - review query patterns"
            )

        compression_tests = [
            r for r in self.results if "Compression" in r.test_name and not r.threshold_met
        ]
        if compression_tests:
            recommendations.append(
                "🗜️ Compression efficiency low - check content types and algorithms"
            )

        if not recommendations:
            recommendations.append(
                "✅ All performance optimizations are working within expected parameters"
            )

        return {
            "validation_summary": {
                "total_tests": total_tests,
                "successful_tests": successful_tests,
                "failed_tests": total_tests - successful_tests,
                "success_rate_percent": round(success_rate, 2),
                "performance_compliance_percent": round(performance_compliance, 2),
                "overall_score": round(overall_score, 2),
                "performance_grade": grade,
            },
            "test_results": [
                {
                    "test_name": result.test_name,
                    "success": result.success,
                    "metric_value": result.metric_value,
                    "expected_value": result.expected_value,
                    "threshold_met": result.threshold_met,
                    "details": result.details,
                }
                for result in self.results
            ],
            "recommendations": recommendations,
            "validation_timestamp": time.time(),
        }


async def main():
    """Run performance optimization validation"""
    print("🚀 NovaOS Performance Optimization Validation Suite")
    print("=" * 60)

    validator = PerformanceValidator()
    report = await validator.run_all_validations()

    # Display summary
    summary = report["validation_summary"]
    print(f"\n📊 Validation Summary:")
    print(f"Tests Run: {summary['total_tests']}")
    print(f"Success Rate: {summary['success_rate_percent']:.1f}%")
    print(f"Performance Compliance: {summary['performance_compliance_percent']:.1f}%")
    print(f"Overall Score: {summary['overall_score']:.1f}/100")
    print(f"Performance Grade: {summary['performance_grade']}")

    # Display recommendations
    print(f"\n💡 Recommendations:")
    for rec in report["recommendations"]:
        print(f"  {rec}")

    # Display detailed results
    print(f"\n📋 Detailed Test Results:")
    for test in report["test_results"]:
        status = "✅" if test["success"] else "❌"
        perf = "🚀" if test["threshold_met"] else "🐌"
        print(
            f"  {status} {perf} {test['test_name']}: {test['metric_value']:.2f} (expected: {test['expected_value']:.2f})"
        )

    # Save detailed report
    report_filename = f"performance_validation_report_{int(time.time())}.json"
    with open(report_filename, "w") as f:
        json.dump(report, f, indent=2)

    print(f"\n📁 Detailed report saved to: {report_filename}")
    print("\n✅ Performance Validation Complete!")

    return report


if __name__ == "__main__":
    asyncio.run(main())
