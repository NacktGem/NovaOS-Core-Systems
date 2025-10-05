#!/usr/bin/env python3
"""
Local Security Audit Configuration
===================================

This configuration performs security audits on local NovaOS services
and infrastructure components rather than external domains.
"""

import asyncio
import sys
import os

# Add current directory to path to import the security audit suite
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from security_audit_suite import (
    SecurityAuditSuite,
    SecurityFinding,
    VulnerabilityLevel,
    SecurityTestCategory,
)


class LocalSecurityAudit(SecurityAuditSuite):
    """Local development environment security audit"""

    def __init__(self):
        # Local development URLs
        local_urls = {
            'core_api': 'http://localhost:8000',
            'novaos_console': 'http://localhost:3000',
            'black_rose_collective': 'http://localhost:3001',
            'gypsycove': 'http://localhost:3002',
            'redis': 'redis://localhost:6379',
            'postgres': 'postgresql://localhost:5432',
        }
        super().__init__(local_urls)

    async def audit_local_infrastructure(self):
        """Audit local development infrastructure"""
        findings = []

        # Check for exposed development services
        development_services = [
            ('Docker', 2375, 2376),  # Docker daemon
            ('PostgreSQL', 5432, None),  # Database
            ('Redis', 6379, None),  # Cache
            ('MongoDB', 27017, None),  # Document store
            ('Elasticsearch', 9200, 9300),  # Search
        ]

        for service_name, port, secure_port in development_services:
            findings.extend(await self._check_service_exposure(service_name, port, secure_port))

        # Check Docker configuration
        findings.extend(await self._audit_docker_security())

        # Check environment files
        findings.extend(await self._audit_environment_files())

        # Check file permissions
        findings.extend(await self._audit_file_permissions())

        return findings

    async def _check_service_exposure(self, service_name: str, port: int, secure_port: int = None):
        """Check if development services are exposed"""
        findings = []

        try:
            import socket

            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(2)

            # Check if service is listening on all interfaces (0.0.0.0)
            result = sock.connect_ex(('0.0.0.0', port))
            if result == 0:
                findings.append(
                    SecurityFinding(
                        id=f"exposed_{service_name.lower()}",
                        title=f"{service_name} Service Exposed",
                        description=f"{service_name} is listening on all interfaces (0.0.0.0:{port})",
                        category=SecurityTestCategory.NETWORK_SECURITY,
                        severity=VulnerabilityLevel.MEDIUM,
                        affected_platform="local_infrastructure",
                        remediation=f"Bind {service_name} to localhost only (127.0.0.1:{port})",
                    )
                )
            sock.close()

        except Exception as e:
            pass  # Service not running or other error

        return findings

    async def _audit_docker_security(self):
        """Audit Docker security configuration"""
        findings = []

        try:
            # Check if Docker daemon is exposed
            import subprocess

            result = subprocess.run(['docker', 'info'], capture_output=True, text=True)

            if result.returncode == 0:
                # Check for insecure registry usage
                if 'insecure-registries' in result.stdout.lower():
                    findings.append(
                        SecurityFinding(
                            id="docker_insecure_registry",
                            title="Docker Insecure Registry",
                            description="Docker is configured to use insecure registries",
                            category=SecurityTestCategory.CONFIGURATION,
                            severity=VulnerabilityLevel.MEDIUM,
                            affected_platform="docker",
                            remediation="Use only secure registries with proper TLS certificates",
                        )
                    )

                # Check for privileged containers
                containers_result = subprocess.run(
                    ['docker', 'ps', '--format', 'table {{.Names}}\t{{.Status}}'],
                    capture_output=True,
                    text=True,
                )

                if containers_result.returncode == 0:
                    for line in containers_result.stdout.split('\n')[1:]:
                        if line.strip():
                            container_name = line.split('\t')[0]
                            inspect_result = subprocess.run(
                                [
                                    'docker',
                                    'inspect',
                                    container_name,
                                    '--format',
                                    '{{.HostConfig.Privileged}}',
                                ],
                                capture_output=True,
                                text=True,
                            )

                            if (
                                inspect_result.returncode == 0
                                and inspect_result.stdout.strip() == 'true'
                            ):
                                findings.append(
                                    SecurityFinding(
                                        id=f"privileged_container_{container_name}",
                                        title="Privileged Container",
                                        description=f"Container {container_name} is running in privileged mode",
                                        category=SecurityTestCategory.CONFIGURATION,
                                        severity=VulnerabilityLevel.HIGH,
                                        affected_platform="docker",
                                        evidence=f"Container: {container_name}",
                                        remediation="Remove privileged mode unless absolutely necessary",
                                    )
                                )

        except Exception as e:
            pass  # Docker not available or other error

        return findings

    async def _audit_environment_files(self):
        """Audit environment configuration files"""
        findings = []

        sensitive_patterns = [
            'password',
            'secret',
            'key',
            'token',
            'api_key',
            'private_key',
            'cert',
            'credential',
            'auth',
        ]

        env_files = ['.env', '.env.local', '.env.development', 'docker-compose.yml']

        for env_file in env_files:
            if os.path.exists(env_file):
                try:
                    with open(env_file, 'r') as f:
                        content = f.read()

                        # Check for hardcoded secrets
                        for pattern in sensitive_patterns:
                            if pattern in content.lower() and '=' in content:
                                lines = content.split('\n')
                                for i, line in enumerate(lines, 1):
                                    if (
                                        pattern in line.lower()
                                        and '=' in line
                                        and not line.strip().startswith('#')
                                    ):
                                        # Check if value appears to be hardcoded (not a reference)
                                        parts = line.split('=', 1)
                                        if (
                                            len(parts) == 2
                                            and parts[1].strip()
                                            and not parts[1].strip().startswith('$')
                                        ):
                                            findings.append(
                                                SecurityFinding(
                                                    id=f"hardcoded_secret_{env_file}_{i}",
                                                    title="Hardcoded Secret",
                                                    description=f"Potential hardcoded secret in {env_file}:{i}",
                                                    category=SecurityTestCategory.CONFIGURATION,
                                                    severity=VulnerabilityLevel.HIGH,
                                                    affected_platform="configuration",
                                                    evidence=f"File: {env_file}, Line: {i}",
                                                    remediation="Use environment variables or secure secret management",
                                                )
                                            )

                except Exception as e:
                    pass  # File read error

        return findings

    async def _audit_file_permissions(self):
        """Audit critical file permissions"""
        findings = []

        critical_files = [
            '.env',
            '.env.local',
            'docker-compose.yml',
            'keys/',
            'secrets/',
            'vaults/',
        ]

        for file_path in critical_files:
            if os.path.exists(file_path):
                try:
                    import stat

                    file_stat = os.stat(file_path)
                    permissions = stat.filemode(file_stat.st_mode)

                    # Check if file is world-readable
                    if file_stat.st_mode & stat.S_IROTH:
                        findings.append(
                            SecurityFinding(
                                id=f"world_readable_{file_path.replace('/', '_')}",
                                title="World-Readable Sensitive File",
                                description=f"File {file_path} is readable by all users",
                                category=SecurityTestCategory.CONFIGURATION,
                                severity=VulnerabilityLevel.MEDIUM,
                                affected_platform="filesystem",
                                evidence=f"Permissions: {permissions}",
                                remediation=f"Change permissions: chmod 600 {file_path}",
                            )
                        )

                    # Check if directory is world-writable
                    if os.path.isdir(file_path) and file_stat.st_mode & stat.S_IWOTH:
                        findings.append(
                            SecurityFinding(
                                id=f"world_writable_{file_path.replace('/', '_')}",
                                title="World-Writable Sensitive Directory",
                                description=f"Directory {file_path} is writable by all users",
                                category=SecurityTestCategory.CONFIGURATION,
                                severity=VulnerabilityLevel.HIGH,
                                affected_platform="filesystem",
                                evidence=f"Permissions: {permissions}",
                                remediation=f"Change permissions: chmod 750 {file_path}",
                            )
                        )

                except Exception as e:
                    pass  # Permission check error

        return findings


