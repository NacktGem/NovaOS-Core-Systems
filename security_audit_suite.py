#!/usr/bin/env python3
"""
NovaOS Security Audit & Penetration Testing Suite
==================================================

Comprehensive security assessment framework for all NovaOS platforms:
- NovaOS Console (productivity/administrative)
- Black Rose Collective (adult content/creator platform)
- GypsyCove (social networking)

Features:
- Automated vulnerability scanning
- Manual penetration testing procedures
- Security compliance verification
- Risk assessment and reporting
"""

import asyncio
import json
import logging
import subprocess
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import requests
import socket
from urllib.parse import urljoin, urlparse
import ssl
import hashlib
import re

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class VulnerabilityLevel(Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class SecurityTestCategory(Enum):
    AUTHENTICATION = "authentication"
    AUTHORIZATION = "authorization"
    INPUT_VALIDATION = "input_validation"
    SESSION_MANAGEMENT = "session_management"
    ENCRYPTION = "encryption"
    INJECTION = "injection"
    XSS = "xss"
    CSRF = "csrf"
    BUSINESS_LOGIC = "business_logic"
    INFORMATION_DISCLOSURE = "information_disclosure"
    CONFIGURATION = "configuration"
    NETWORK_SECURITY = "network_security"


@dataclass
class SecurityFinding:
    """Represents a security vulnerability or issue"""

    id: str
    title: str
    description: str
    category: SecurityTestCategory
    severity: VulnerabilityLevel
    affected_platform: str
    affected_endpoint: Optional[str] = None
    evidence: Optional[str] = None
    remediation: Optional[str] = None
    cve_id: Optional[str] = None
    cvss_score: Optional[float] = None
    timestamp: Optional[str] = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now().isoformat()


class SecurityAuditSuite:
    """Comprehensive security audit and penetration testing suite"""

    def __init__(self, base_urls: Dict[str, str] = None):
        self.base_urls = base_urls or {
            'novaos_console': 'https://console.novaos.dev',
            'black_rose_collective': 'https://blackrosecollective.studio',
            'gypsycove': 'https://gypsycove.com',
        }
        self.findings: List[SecurityFinding] = []
        self.session = requests.Session()
        self.session.headers.update({'User-Agent': 'NovaOS-SecurityAudit/1.0'})

    async def run_full_audit(self) -> Dict[str, Any]:
        """Execute comprehensive security audit across all platforms"""
        logger.info("🔒 Starting NovaOS Security Audit & Penetration Testing Suite")

        audit_results = {
            'metadata': {
                'audit_start': datetime.now().isoformat(),
                'platforms_tested': list(self.base_urls.keys()),
                'audit_version': '1.0.0',
            },
            'findings': [],
            'platform_results': {},
            'risk_assessment': {},
            'recommendations': [],
        }

        # Run security tests for each platform
        for platform, base_url in self.base_urls.items():
            logger.info(f"🎯 Testing platform: {platform} ({base_url})")

            platform_findings = await self._audit_platform(platform, base_url)
            audit_results['platform_results'][platform] = {
                'base_url': base_url,
                'findings_count': len(platform_findings),
                'critical_count': len(
                    [f for f in platform_findings if f.severity == VulnerabilityLevel.CRITICAL]
                ),
                'high_count': len(
                    [f for f in platform_findings if f.severity == VulnerabilityLevel.HIGH]
                ),
                'findings': [asdict(f) for f in platform_findings],
            }

            self.findings.extend(platform_findings)

        # Generate overall risk assessment
        audit_results['risk_assessment'] = self._generate_risk_assessment()
        audit_results['recommendations'] = self._generate_recommendations()
        audit_results['findings'] = [asdict(f) for f in self.findings]
        audit_results['metadata']['audit_end'] = datetime.now().isoformat()

        logger.info(f"🏁 Security audit completed. Found {len(self.findings)} issues.")
        return audit_results

    async def _audit_platform(self, platform: str, base_url: str) -> List[SecurityFinding]:
        """Audit a specific platform for security vulnerabilities"""
        platform_findings = []

        # Network and SSL/TLS security
        platform_findings.extend(await self._test_network_security(platform, base_url))

        # HTTP headers and configuration
        platform_findings.extend(await self._test_http_headers(platform, base_url))

        # Authentication and session management
        platform_findings.extend(await self._test_authentication(platform, base_url))

        # Authorization and access controls
        platform_findings.extend(await self._test_authorization(platform, base_url))

        # Critical authentication bypass detection (post-fix validation)
        platform_findings.extend(await self._test_critical_auth_bypass(platform, base_url))

        # Input validation and injection attacks
        platform_findings.extend(await self._test_input_validation(platform, base_url))

        # Cross-Site Scripting (XSS)
        platform_findings.extend(await self._test_xss(platform, base_url))

        # Cross-Site Request Forgery (CSRF)
        platform_findings.extend(await self._test_csrf(platform, base_url))

        # Business logic flaws
        platform_findings.extend(await self._test_business_logic(platform, base_url))

        # Information disclosure
        platform_findings.extend(await self._test_information_disclosure(platform, base_url))

        return platform_findings

    async def _test_network_security(self, platform: str, base_url: str) -> List[SecurityFinding]:
        """Test network-level security configurations"""
        findings = []

        try:
            parsed_url = urlparse(base_url)
            hostname = parsed_url.hostname
            port = parsed_url.port or (443 if parsed_url.scheme == 'https' else 80)

            # Test SSL/TLS configuration
            if parsed_url.scheme == 'https':
                context = ssl.create_default_context()
                with socket.create_connection((hostname, port), timeout=10) as sock:
                    with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                        cert = ssock.getpeercert()
                        cipher = ssock.cipher()

                        # Check TLS version
                        if ssock.version() in ['TLSv1', 'TLSv1.1']:
                            findings.append(
                                SecurityFinding(
                                    id=f"{platform}_weak_tls",
                                    title="Weak TLS Version",
                                    description=f"Server supports weak TLS version: {ssock.version()}",
                                    category=SecurityTestCategory.NETWORK_SECURITY,
                                    severity=VulnerabilityLevel.HIGH,
                                    affected_platform=platform,
                                    remediation="Upgrade to TLS 1.2 or higher",
                                )
                            )

                        # Check cipher strength
                        if (
                            cipher
                            and len(cipher) >= 2
                            and isinstance(cipher[1], int)
                            and cipher[1] < 256
                        ):
                            findings.append(
                                SecurityFinding(
                                    id=f"{platform}_weak_cipher",
                                    title="Weak Cipher Suite",
                                    description=f"Weak cipher detected: {cipher[0]} ({cipher[1]} bits)",
                                    category=SecurityTestCategory.ENCRYPTION,
                                    severity=VulnerabilityLevel.MEDIUM,
                                    affected_platform=platform,
                                    remediation="Configure strong cipher suites (AES-256 or higher)",
                                )
                            )

            # Test for open ports (basic port scan)
            common_ports = [22, 80, 443, 3306, 5432, 6379, 27017]
            for test_port in common_ports:
                if test_port != port:  # Skip the main service port
                    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    sock.settimeout(2)
                    result = sock.connect_ex((hostname, test_port))
                    if result == 0:
                        findings.append(
                            SecurityFinding(
                                id=f"{platform}_open_port_{test_port}",
                                title="Unexpected Open Port",
                                description=f"Port {test_port} is open and may expose additional services",
                                category=SecurityTestCategory.NETWORK_SECURITY,
                                severity=VulnerabilityLevel.MEDIUM,
                                affected_platform=platform,
                                remediation="Review firewall rules and close unnecessary ports",
                            )
                        )
                    sock.close()

        except Exception as e:
            logger.warning(f"Network security test failed for {platform}: {e}")

        return findings

    async def _test_http_headers(self, platform: str, base_url: str) -> List[SecurityFinding]:
        """Test HTTP security headers"""
        findings = []

        try:
            response = self.session.get(base_url, timeout=10)
            headers = response.headers

            # Check for missing security headers
            security_headers = {
                'Strict-Transport-Security': VulnerabilityLevel.HIGH,
                'Content-Security-Policy': VulnerabilityLevel.HIGH,
                'X-Frame-Options': VulnerabilityLevel.MEDIUM,
                'X-Content-Type-Options': VulnerabilityLevel.MEDIUM,
                'Referrer-Policy': VulnerabilityLevel.LOW,
                'Permissions-Policy': VulnerabilityLevel.LOW,
            }

            for header, severity in security_headers.items():
                if header not in headers:
                    findings.append(
                        SecurityFinding(
                            id=f"{platform}_missing_{header.lower().replace('-', '_')}",
                            title=f"Missing {header} Header",
                            description=f"The {header} security header is not present",
                            category=SecurityTestCategory.CONFIGURATION,
                            severity=severity,
                            affected_platform=platform,
                            remediation=f"Add {header} header to all responses",
                        )
                    )

            # Check for information disclosure in headers
            info_headers = ['Server', 'X-Powered-By', 'X-AspNet-Version']
            for header in info_headers:
                if header in headers:
                    findings.append(
                        SecurityFinding(
                            id=f"{platform}_info_disclosure_{header.lower().replace('-', '_')}",
                            title=f"Information Disclosure: {header}",
                            description=f"Server reveals technology information: {headers[header]}",
                            category=SecurityTestCategory.INFORMATION_DISCLOSURE,
                            severity=VulnerabilityLevel.LOW,
                            affected_platform=platform,
                            evidence=f"{header}: {headers[header]}",
                            remediation=f"Remove or obfuscate the {header} header",
                        )
                    )

        except Exception as e:
            logger.warning(f"HTTP headers test failed for {platform}: {e}")

        return findings

    async def _test_authentication(self, platform: str, base_url: str) -> List[SecurityFinding]:
        """Test authentication mechanisms"""
        findings = []

        # Test common authentication endpoints
        auth_endpoints = ['/login', '/auth', '/api/auth/login', '/signin']

        for endpoint in auth_endpoints:
            try:
                url = urljoin(base_url, endpoint)

                # Test for username enumeration
                test_payloads = [
                    {'username': 'admin', 'password': 'wrongpassword'},
                    {'username': 'nonexistentuser123456789', 'password': 'wrongpassword'},
                ]

                responses = []
                for payload in test_payloads:
                    try:
                        response = self.session.post(url, json=payload, timeout=10)
                        responses.append((payload, response))
                    except:
                        continue

                if len(responses) == 2:
                    # Compare response times and content for username enumeration
                    r1, r2 = responses[0][1], responses[1][1]
                    if abs(len(r1.text) - len(r2.text)) > 50:
                        findings.append(
                            SecurityFinding(
                                id=f"{platform}_username_enumeration",
                                title="Username Enumeration Vulnerability",
                                description="Different responses for valid/invalid usernames may allow enumeration",
                                category=SecurityTestCategory.AUTHENTICATION,
                                severity=VulnerabilityLevel.MEDIUM,
                                affected_platform=platform,
                                affected_endpoint=endpoint,
                                remediation="Ensure consistent responses for authentication failures",
                            )
                        )

                # Test for weak authentication methods
                weak_auth_response = self.session.get(url, timeout=10)
                if 'basic auth' in weak_auth_response.text.lower():
                    findings.append(
                        SecurityFinding(
                            id=f"{platform}_basic_auth",
                            title="Basic Authentication Detected",
                            description="Basic authentication may be in use",
                            category=SecurityTestCategory.AUTHENTICATION,
                            severity=VulnerabilityLevel.MEDIUM,
                            affected_platform=platform,
                            affected_endpoint=endpoint,
                            remediation="Use stronger authentication mechanisms",
                        )
                    )

            except Exception as e:
                logger.warning(f"Authentication test failed for {platform}{endpoint}: {e}")

        return findings

    async def _test_authorization(self, platform: str, base_url: str) -> List[SecurityFinding]:
        """Test authorization and access control mechanisms"""
        findings = []

        # Platform-specific admin endpoint mappings
        admin_endpoints = {
            'novaos_console': [
                '/godmode',
                '/godmode/',
                '/godmode/dashboard',
                '/admin',
                '/admin/',
                '/admin/dashboard',
                '/management',
                '/management/',
                '/api/platform/flags',
            ],
            'black_rose_collective': [
                '/admin',
                '/admin/',
                '/admin/dashboard',
                '/api/compliance/dashboard/summary',
            ],
            'gypsycove': [
                '/admin',
                '/admin/',
                '/admin/dashboard',
                '/console',
                '/console/',
                '/management',
                '/management/',
                '/godmode',
                '/godmode/',
            ],
        }

        # Get platform-specific endpoints, fallback to common ones
        platform_key = platform.lower().replace(' ', '_').replace('-', '_')
        sensitive_endpoints = admin_endpoints.get(
            platform_key,
            [
                '/admin',
                '/admin/',
                '/admin/dashboard',
                '/api/admin',
                '/api/users',
                '/api/admin/users',
                '/godmode',
                '/console',
                '/management',
            ],
        )

        for endpoint in sensitive_endpoints:
            try:
                url = urljoin(base_url, endpoint)

                # Test 1: Unauthenticated access (should be denied)
                response = self.session.get(url, timeout=10, allow_redirects=False)

                # Check if sensitive endpoints are accessible without auth
                if (
                    response.status_code == 200
                    and 'login' not in response.text.lower()
                    and 'auth' not in response.text.lower()
                ):
                    findings.append(
                        SecurityFinding(
                            id=f"{platform}_unauth_admin_access",
                            title="Unauthenticated Admin Access",
                            description=f"Admin endpoint {endpoint} accessible without authentication (HTTP {response.status_code})",
                            category=SecurityTestCategory.AUTHORIZATION,
                            severity=VulnerabilityLevel.CRITICAL,
                            affected_platform=platform,
                            affected_endpoint=endpoint,
                            evidence=f"HTTP {response.status_code} response, Content-Length: {len(response.text)}",
                            remediation="Implement JWT+RBAC middleware protection for admin routes",
                        )
                    )

                # Test 2: Check for proper security headers
                security_headers = ['X-Robots-Tag', 'X-Content-Type-Options', 'X-Frame-Options']
                missing_headers = [
                    header for header in security_headers if header not in response.headers
                ]

                if missing_headers and response.status_code in [200, 401, 403]:
                    findings.append(
                        SecurityFinding(
                            id=f"{platform}_missing_security_headers",
                            title="Missing Security Headers on Admin Routes",
                            description=f"Admin endpoint {endpoint} missing security headers: {', '.join(missing_headers)}",
                            category=SecurityTestCategory.CONFIGURATION,
                            severity=VulnerabilityLevel.MEDIUM,
                            affected_platform=platform,
                            affected_endpoint=endpoint,
                            evidence=f"Missing headers: {missing_headers}",
                            remediation="Add security headers via middleware: X-Robots-Tag, X-Content-Type-Options, X-Frame-Options",
                        )
                    )

                # Test 3: JWT bypass attempts with malformed tokens
                jwt_bypass_attempts = [
                    {'Authorization': 'Bearer invalid_token'},
                    {'Authorization': 'Bearer '},
                    {'Authorization': 'Basic YWRtaW46cGFzc3dvcmQ='},  # admin:password
                    {'Cookie': 'access_token=fake_token'},
                    {'Cookie': 'jwt=malicious_jwt'},
                ]

                for headers in jwt_bypass_attempts:
                    bypass_response = self.session.get(
                        url, headers=headers, timeout=10, allow_redirects=False
                    )

                    # Should not grant access with invalid tokens
                    if (
                        bypass_response.status_code == 200
                        and 'login' not in bypass_response.text.lower()
                    ):
                        findings.append(
                            SecurityFinding(
                                id=f"{platform}_jwt_bypass_attempt",
                                title="JWT Authentication Bypass",
                                description=f"Admin endpoint {endpoint} accessible with invalid JWT token",
                                category=SecurityTestCategory.AUTHENTICATION,
                                severity=VulnerabilityLevel.CRITICAL,
                                affected_platform=platform,
                                affected_endpoint=endpoint,
                                evidence=f"Bypass headers: {headers}, HTTP {bypass_response.status_code}",
                                remediation="Ensure JWT validation is strict and rejects malformed/invalid tokens",
                            )
                        )

            except Exception as e:
                logger.warning(f"Authorization test failed for {platform}{endpoint}: {e}")

        return findings

    async def _test_critical_auth_bypass(
        self, platform: str, base_url: str
    ) -> List[SecurityFinding]:
        """Test for critical authentication bypasses in newly secured admin interfaces"""
        findings = []
        logger.info(f"🔓 Testing critical authentication bypass vulnerabilities for {platform}")

        # Critical endpoints that were recently secured (validation tests)
        critical_endpoints = {
            'novaos_console': [
                ('/godmode', 'godmode'),  # (endpoint, required_role)
                ('/godmode/dashboard', 'godmode'),
                ('/admin', 'admin'),
                ('/management', 'admin'),
            ],
            'black_rose_collective': [
                ('/admin', 'admin'),
                ('/api/compliance/dashboard/summary', 'admin'),
            ],
            'gypsycove': [
                ('/admin', 'admin'),
                ('/console', 'admin'),
                ('/management', 'admin'),
                ('/godmode', 'godmode'),
            ],
        }

        # Get platform-specific critical endpoints
        platform_key = platform.lower().replace(' ', '_').replace('-', '_')
        endpoints_to_test = critical_endpoints.get(platform_key, [])

        if not endpoints_to_test:
            logger.info(f"No critical endpoints defined for platform: {platform}")
            return findings

        for endpoint, required_role in endpoints_to_test:
            try:
                url = urljoin(base_url, endpoint)
                logger.debug(f"Testing critical endpoint: {url}")

                # Test 1: Direct unauthenticated access
                response = self.session.get(url, timeout=10, allow_redirects=False)

                if response.status_code == 200:
                    # Check if it's actually serving admin content (not just login page)
                    content_indicators = ['dashboard', 'admin', 'management', 'godmode', 'console']
                    response_text_lower = response.text.lower()

                    # If it contains admin content and doesn't redirect to login
                    if (
                        any(indicator in response_text_lower for indicator in content_indicators)
                        and 'login' not in response_text_lower
                    ):
                        findings.append(
                            SecurityFinding(
                                id=f"{platform}_critical_unauth_bypass",
                                title="Critical Authentication Bypass",
                                description=f"Critical admin endpoint {endpoint} serving content without authentication (requires {required_role} role)",
                                category=SecurityTestCategory.AUTHENTICATION,
                                severity=VulnerabilityLevel.CRITICAL,
                                affected_platform=platform,
                                affected_endpoint=endpoint,
                                evidence=f"HTTP 200, serving admin content, Content-Length: {len(response.text)}",
                                remediation=f"Verify JWT+RBAC middleware is properly protecting {endpoint} with {required_role}+ role requirement",
                            )
                        )

                # Test 2: JWT Role bypass attempts (low privilege token accessing high privilege routes)
                role_bypass_tokens = [
                    # Simulate low-privilege user tokens trying to access admin routes
                    'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ0ZXN0IiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjk5OTk5OTk5OTksInJvbGUiOiJ1c2VyIn0.fake_signature',
                    'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ0ZXN0IiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjk5OTk5OTk5OTksInJvbGUiOiJjcmVhdG9yIn0.fake_signature',
                ]

                for token in role_bypass_tokens:
                    headers = {'Authorization': f'Bearer {token}'}
                    bypass_response = self.session.get(
                        url, headers=headers, timeout=10, allow_redirects=False
                    )

                    # Should return 403 Forbidden for insufficient role, not 200 OK
                    if bypass_response.status_code == 200:
                        findings.append(
                            SecurityFinding(
                                id=f"{platform}_role_escalation_bypass",
                                title="Role-Based Access Control Bypass",
                                description=f"Admin endpoint {endpoint} accessible with insufficient role privileges (requires {required_role})",
                                category=SecurityTestCategory.AUTHORIZATION,
                                severity=VulnerabilityLevel.CRITICAL,
                                affected_platform=platform,
                                affected_endpoint=endpoint,
                                evidence=f"HTTP 200 with low-privilege JWT token, should be 403",
                                remediation=f"Verify role hierarchy enforcement: {endpoint} should require {required_role}+ access",
                            )
                        )

                # Test 3: Middleware bypass via path manipulation
                path_manipulation_attempts = [
                    endpoint + '/',
                    endpoint + '/.',
                    endpoint + '/../' + endpoint.lstrip('/'),
                    endpoint.replace('/', '/./'),
                    endpoint + '%2f',
                    endpoint + '?bypass=true',
                    endpoint + '#fragment',
                ]

                for manipulated_path in path_manipulation_attempts:
                    manipulated_url = urljoin(base_url, manipulated_path)
                    manip_response = self.session.get(
                        manipulated_url, timeout=10, allow_redirects=False
                    )

                    if (
                        manip_response.status_code == 200
                        and 'login' not in manip_response.text.lower()
                    ):
                        findings.append(
                            SecurityFinding(
                                id=f"{platform}_middleware_path_bypass",
                                title="Middleware Path Bypass",
                                description=f"Admin endpoint accessible via path manipulation: {manipulated_path}",
                                category=SecurityTestCategory.AUTHORIZATION,
                                severity=VulnerabilityLevel.HIGH,
                                affected_platform=platform,
                                affected_endpoint=manipulated_path,
                                evidence=f"HTTP 200 via path manipulation, bypassing middleware protection",
                                remediation="Review middleware path matching patterns to prevent bypass via path manipulation",
                            )
                        )

                # Test 4: Verify security headers are present on protected routes
                expected_headers = {
                    'X-Robots-Tag': 'noindex',
                    'Cache-Control': 'no-store',
                    'X-Frame-Options': 'DENY',
                    'X-Content-Type-Options': 'nosniff',
                }

                # Test with a request that should trigger middleware (even if it returns 401/403)
                protected_response = self.session.get(url, timeout=10, allow_redirects=False)
                missing_security_headers = []

                for header, expected_value in expected_headers.items():
                    if header not in protected_response.headers:
                        missing_security_headers.append(header)
                    elif (
                        expected_value
                        and expected_value.lower() not in protected_response.headers[header].lower()
                    ):
                        missing_security_headers.append(f"{header}:{expected_value}")

                if missing_security_headers:
                    findings.append(
                        SecurityFinding(
                            id=f"{platform}_missing_admin_security_headers",
                            title="Missing Security Headers on Admin Routes",
                            description=f"Critical admin endpoint {endpoint} missing security headers: {', '.join(missing_security_headers)}",
                            category=SecurityTestCategory.CONFIGURATION,
                            severity=VulnerabilityLevel.MEDIUM,
                            affected_platform=platform,
                            affected_endpoint=endpoint,
                            evidence=f"Missing/incorrect headers: {missing_security_headers}",
                            remediation="Ensure middleware adds security headers: X-Robots-Tag noindex, Cache-Control no-store, etc.",
                        )
                    )

            except Exception as e:
                logger.warning(f"Critical auth bypass test failed for {platform}{endpoint}: {e}")

        logger.info(
            f"✅ Critical authentication bypass testing completed for {platform}: {len(findings)} issues found"
        )
        return findings

    async def _test_input_validation(self, platform: str, base_url: str) -> List[SecurityFinding]:
        """Test for input validation vulnerabilities including SQL injection"""
        findings = []

        # SQL injection test payloads
        sql_payloads = [
            "' OR '1'='1",
            "'; DROP TABLE users; --",
            "' UNION SELECT 1,2,3 --",
            "admin'--",
            "' OR 1=1#",
        ]

        # Common endpoints that might be vulnerable
        test_endpoints = [
            '/search',
            '/api/search',
            '/login',
            '/api/auth/login',
            '/user/',
            '/api/user/',
            '/profile',
        ]

        for endpoint in test_endpoints:
            for payload in sql_payloads:
                try:
                    url = urljoin(base_url, endpoint)

                    # Test GET parameters
                    get_response = self.session.get(
                        url, params={'q': payload, 'search': payload, 'id': payload}, timeout=10
                    )

                    # Look for SQL error indicators
                    sql_errors = [
                        'sql syntax',
                        'mysql_fetch',
                        'ora-',
                        'microsoft ole db',
                        'postgresql',
                        'sqlite',
                        'odbc',
                        'jdbc',
                    ]

                    if any(error in get_response.text.lower() for error in sql_errors):
                        findings.append(
                            SecurityFinding(
                                id=f"{platform}_sql_injection_{endpoint.replace('/', '_')}",
                                title="Potential SQL Injection",
                                description=f"SQL error detected in response from {endpoint}",
                                category=SecurityTestCategory.INJECTION,
                                severity=VulnerabilityLevel.HIGH,
                                affected_platform=platform,
                                affected_endpoint=endpoint,
                                evidence=f"Payload: {payload}",
                                remediation="Use parameterized queries and input validation",
                            )
                        )

                    # Test POST data
                    post_response = self.session.post(
                        url,
                        json={'username': payload, 'password': payload, 'data': payload},
                        timeout=10,
                    )

                    if any(error in post_response.text.lower() for error in sql_errors):
                        findings.append(
                            SecurityFinding(
                                id=f"{platform}_sql_injection_post_{endpoint.replace('/', '_')}",
                                title="Potential SQL Injection (POST)",
                                description=f"SQL error detected in POST response from {endpoint}",
                                category=SecurityTestCategory.INJECTION,
                                severity=VulnerabilityLevel.HIGH,
                                affected_platform=platform,
                                affected_endpoint=endpoint,
                                evidence=f"POST payload: {payload}",
                                remediation="Use parameterized queries and input validation",
                            )
                        )

                except Exception as e:
                    logger.warning(f"SQL injection test failed for {platform}{endpoint}: {e}")

        return findings

    async def _test_xss(self, platform: str, base_url: str) -> List[SecurityFinding]:
        """Test for Cross-Site Scripting vulnerabilities"""
        findings = []

        xss_payloads = [
            '<script>alert("XSS")</script>',
            '<img src=x onerror=alert("XSS")>',
            'javascript:alert("XSS")',
            '"><script>alert("XSS")</script>',
            "'><script>alert('XSS')</script>",
        ]

        # Test common form endpoints
        form_endpoints = ['/search', '/contact', '/feedback', '/comment']

        for endpoint in form_endpoints:
            for payload in xss_payloads:
                try:
                    url = urljoin(base_url, endpoint)

                    # Test reflected XSS
                    response = self.session.get(
                        url,
                        params={'q': payload, 'search': payload, 'message': payload},
                        timeout=10,
                    )

                    if payload in response.text and response.headers.get(
                        'content-type', ''
                    ).startswith('text/html'):
                        findings.append(
                            SecurityFinding(
                                id=f"{platform}_reflected_xss_{endpoint.replace('/', '_')}",
                                title="Reflected Cross-Site Scripting",
                                description=f"XSS payload reflected in response from {endpoint}",
                                category=SecurityTestCategory.XSS,
                                severity=VulnerabilityLevel.HIGH,
                                affected_platform=platform,
                                affected_endpoint=endpoint,
                                evidence=f"Payload: {payload}",
                                remediation="Implement proper input validation and output encoding",
                            )
                        )

                except Exception as e:
                    logger.warning(f"XSS test failed for {platform}{endpoint}: {e}")

        return findings

    async def _test_csrf(self, platform: str, base_url: str) -> List[SecurityFinding]:
        """Test for Cross-Site Request Forgery vulnerabilities"""
        findings = []

        # Test state-changing endpoints without CSRF protection
        csrf_endpoints = [
            '/api/user/delete',
            '/api/user/update',
            '/api/settings',
            '/admin/users',
            '/profile/update',
        ]

        for endpoint in csrf_endpoints:
            try:
                url = urljoin(base_url, endpoint)

                # Test POST without CSRF token
                response = self.session.post(
                    url,
                    json={'action': 'test'},
                    headers={'Origin': 'https://attacker.com'},
                    timeout=10,
                )

                # If request succeeds without CSRF protection, it's vulnerable
                if response.status_code in [200, 201, 204]:
                    csrf_token_found = any(
                        token in response.text.lower()
                        for token in ['csrf', '_token', 'authenticity_token']
                    )

                    if not csrf_token_found:
                        findings.append(
                            SecurityFinding(
                                id=f"{platform}_csrf_{endpoint.replace('/', '_')}",
                                title="Missing CSRF Protection",
                                description=f"Endpoint {endpoint} lacks CSRF protection",
                                category=SecurityTestCategory.CSRF,
                                severity=VulnerabilityLevel.MEDIUM,
                                affected_platform=platform,
                                affected_endpoint=endpoint,
                                remediation="Implement CSRF tokens for state-changing operations",
                            )
                        )

            except Exception as e:
                logger.warning(f"CSRF test failed for {platform}{endpoint}: {e}")

        return findings

    async def _test_business_logic(self, platform: str, base_url: str) -> List[SecurityFinding]:
        """Test for business logic vulnerabilities"""
        findings = []

        # Platform-specific business logic tests
        if 'black_rose_collective' in platform.lower():
            # Test age verification bypass
            try:
                # Try accessing adult content without proper verification
                adult_endpoints = ['/nsfw', '/adult', '/18+', '/premium', '/vault']

                for endpoint in adult_endpoints:
                    url = urljoin(base_url, endpoint)
                    response = self.session.get(url, timeout=10)

                    if response.status_code == 200 and 'age' not in response.text.lower():
                        findings.append(
                            SecurityFinding(
                                id=f"{platform}_age_verification_bypass",
                                title="Age Verification Bypass",
                                description=f"Adult content accessible without age verification at {endpoint}",
                                category=SecurityTestCategory.BUSINESS_LOGIC,
                                severity=VulnerabilityLevel.CRITICAL,
                                affected_platform=platform,
                                affected_endpoint=endpoint,
                                remediation="Implement robust age verification for all adult content",
                            )
                        )

            except Exception as e:
                logger.warning(f"Age verification test failed: {e}")

        # Test payment/subscription logic bypasses
        payment_endpoints = ['/subscribe', '/payment', '/purchase', '/api/payment']
        for endpoint in payment_endpoints:
            try:
                url = urljoin(base_url, endpoint)

                # Test negative amounts
                response = self.session.post(
                    url, json={'amount': -100, 'item_id': 'test'}, timeout=10
                )

                if response.status_code in [200, 201]:
                    findings.append(
                        SecurityFinding(
                            id=f"{platform}_negative_payment",
                            title="Negative Payment Amount Accepted",
                            description="System accepts negative payment amounts",
                            category=SecurityTestCategory.BUSINESS_LOGIC,
                            severity=VulnerabilityLevel.HIGH,
                            affected_platform=platform,
                            affected_endpoint=endpoint,
                            remediation="Validate payment amounts are positive",
                        )
                    )

            except Exception as e:
                logger.warning(f"Payment logic test failed: {e}")

        return findings

    async def _test_information_disclosure(
        self, platform: str, base_url: str
    ) -> List[SecurityFinding]:
        """Test for information disclosure vulnerabilities"""
        findings = []

        # Test for exposed configuration files
        config_files = [
            '/.env',
            '/.config',
            '/config.json',
            '/app.config',
            '/.git/config',
            '/docker-compose.yml',
            '/.dockerignore',
        ]

        for file_path in config_files:
            try:
                url = urljoin(base_url, file_path)
                response = self.session.get(url, timeout=10)

                if response.status_code == 200 and len(response.text) > 10:
                    findings.append(
                        SecurityFinding(
                            id=f"{platform}_config_exposure_{file_path.replace('/', '_').replace('.', '_')}",
                            title="Configuration File Exposure",
                            description=f"Configuration file exposed: {file_path}",
                            category=SecurityTestCategory.INFORMATION_DISCLOSURE,
                            severity=VulnerabilityLevel.HIGH,
                            affected_platform=platform,
                            affected_endpoint=file_path,
                            evidence=f"File size: {len(response.text)} bytes",
                            remediation="Remove or restrict access to configuration files",
                        )
                    )

            except Exception as e:
                logger.warning(f"Config file test failed: {e}")

        # Test for debug/error information disclosure
        try:
            # Force 404 error to check for information disclosure
            response = self.session.get(urljoin(base_url, '/nonexistent-path-12345'), timeout=10)

            debug_indicators = [
                'traceback',
                'stack trace',
                'debug',
                'exception',
                'internal server error',
                'application error',
            ]

            if any(indicator in response.text.lower() for indicator in debug_indicators):
                findings.append(
                    SecurityFinding(
                        id=f"{platform}_debug_info_disclosure",
                        title="Debug Information Disclosure",
                        description="Server reveals debug information in error responses",
                        category=SecurityTestCategory.INFORMATION_DISCLOSURE,
                        severity=VulnerabilityLevel.MEDIUM,
                        affected_platform=platform,
                        remediation="Disable debug mode and implement custom error pages",
                    )
                )

        except Exception as e:
            logger.warning(f"Debug info test failed: {e}")

        return findings

    def _generate_risk_assessment(self) -> Dict[str, Any]:
        """Generate overall risk assessment based on findings"""
        total_findings = len(self.findings)
        critical_count = len(
            [f for f in self.findings if f.severity == VulnerabilityLevel.CRITICAL]
        )
        high_count = len([f for f in self.findings if f.severity == VulnerabilityLevel.HIGH])
        medium_count = len([f for f in self.findings if f.severity == VulnerabilityLevel.MEDIUM])
        low_count = len([f for f in self.findings if f.severity == VulnerabilityLevel.LOW])

        # Calculate risk score (weighted)
        risk_score = (critical_count * 10) + (high_count * 7) + (medium_count * 4) + (low_count * 1)
        max_score = total_findings * 10
        risk_percentage = (risk_score / max_score * 100) if max_score > 0 else 0

        # Determine risk level
        if risk_percentage >= 70 or critical_count > 0:
            risk_level = "CRITICAL"
        elif risk_percentage >= 50 or high_count > 3:
            risk_level = "HIGH"
        elif risk_percentage >= 30 or medium_count > 5:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        return {
            'overall_risk_level': risk_level,
            'risk_score': risk_score,
            'risk_percentage': round(risk_percentage, 2),
            'total_findings': total_findings,
            'severity_breakdown': {
                'critical': critical_count,
                'high': high_count,
                'medium': medium_count,
                'low': low_count,
            },
            'most_common_categories': self._get_common_categories(),
            'platform_risk_distribution': self._get_platform_risk_distribution(),
        }

    def _get_common_categories(self) -> List[Dict[str, Any]]:
        """Get most common vulnerability categories"""
        category_counts = {}
        for finding in self.findings:
            category = finding.category.value
            category_counts[category] = category_counts.get(category, 0) + 1

        return [
            {'category': cat, 'count': count}
            for cat, count in sorted(category_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        ]

    def _get_platform_risk_distribution(self) -> Dict[str, Dict[str, int]]:
        """Get risk distribution per platform"""
        platform_risks = {}
        for finding in self.findings:
            platform = finding.affected_platform
            if platform not in platform_risks:
                platform_risks[platform] = {'critical': 0, 'high': 0, 'medium': 0, 'low': 0}

            platform_risks[platform][finding.severity.value] += 1

        return platform_risks

    def _generate_recommendations(self) -> List[Dict[str, Any]]:
        """Generate actionable security recommendations"""
        recommendations = [
            {
                'priority': 'CRITICAL',
                'category': 'Authentication & Authorization',
                'recommendation': 'Implement multi-factor authentication for all admin accounts',
                'effort': 'Medium',
                'timeline': '1-2 weeks',
            },
            {
                'priority': 'HIGH',
                'category': 'Input Validation',
                'recommendation': 'Deploy Web Application Firewall (WAF) to filter malicious requests',
                'effort': 'Low',
                'timeline': '1 week',
            },
            {
                'priority': 'HIGH',
                'category': 'Encryption',
                'recommendation': 'Upgrade to TLS 1.3 and implement HTTP Strict Transport Security (HSTS)',
                'effort': 'Low',
                'timeline': '1 week',
            },
            {
                'priority': 'MEDIUM',
                'category': 'Security Headers',
                'recommendation': 'Implement comprehensive security headers (CSP, X-Frame-Options, etc.)',
                'effort': 'Low',
                'timeline': '3-5 days',
            },
            {
                'priority': 'MEDIUM',
                'category': 'Monitoring',
                'recommendation': 'Implement security monitoring and incident response procedures',
                'effort': 'High',
                'timeline': '2-4 weeks',
            },
        ]

        # Add platform-specific recommendations based on findings
        if any('black_rose_collective' in f.affected_platform for f in self.findings):
            recommendations.append(
                {
                    'priority': 'CRITICAL',
                    'category': 'Compliance',
                    'recommendation': 'Strengthen age verification and content moderation systems',
                    'effort': 'High',
                    'timeline': '2-3 weeks',
                }
            )

        return recommendations

    def save_report(self, filename: str = None) -> str:
        """Save audit report to file"""
        if filename is None:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"security_audit_report_{timestamp}.json"

        # Convert findings to JSON-serializable format
        json_findings = []
        for finding in self.findings:
            finding_dict = asdict(finding)
            finding_dict['category'] = finding.category.value
            finding_dict['severity'] = finding.severity.value
            json_findings.append(finding_dict)

        report_data = {
            'metadata': {
                'generated_at': datetime.now().isoformat(),
                'audit_suite_version': '1.0.0',
                'total_findings': len(self.findings),
            },
            'findings': json_findings,
            'risk_assessment': self._generate_risk_assessment(),
            'recommendations': self._generate_recommendations(),
        }

        with open(filename, 'w') as f:
            json.dump(report_data, f, indent=2)

        logger.info(f"📊 Security audit report saved to: {filename}")
        return filename


async def main():
    """Run the security audit suite"""
    # Configure base URLs for testing
    base_urls = {
        'novaos_console': 'https://console.novaos.dev',
        'black_rose_collective': 'https://blackrosecollective.studio',
        'gypsycove': 'https://gypsycove.com',
    }

    # Initialize and run audit
    audit_suite = SecurityAuditSuite(base_urls)

    print("🔒 NovaOS Security Audit & Penetration Testing Suite")
    print("=" * 60)
    print("Starting comprehensive security assessment...")
    print(f"Platforms to test: {', '.join(base_urls.keys())}")
    print()

    # Run full audit
    results = await audit_suite.run_full_audit()

    # Save report
    report_file = audit_suite.save_report()

    # Display summary
    risk_assessment = results['risk_assessment']
    print("\n📊 SECURITY AUDIT SUMMARY")
    print("=" * 40)
    print(f"Overall Risk Level: {risk_assessment['overall_risk_level']}")
    print(f"Total Findings: {risk_assessment['total_findings']}")
    print(f"Critical: {risk_assessment['severity_breakdown']['critical']}")
    print(f"High: {risk_assessment['severity_breakdown']['high']}")
    print(f"Medium: {risk_assessment['severity_breakdown']['medium']}")
    print(f"Low: {risk_assessment['severity_breakdown']['low']}")
    print(f"\nDetailed report saved to: {report_file}")

    return results


if __name__ == "__main__":
    asyncio.run(main())
