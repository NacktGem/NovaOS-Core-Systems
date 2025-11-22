#!/usr/bin/env python3
"""
RBAC System Testing & Validation

Comprehensive testing suite for Role-Based Access Control across all NovaOS platforms:
- NovaOS Console: Agent management and system monitoring
- Black Rose Collective: Adult content and creator tools
- GypsyCove: Social media and community features

This script validates permissions for all user roles and platforms.
"""

import json
import asyncio
import aiohttp
import uuid
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from enum import Enum


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


@dataclass
class TestUser:
    id: str
    email: str
    role: Role
    platform: Platform
    age_verified: bool = False
    subscription_active: bool = False
    premium_access: bool = False

    def __post_init__(self):
        if self.id is None:
            self.id = str(uuid.uuid4())


@dataclass
class PermissionTest:
    name: str
    endpoint: str
    method: str
    platform: Platform
    required_roles: List[Role]
    required_permissions: List[str]
    age_verification_required: bool = False
    subscription_required: bool = False
    premium_required: bool = False
    payload: Optional[Dict] = None
    expected_status: int = 200


class RBACTester:
    """Comprehensive RBAC testing system"""

    def __init__(self, base_url: str = "http://localhost:9760"):
        self.base_url = base_url
        self.session: Optional[aiohttp.ClientSession] = None
        self.test_results: Dict[str, List[Dict]] = {}

    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    def create_test_users(self) -> List[TestUser]:
        """Create comprehensive test user matrix"""
        users = []

        # NovaOS Console Users
        users.extend(
            [
                TestUser("nova-guest", "guest@novaos.local", Role.GUEST, Platform.NOVAOS),
                TestUser("nova-user", "user@novaos.local", Role.USER, Platform.NOVAOS),
                TestUser("nova-admin", "admin@novaos.local", Role.ADMIN, Platform.NOVAOS),
                TestUser(
                    "nova-superadmin", "superadmin@novaos.local", Role.SUPER_ADMIN, Platform.NOVAOS
                ),
                TestUser("nova-godmode", "godmode@novaos.local", Role.GODMODE, Platform.NOVAOS),
            ]
        )

        # Black Rose Collective Users
        users.extend(
            [
                TestUser("br-guest", "guest@blackrose.local", Role.GUEST, Platform.BLACK_ROSE),
                TestUser(
                    "br-user",
                    "user@blackrose.local",
                    Role.USER,
                    Platform.BLACK_ROSE,
                    age_verified=True,
                ),
                TestUser(
                    "br-creator",
                    "creator@blackrose.local",
                    Role.CREATOR,
                    Platform.BLACK_ROSE,
                    age_verified=True,
                ),
                TestUser(
                    "br-subscriber",
                    "subscriber@blackrose.local",
                    Role.SUBSCRIBER,
                    Platform.BLACK_ROSE,
                    age_verified=True,
                    subscription_active=True,
                ),
                TestUser(
                    "br-premium",
                    "premium@blackrose.local",
                    Role.SUBSCRIBER,
                    Platform.BLACK_ROSE,
                    age_verified=True,
                    subscription_active=True,
                    premium_access=True,
                ),
                TestUser(
                    "br-moderator",
                    "moderator@blackrose.local",
                    Role.MODERATOR,
                    Platform.BLACK_ROSE,
                    age_verified=True,
                ),
                TestUser(
                    "br-admin",
                    "admin@blackrose.local",
                    Role.ADMIN,
                    Platform.BLACK_ROSE,
                    age_verified=True,
                ),
            ]
        )

        # GypsyCove Users
        users.extend(
            [
                TestUser("gc-guest", "guest@gypsycove.local", Role.GUEST, Platform.GYPSY_COVE),
                TestUser("gc-user", "user@gypsycove.local", Role.USER, Platform.GYPSY_COVE),
                TestUser(
                    "gc-creator", "creator@gypsycove.local", Role.CREATOR, Platform.GYPSY_COVE
                ),
                TestUser(
                    "gc-moderator", "moderator@gypsycove.local", Role.MODERATOR, Platform.GYPSY_COVE
                ),
                TestUser("gc-admin", "admin@gypsycove.local", Role.ADMIN, Platform.GYPSY_COVE),
            ]
        )

        return users

    def define_permission_tests(self) -> List[PermissionTest]:
        """Define comprehensive permission test scenarios"""
        tests = []

        # =====================================================
        # NovaOS Console Tests
        # =====================================================

        # Agent Management
        tests.extend(
            [
                PermissionTest(
                    "View Agents",
                    "/api/agents",
                    "GET",
                    Platform.NOVAOS,
                    [Role.USER, Role.ADMIN, Role.SUPER_ADMIN, Role.GODMODE],
                    ["agent.view"],
                ),
                PermissionTest(
                    "Create Agent",
                    "/api/agents",
                    "POST",
                    Platform.NOVAOS,
                    [Role.ADMIN, Role.SUPER_ADMIN, Role.GODMODE],
                    ["agent.create"],
                    payload={"name": "test-agent", "type": "assistant"},
                ),
                PermissionTest(
                    "Delete Agent",
                    "/api/agents/test-agent",
                    "DELETE",
                    Platform.NOVAOS,
                    [Role.SUPER_ADMIN, Role.GODMODE],
                    ["agent.delete"],
                ),
            ]
        )

        # System Monitoring
        tests.extend(
            [
                PermissionTest(
                    "System Status",
                    "/api/system/status",
                    "GET",
                    Platform.NOVAOS,
                    [Role.USER, Role.ADMIN, Role.SUPER_ADMIN, Role.GODMODE],
                    ["system.monitor"],
                ),
                PermissionTest(
                    "System Metrics",
                    "/api/system/metrics",
                    "GET",
                    Platform.NOVAOS,
                    [Role.ADMIN, Role.SUPER_ADMIN, Role.GODMODE],
                    ["system.metrics"],
                ),
                PermissionTest(
                    "System Restart",
                    "/api/system/restart",
                    "POST",
                    Platform.NOVAOS,
                    [Role.GODMODE],
                    ["system.control"],
                ),
            ]
        )

        # =====================================================
        # Black Rose Collective Tests
        # =====================================================

        # Age-Gated Content Access
        tests.extend(
            [
                PermissionTest(
                    "View Adult Content",
                    "/api/blackrose/content",
                    "GET",
                    Platform.BLACK_ROSE,
                    [Role.USER, Role.CREATOR, Role.SUBSCRIBER, Role.MODERATOR, Role.ADMIN],
                    ["content.view"],
                    age_verification_required=True,
                ),
                PermissionTest(
                    "View Premium Content",
                    "/api/blackrose/content/premium",
                    "GET",
                    Platform.BLACK_ROSE,
                    [Role.SUBSCRIBER],
                    ["content.premium"],
                    age_verification_required=True,
                    subscription_required=True,
                ),
                PermissionTest(
                    "View Exclusive Content",
                    "/api/blackrose/content/exclusive",
                    "GET",
                    Platform.BLACK_ROSE,
                    [Role.SUBSCRIBER],
                    ["content.exclusive"],
                    age_verification_required=True,
                    premium_required=True,
                ),
            ]
        )

        # Creator Tools
        tests.extend(
            [
                PermissionTest(
                    "Upload Content",
                    "/api/blackrose/content",
                    "POST",
                    Platform.BLACK_ROSE,
                    [Role.CREATOR],
                    ["content.create"],
                    age_verification_required=True,
                    payload={"title": "Test Content", "type": "image", "nsfw": True},
                ),
                PermissionTest(
                    "Manage Subscribers",
                    "/api/blackrose/creator/subscribers",
                    "GET",
                    Platform.BLACK_ROSE,
                    [Role.CREATOR],
                    ["creator.manage_subscribers"],
                    age_verification_required=True,
                ),
                PermissionTest(
                    "View Earnings",
                    "/api/blackrose/creator/earnings",
                    "GET",
                    Platform.BLACK_ROSE,
                    [Role.CREATOR],
                    ["creator.view_earnings"],
                    age_verification_required=True,
                ),
                PermissionTest(
                    "Process Payout",
                    "/api/blackrose/creator/payout",
                    "POST",
                    Platform.BLACK_ROSE,
                    [Role.CREATOR],
                    ["creator.request_payout"],
                    age_verification_required=True,
                    payload={"amount": 100},
                ),
            ]
        )

        # Subscription Management
        tests.extend(
            [
                PermissionTest(
                    "Subscribe to Creator",
                    "/api/blackrose/subscribe",
                    "POST",
                    Platform.BLACK_ROSE,
                    [Role.USER, Role.SUBSCRIBER],
                    ["subscription.create"],
                    age_verification_required=True,
                    payload={"creator_id": "test-creator", "tier": "premium"},
                ),
                PermissionTest(
                    "Cancel Subscription",
                    "/api/blackrose/subscription/cancel",
                    "POST",
                    Platform.BLACK_ROSE,
                    [Role.SUBSCRIBER],
                    ["subscription.cancel"],
                    age_verification_required=True,
                    subscription_required=True,
                ),
            ]
        )

        # Moderation Tools
        tests.extend(
            [
                PermissionTest(
                    "Review Reported Content",
                    "/api/blackrose/moderation/reports",
                    "GET",
                    Platform.BLACK_ROSE,
                    [Role.MODERATOR, Role.ADMIN],
                    ["moderation.view_reports"],
                    age_verification_required=True,
                ),
                PermissionTest(
                    "Take Moderation Action",
                    "/api/blackrose/moderation/action",
                    "POST",
                    Platform.BLACK_ROSE,
                    [Role.MODERATOR, Role.ADMIN],
                    ["moderation.take_action"],
                    age_verification_required=True,
                    payload={"content_id": "test-content", "action": "remove"},
                ),
                PermissionTest(
                    "Ban User",
                    "/api/blackrose/moderation/ban",
                    "POST",
                    Platform.BLACK_ROSE,
                    [Role.ADMIN],
                    ["moderation.ban_user"],
                    age_verification_required=True,
                    payload={"user_id": "test-user", "reason": "TOS violation"},
                ),
            ]
        )

        # =====================================================
        # GypsyCove Tests
        # =====================================================

        # Social Media Features
        tests.extend(
            [
                PermissionTest(
                    "View Posts",
                    "/api/gypsycove/posts",
                    "GET",
                    Platform.GYPSY_COVE,
                    [Role.GUEST, Role.USER, Role.CREATOR, Role.MODERATOR, Role.ADMIN],
                    ["posts.view"],
                ),
                PermissionTest(
                    "Create Post",
                    "/api/gypsycove/posts",
                    "POST",
                    Platform.GYPSY_COVE,
                    [Role.USER, Role.CREATOR],
                    ["posts.create"],
                    payload={"content": "Test post", "visibility": "public"},
                ),
                PermissionTest(
                    "Delete Own Post",
                    "/api/gypsycove/posts/own-post",
                    "DELETE",
                    Platform.GYPSY_COVE,
                    [Role.USER, Role.CREATOR],
                    ["posts.delete_own"],
                ),
                PermissionTest(
                    "Delete Any Post",
                    "/api/gypsycove/posts/any-post",
                    "DELETE",
                    Platform.GYPSY_COVE,
                    [Role.MODERATOR, Role.ADMIN],
                    ["posts.delete_any"],
                ),
            ]
        )

        # Community Features
        tests.extend(
            [
                PermissionTest(
                    "Join Community",
                    "/api/gypsycove/communities/join",
                    "POST",
                    Platform.GYPSY_COVE,
                    [Role.USER, Role.CREATOR],
                    ["community.join"],
                    payload={"community_id": "test-community"},
                ),
                PermissionTest(
                    "Create Community",
                    "/api/gypsycove/communities",
                    "POST",
                    Platform.GYPSY_COVE,
                    [Role.CREATOR, Role.ADMIN],
                    ["community.create"],
                    payload={"name": "Test Community", "description": "Test description"},
                ),
                PermissionTest(
                    "Moderate Community",
                    "/api/gypsycove/communities/moderate",
                    "POST",
                    Platform.GYPSY_COVE,
                    [Role.MODERATOR, Role.ADMIN],
                    ["community.moderate"],
                    payload={"community_id": "test-community", "action": "pin_post"},
                ),
            ]
        )

        # =====================================================
        # Cross-Platform Admin Tests
        # =====================================================

        # User Management
        tests.extend(
            [
                PermissionTest(
                    "View All Users",
                    "/api/admin/users",
                    "GET",
                    Platform.NOVAOS,
                    [Role.ADMIN, Role.SUPER_ADMIN, Role.GODMODE],
                    ["admin.view_users"],
                ),
                PermissionTest(
                    "Create User",
                    "/api/admin/users",
                    "POST",
                    Platform.NOVAOS,
                    [Role.ADMIN, Role.SUPER_ADMIN, Role.GODMODE],
                    ["admin.create_user"],
                    payload={"email": "test@example.com", "role": "user"},
                ),
                PermissionTest(
                    "Deactivate User",
                    "/api/admin/users/deactivate",
                    "POST",
                    Platform.NOVAOS,
                    [Role.SUPER_ADMIN, Role.GODMODE],
                    ["admin.deactivate_user"],
                    payload={"user_id": "test-user"},
                ),
            ]
        )

        # Platform Configuration
        tests.extend(
            [
                PermissionTest(
                    "View Platform Config",
                    "/api/admin/platform/config",
                    "GET",
                    Platform.NOVAOS,
                    [Role.ADMIN, Role.SUPER_ADMIN, Role.GODMODE],
                    ["admin.view_config"],
                ),
                PermissionTest(
                    "Update Platform Config",
                    "/api/admin/platform/config",
                    "PUT",
                    Platform.NOVAOS,
                    [Role.SUPER_ADMIN, Role.GODMODE],
                    ["admin.update_config"],
                    payload={"maintenance_mode": False},
                ),
                PermissionTest(
                    "Emergency Shutdown",
                    "/api/admin/platform/emergency",
                    "POST",
                    Platform.NOVAOS,
                    [Role.GODMODE],
                    ["admin.emergency_control"],
                ),
            ]
        )

        # Compliance & Legal
        tests.extend(
            [
                PermissionTest(
                    "View Compliance Dashboard",
                    "/api/compliance/dashboard",
                    "GET",
                    Platform.BLACK_ROSE,
                    [Role.ADMIN, Role.SUPER_ADMIN, Role.GODMODE],
                    ["compliance.view_dashboard"],
                    age_verification_required=True,
                ),
                PermissionTest(
                    "Process Age Verification",
                    "/api/compliance/age-verify",
                    "POST",
                    Platform.BLACK_ROSE,
                    [Role.MODERATOR, Role.ADMIN],
                    ["compliance.process_verification"],
                    age_verification_required=True,
                    payload={"user_id": "test-user", "verified": True},
                ),
                PermissionTest(
                    "Handle DMCA Report",
                    "/api/compliance/dmca",
                    "POST",
                    Platform.BLACK_ROSE,
                    [Role.ADMIN, Role.SUPER_ADMIN, Role.GODMODE],
                    ["compliance.handle_dmca"],
                    payload={"content_id": "test-content", "action": "remove"},
                ),
            ]
        )

        return tests

    async def authenticate_user(self, user: TestUser) -> Optional[str]:
        """Authenticate a test user and return JWT token"""
        try:
            async with self.session.post(
                f"{self.base_url}/api/auth/login",
                json={"email": user.email, "password": "test_password_123"},
            ) as response:
                if response.status == 200:
                    # Extract token from cookie
                    cookies = response.cookies
                    return (
                        cookies.get("access_token", {}).value if "access_token" in cookies else None
                    )
                return None
        except Exception as e:
            print(f"Authentication failed for {user.email}: {e}")
            return None

    async def run_permission_test(
        self, test: PermissionTest, user: TestUser, token: Optional[str]
    ) -> Dict:
        """Run a single permission test"""
        result = {
            "test_name": test.name,
            "user_role": user.role.value,
            "user_platform": user.platform.value,
            "endpoint": f"{test.method} {test.endpoint}",
            "expected_status": test.expected_status,
            "actual_status": None,
            "passed": False,
            "error": None,
            "response_data": None,
        }

        try:
            # Check pre-conditions
            if test.age_verification_required and not user.age_verified:
                result["actual_status"] = 403
                result["error"] = "Age verification required"
                result["passed"] = 403 == test.expected_status
                return result

            if test.subscription_required and not user.subscription_active:
                result["actual_status"] = 402
                result["error"] = "Active subscription required"
                result["passed"] = 402 == test.expected_status
                return result

            if test.premium_required and not user.premium_access:
                result["actual_status"] = 402
                result["error"] = "Premium access required"
                result["passed"] = 402 == test.expected_status
                return result

            # Prepare request headers
            headers = {}
            if token:
                headers["Cookie"] = f"access_token={token}"

            if user.platform == Platform.BLACK_ROSE:
                headers["X-Age-Verified"] = "true" if user.age_verified else "false"

            # Make request
            url = f"{self.base_url}{test.endpoint}"

            if test.method == "GET":
                async with self.session.get(url, headers=headers) as response:
                    result["actual_status"] = response.status
                    result["response_data"] = await response.text()
            elif test.method == "POST":
                async with self.session.post(url, headers=headers, json=test.payload) as response:
                    result["actual_status"] = response.status
                    result["response_data"] = await response.text()
            elif test.method == "PUT":
                async with self.session.put(url, headers=headers, json=test.payload) as response:
                    result["actual_status"] = response.status
                    result["response_data"] = await response.text()
            elif test.method == "DELETE":
                async with self.session.delete(url, headers=headers) as response:
                    result["actual_status"] = response.status
                    result["response_data"] = await response.text()

            # Check if user should have access
            should_have_access = self.should_user_have_access(user, test)

            if should_have_access:
                result["passed"] = result["actual_status"] in [200, 201, 204]
            else:
                result["passed"] = result["actual_status"] in [401, 403, 404]

        except Exception as e:
            result["error"] = str(e)
            result["passed"] = False

        return result

    def should_user_have_access(self, user: TestUser, test: PermissionTest) -> bool:
        """Determine if user should have access based on role and platform"""

        # Platform mismatch check
        if user.platform != test.platform and test.platform != Platform.NOVAOS:
            return False

        # Role-based access
        if user.role not in test.required_roles:
            return False

        # Special role privileges
        if user.role in [Role.SUPER_ADMIN, Role.GODMODE]:
            return True

        # Age verification check
        if test.age_verification_required and not user.age_verified:
            return False

        # Subscription checks
        if test.subscription_required and not user.subscription_active:
            return False

        if test.premium_required and not user.premium_access:
            return False

        return True

    async def run_all_tests(self) -> Dict[str, List[Dict]]:
        """Run comprehensive RBAC test suite"""
        print("🚀 Starting RBAC System Testing & Validation...")
        print("=" * 60)

        users = self.create_test_users()
        tests = self.define_permission_tests()

        print(
            f"Created {len(users)} test users across {len(set(u.platform for u in users))} platforms"
        )
        print(f"Defined {len(tests)} permission test scenarios")
        print()

        # Authenticate all users
        print("🔐 Authenticating test users...")
        user_tokens = {}
        for user in users:
            token = await self.authenticate_user(user)
            user_tokens[user.id] = token
            if token:
                print(f"✅ {user.role.value}@{user.platform.value}: Authenticated")
            else:
                print(f"❌ {user.role.value}@{user.platform.value}: Authentication failed")

        print()

        # Run permission tests
        print("🧪 Running permission tests...")
        all_results = []

        for i, test in enumerate(tests, 1):
            print(f"[{i:3d}/{len(tests)}] Testing: {test.name} ({test.platform.value})")

            platform_users = [
                u for u in users if u.platform == test.platform or test.platform == Platform.NOVAOS
            ]

            for user in platform_users:
                token = user_tokens.get(user.id)
                result = await self.run_permission_test(test, user, token)
                all_results.append(result)

        print()

        # Organize results by platform and generate report
        self.test_results = self.organize_results(all_results)
        return self.test_results

    def organize_results(self, results: List[Dict]) -> Dict[str, List[Dict]]:
        """Organize test results by platform and category"""
        organized = {"novaos": [], "black_rose": [], "gypsy_cove": [], "cross_platform": []}

        for result in results:
            platform = result["user_platform"]
            if platform == "novaos":
                organized["novaos"].append(result)
            elif platform == "black-rose":
                organized["black_rose"].append(result)
            elif platform == "gypsy-cove":
                organized["gypsy_cove"].append(result)
            else:
                organized["cross_platform"].append(result)

        return organized

    def generate_report(self) -> str:
        """Generate comprehensive RBAC test report"""
        if not self.test_results:
            return "No test results available. Run tests first."

        report = []
        report.append("🔐 RBAC SYSTEM TESTING & VALIDATION REPORT")
        report.append("=" * 60)
        report.append()

        total_tests = sum(len(results) for results in self.test_results.values())
        total_passed = sum(
            sum(1 for r in results if r["passed"]) for results in self.test_results.values()
        )
        overall_pass_rate = (total_passed / total_tests * 100) if total_tests > 0 else 0

        report.append(f"📊 OVERALL RESULTS:")
        report.append(f"   Total Tests: {total_tests}")
        report.append(f"   Passed: {total_passed}")
        report.append(f"   Failed: {total_tests - total_passed}")
        report.append(f"   Pass Rate: {overall_pass_rate:.1f}%")
        report.append()

        # Platform-specific results
        platform_names = {
            "novaos": "NovaOS Console",
            "black_rose": "Black Rose Collective",
            "gypsy_cove": "GypsyCove",
            "cross_platform": "Cross-Platform Admin",
        }

        for platform_key, platform_name in platform_names.items():
            results = self.test_results.get(platform_key, [])
            if not results:
                continue

            passed = sum(1 for r in results if r["passed"])
            failed = len(results) - passed
            pass_rate = (passed / len(results) * 100) if results else 0

            report.append(f"🎯 {platform_name.upper()}")
            report.append(
                f"   Tests: {len(results)} | Passed: {passed} | Failed: {failed} | Rate: {pass_rate:.1f}%"
            )

            if failed > 0:
                report.append("   ❌ Failed Tests:")
                failed_tests = [r for r in results if not r["passed"]]
                for test in failed_tests[:10]:  # Show first 10 failures
                    report.append(
                        f"      • {test['test_name']} ({test['user_role']}) - {test.get('error', 'Access denied')}"
                    )
                if len(failed_tests) > 10:
                    report.append(f"      ... and {len(failed_tests) - 10} more")

            report.append()

        # Security boundary analysis
        report.append("🛡️  SECURITY BOUNDARY ANALYSIS:")
        report.append()

        # Age verification compliance
        age_tests = [
            r
            for results in self.test_results.values()
            for r in results
            if "blackrose" in r.get("endpoint", "") and "age" in r["test_name"].lower()
        ]
        if age_tests:
            age_passed = sum(1 for t in age_tests if t["passed"])
            report.append(f"   Age Verification: {age_passed}/{len(age_tests)} tests passed")

        # Role escalation checks
        escalation_tests = [
            r
            for results in self.test_results.values()
            for r in results
            if r["user_role"] in ["guest", "user"] and r["actual_status"] == 200
        ]
        report.append(f"   Role Escalation: {len(escalation_tests)} potential issues detected")

        # Cross-platform access checks
        cross_tests = [
            r
            for results in self.test_results.values()
            for r in results
            if r["user_platform"] != "novaos"
        ]
        cross_violations = sum(1 for t in cross_tests if t["passed"] and "admin" in t["endpoint"])
        report.append(f"   Cross-Platform Isolation: {cross_violations} boundary violations")

        report.append()

        # Recommendations
        if overall_pass_rate < 95:
            report.append("⚠️  RECOMMENDATIONS:")
            report.append("   • Review failed test cases and implement missing permission checks")
            report.append("   • Strengthen role-based access controls for sensitive endpoints")
            report.append("   • Implement additional security middleware for age-gated content")
            if cross_violations > 0:
                report.append(
                    "   • Review cross-platform access controls and implement stricter isolation"
                )
            report.append()

        report.append("✅ RBAC validation completed.")
        report.append(f"   Full test results available in: rbac_test_results.json")

        return "\n".join(report)

    def save_results(self, filename: str = "rbac_test_results.json"):
        """Save detailed test results to JSON file"""
        with open(filename, "w") as f:
            json.dump(self.test_results, f, indent=2, default=str)


async def main():
    """Run comprehensive RBAC testing suite"""
    async with RBACTester() as tester:
        # Run all tests
        results = await tester.run_all_tests()

        # Generate and display report
        report = tester.generate_report()
        print(report)

        # Save detailed results
        tester.save_results()

        # Summary for todo completion
        total_tests = sum(len(results) for results in tester.test_results.values())
        total_passed = sum(
            sum(1 for r in results if r["passed"]) for results in tester.test_results.values()
        )

        print()
        print(f"🎉 RBAC Testing Complete: {total_passed}/{total_tests} tests passed")

        if total_passed == total_tests:
            print("✅ All RBAC controls are properly implemented and enforced!")
            return True
        else:
            print("❌ Some RBAC issues detected. Review failed tests and implement fixes.")
            return False


if __name__ == "__main__":
    import sys

    success = asyncio.run(main())
    sys.exit(0 if success else 1)