async def main():
    """Run local security audit"""
    print("🔒 NovaOS Local Security Audit")
    print("=" * 40)
    print("Auditing local development environment...")
    print()

    audit = LocalSecurityAudit()

    # Run infrastructure audit
    infrastructure_findings = await audit.audit_local_infrastructure()
    audit.findings.extend(infrastructure_findings)

    # Run application audit on localhost
    try:
        app_results = await audit.run_full_audit()
    except Exception as e:
        print(f"Application audit failed: {e}")
        app_results = None

    # Generate report
    report_file = audit.save_report('local_security_audit_report.json')

    # Display summary
    total_findings = len(audit.findings)
    critical_count = len([f for f in audit.findings if f.severity == VulnerabilityLevel.CRITICAL])
    high_count = len([f for f in audit.findings if f.severity == VulnerabilityLevel.HIGH])
    medium_count = len([f for f in audit.findings if f.severity == VulnerabilityLevel.MEDIUM])
    low_count = len([f for f in audit.findings if f.severity == VulnerabilityLevel.LOW])

    print(f"\n📊 LOCAL SECURITY AUDIT SUMMARY")
    print("=" * 40)
    print(f"Total Findings: {total_findings}")
    print(f"Critical: {critical_count}")
    print(f"High: {high_count}")
    print(f"Medium: {medium_count}")
    print(f"Low: {low_count}")

    if total_findings > 0:
        print(f"\n🔍 TOP SECURITY ISSUES:")
        for finding in sorted(
            audit.findings,
            key=lambda x: ['low', 'medium', 'high', 'critical'].index(x.severity.value),
            reverse=True,
        )[:5]:
            print(f"  • {finding.severity.value.upper()}: {finding.title}")

    print(f"\nDetailed report saved to: {report_file}")

    return audit.findings


if __name__ == "__main__":
    asyncio.run(main())
