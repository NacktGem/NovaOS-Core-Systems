#!/usr/bin/env python3
"""
NovaOS Final Launch Checklist & Go-Live Validation
Pre-deployment readiness assessment and launch preparation
"""

import json
import os
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple


class NovaOSLaunchValidator:
    """Comprehensive launch readiness validation for NovaOS Core Systems"""

    def __init__(self, base_path: str = "/mnt/d/NovaOS-Core-Systems"):
        self.base_path = Path(base_path)
        self.validation_results = []
        self.launch_status = {
            "timestamp": datetime.now().isoformat(),
            "validation_passed": False,
            "critical_issues": [],
            "warnings": [],
            "ready_for_launch": False,
        }

    def log_validation(self, check_name: str, status: str, message: str, critical: bool = False):
        """Log validation result"""
        result = {
            "check": check_name,
            "status": status,
            "message": message,
            "critical": critical,
            "timestamp": datetime.now().isoformat(),
        }
        self.validation_results.append(result)

        if status == "FAIL" and critical:
            self.launch_status["critical_issues"].append(message)
        elif status == "WARN":
            self.launch_status["warnings"].append(message)

        print(
            f"{'🔴' if status == 'FAIL' else '🟡' if status == 'WARN' else '✅'} {check_name}: {message}"
        )

    def validate_launch_phases(self) -> bool:
        """Validate all previous launch phases are complete"""
        print("🚀 Validating Previous Launch Phases...")

        phase_checks = [
            ("Web-Shell Deprecation", ["WEB_SHELL_MIGRATION.md"]),
            ("NovaOS Console GodMode", ["apps/nova-console", "MASTER_PALETTE_IMPLEMENTATION.md"]),
            ("Payment Processing", ["DEPLOY.md", "APPS.md"]),
            ("NSFW Compliance", ["NSFW_COMPLIANCE_IMPLEMENTATION.md"]),
            ("Platform UI Components", ["MASTER_PALETTE_IMPLEMENTATION.md"]),
            ("RBAC Testing", ["rbac_validation_results.json", "test_rbac_system.py"]),
            ("API Performance", ["OPERATIONAL_ARCHITECTURAL_REPORT.md"]),
            ("Mobile/PWA Features", ["apps/", "packages/"]),
            ("Security Audit", ["SECURITY_AUDIT_REPORT.md", "security_hardening_report.json"]),
        ]

        all_phases_complete = True

        for phase_name, required_files in phase_checks:
            missing_files = []
            for file_path in required_files:
                if not (self.base_path / file_path).exists():
                    missing_files.append(file_path)

            if missing_files:
                self.log_validation(
                    f"Phase: {phase_name}",
                    "FAIL",
                    f"Missing files: {', '.join(missing_files)}",
                    critical=True,
                )
                all_phases_complete = False
            else:
                self.log_validation(f"Phase: {phase_name}", "PASS", "All required files present")

        return all_phases_complete

    def validate_security_configuration(self) -> bool:
        """Validate security hardening is in place"""
        print("🔒 Validating Security Configuration...")

        security_valid = True

        # Check environment file security
        env_file = self.base_path / ".env"
        if env_file.exists():
            try:
                env_stat = env_file.stat()
                env_permissions = oct(env_stat.st_mode)[-3:]
                if env_permissions != "600":
                    self.log_validation(
                        "Environment Security",
                        "FAIL",
                        f".env permissions {env_permissions}, should be 600",
                        critical=True,
                    )
                    security_valid = False
                else:
                    self.log_validation(
                        "Environment Security", "PASS", ".env file has secure permissions (600)"
                    )
            except Exception as e:
                self.log_validation(
                    "Environment Security",
                    "FAIL",
                    f"Cannot check .env permissions: {str(e)}",
                    critical=True,
                )
                security_valid = False
        else:
            self.log_validation("Environment Security", "FAIL", ".env file missing", critical=True)
            security_valid = False

        # Check for secure secrets
        if env_file.exists():
            with open(env_file, 'r') as f:
                env_content = f.read()

            insecure_patterns = [
                ("changeme", "Default 'changeme' values found"),
                ("password", "Weak password patterns found"),
                ("123456", "Sequential number passwords found"),
                ("admin", "Default admin credentials found"),
            ]

            for pattern, message in insecure_patterns:
                if pattern.lower() in env_content.lower():
                    self.log_validation("Secret Security", "WARN", message)

            # Check for required secure tokens
            required_tokens = [
                "AUTH_PEPPER",
                "AGENT_SHARED_TOKEN",
                "INTERNAL_TOKEN",
                "NOVA_AGENT_TOKEN",
                "POSTGRES_PASSWORD",
            ]

            for token in required_tokens:
                if token not in env_content:
                    self.log_validation(
                        "Required Tokens", "FAIL", f"Missing required token: {token}", critical=True
                    )
                    security_valid = False
                else:
                    # Check if token looks secure (length > 16, not default values)
                    lines = [
                        line for line in env_content.split('\n') if line.startswith(f"{token}=")
                    ]
                    if lines:
                        token_value = lines[0].split('=', 1)[1]
                        if len(token_value) < 16:
                            self.log_validation(
                                "Token Security", "WARN", f"{token} appears too short for security"
                            )
                        else:
                            self.log_validation(
                                "Token Security", "PASS", f"{token} has secure length"
                            )

        # Check security artifacts exist
        security_files = [
            "SECURITY_AUDIT_REPORT.md",
            "SECURITY_DEPLOYMENT_CHECKLIST.md",
            "security_hardening_report.json",
            "nginx-security-headers.conf",
        ]

        for sec_file in security_files:
            if (self.base_path / sec_file).exists():
                self.log_validation("Security Documentation", "PASS", f"{sec_file} present")
            else:
                self.log_validation("Security Documentation", "WARN", f"{sec_file} missing")

        return security_valid

    def validate_infrastructure_config(self) -> bool:
        """Validate Docker and infrastructure configuration"""
        print("🐳 Validating Infrastructure Configuration...")

        infra_valid = True

        # Check docker-compose.yml
        compose_file = self.base_path / "docker-compose.yml"
        if compose_file.exists():
            self.log_validation("Docker Compose", "PASS", "docker-compose.yml present")

            # Check for security improvements in compose file
            with open(compose_file, 'r') as f:
                compose_content = f.read()

            # Check if databases are bound securely
            security_checks = [
                ("127.0.0.1:5432", "PostgreSQL bound to localhost"),
                ("127.0.0.1:6379", "Redis bound to localhost"),
            ]

            for check_pattern, success_msg in security_checks:
                if check_pattern in compose_content:
                    self.log_validation("Network Security", "PASS", success_msg)
                else:
                    self.log_validation(
                        "Network Security",
                        "WARN",
                        f"Database may not be bound securely: {success_msg}",
                    )
        else:
            self.log_validation(
                "Docker Compose", "FAIL", "docker-compose.yml missing", critical=True
            )
            infra_valid = False

        # Check for required directories
        required_dirs = ["apps", "packages", "core", "agents", "services"]
        for req_dir in required_dirs:
            if (self.base_path / req_dir).exists():
                self.log_validation("Directory Structure", "PASS", f"{req_dir}/ directory present")
            else:
                self.log_validation("Directory Structure", "WARN", f"{req_dir}/ directory missing")

        return infra_valid

    def validate_application_readiness(self) -> bool:
        """Validate applications are ready for deployment"""
        print("📱 Validating Application Readiness...")

        apps_ready = True

        # Check package.json files
        package_files = list(self.base_path.rglob("package.json"))
        if package_files:
            self.log_validation(
                "Package Configuration", "PASS", f"Found {len(package_files)} package.json files"
            )
        else:
            self.log_validation("Package Configuration", "WARN", "No package.json files found")

        # Check for build artifacts
        if (self.base_path / "build").exists():
            self.log_validation("Build Artifacts", "PASS", "Build directory present")
        else:
            self.log_validation("Build Artifacts", "WARN", "No build directory found")

        # Check for deployment configurations
        deploy_configs = ["Makefile", "DEPLOY.md", "RUNBOOK.md"]
        for config in deploy_configs:
            if (self.base_path / config).exists():
                self.log_validation("Deployment Config", "PASS", f"{config} present")
            else:
                self.log_validation("Deployment Config", "WARN", f"{config} missing")

        return apps_ready

    def check_critical_security_issues(self) -> bool:
        """Check for any remaining critical security issues"""
        print("🚨 Checking Critical Security Issues...")

        # Load latest security report
        security_report_file = self.base_path / "local_security_audit_report.json"
        if security_report_file.exists():
            try:
                with open(security_report_file, 'r') as f:
                    security_report = json.load(f)

                critical_count = 0
                high_count = 0

                for finding in security_report.get("findings", []):
                    severity = finding.get("severity", "").lower()
                    if severity == "critical":
                        critical_count += 1
                    elif severity == "high":
                        high_count += 1

                if critical_count > 0:
                    self.log_validation(
                        "Critical Security Issues",
                        "FAIL",
                        f"{critical_count} critical security issues remain",
                        critical=True,
                    )
                    return False
                else:
                    self.log_validation(
                        "Critical Security Issues", "PASS", "No critical security issues found"
                    )

                if high_count > 0:
                    self.log_validation(
                        "High Priority Security",
                        "WARN",
                        f"{high_count} high priority security issues remain",
                    )
                else:
                    self.log_validation(
                        "High Priority Security", "PASS", "No high priority security issues found"
                    )

                return True

            except Exception as e:
                self.log_validation(
                    "Security Report",
                    "FAIL",
                    f"Cannot read security report: {str(e)}",
                    critical=True,
                )
                return False
        else:
            self.log_validation("Security Report", "WARN", "No security audit report found")
            return True

    def validate_service_health(self) -> bool:
        """Validate service health and connectivity"""
        print("🏥 Validating Service Health...")

        # Try to ping common services (won't fail if not running, just inform)
        services = [
            ("PostgreSQL", "localhost", 5432),
            ("Redis", "localhost", 6379),
            ("Core API", "localhost", 8000),
            ("NovaOS Console", "localhost", 3000),
            ("Black Rose Collective", "localhost", 3001),
            ("GypsyCove", "localhost", 3002),
        ]

        for service_name, host, port in services:
            try:
                import socket

                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(2)
                result = sock.connect_ex((host, port))
                sock.close()

                if result == 0:
                    self.log_validation(
                        f"Service: {service_name}", "PASS", f"Service running on {host}:{port}"
                    )
                else:
                    self.log_validation(
                        f"Service: {service_name}",
                        "INFO",
                        f"Service not running on {host}:{port} (expected for pre-deployment)",
                    )
            except Exception as e:
                self.log_validation(
                    f"Service: {service_name}", "INFO", f"Cannot check {host}:{port}: {str(e)}"
                )

        return True  # Service health checks are informational pre-deployment

    def generate_launch_report(self) -> Dict:
        """Generate comprehensive launch readiness report"""
        print("📊 Generating Launch Readiness Report...")

        # Count validation results
        total_checks = len(self.validation_results)
        passed_checks = len([r for r in self.validation_results if r["status"] == "PASS"])
        failed_checks = len([r for r in self.validation_results if r["status"] == "FAIL"])
        warning_checks = len([r for r in self.validation_results if r["status"] == "WARN"])
        critical_failures = len(
            [r for r in self.validation_results if r["status"] == "FAIL" and r["critical"]]
        )

        # Determine launch readiness
        launch_ready = critical_failures == 0

        self.launch_status.update(
            {
                "validation_passed": failed_checks == 0,
                "ready_for_launch": launch_ready,
                "total_checks": total_checks,
                "passed_checks": passed_checks,
                "failed_checks": failed_checks,
                "warning_checks": warning_checks,
                "critical_failures": critical_failures,
                "validation_results": self.validation_results,
            }
        )

        # Save report
        report_file = self.base_path / "launch_readiness_report.json"
        with open(report_file, 'w') as f:
            json.dump(self.launch_status, f, indent=2)

        return self.launch_status

    def run_full_validation(self) -> bool:
        """Run complete launch readiness validation"""
        print("🚀 NOVAOS FINAL LAUNCH VALIDATION")
        print("=" * 60)

        validation_steps = [
            ("Launch Phases", self.validate_launch_phases),
            ("Security Configuration", self.validate_security_configuration),
            ("Infrastructure Config", self.validate_infrastructure_config),
            ("Application Readiness", self.validate_application_readiness),
            ("Critical Security Issues", self.check_critical_security_issues),
            ("Service Health", self.validate_service_health),
        ]

        all_passed = True

        for step_name, validation_func in validation_steps:
            print(f"\n🔍 {step_name}...")
            try:
                result = validation_func()
                if not result:
                    all_passed = False
            except Exception as e:
                self.log_validation(step_name, "FAIL", f"Validation error: {str(e)}", critical=True)
                all_passed = False

        # Generate final report
        report = self.generate_launch_report()

        print("\n" + "=" * 60)
        print("🎯 LAUNCH READINESS SUMMARY")
        print("=" * 60)
        print(f"✅ Passed: {report['passed_checks']}")
        print(f"🟡 Warnings: {report['warning_checks']}")
        print(f"🔴 Failed: {report['failed_checks']}")
        print(f"🚨 Critical: {report['critical_failures']}")
        print(f"📊 Total Checks: {report['total_checks']}")

        if report['ready_for_launch']:
            print("\n🎉 LAUNCH STATUS: READY TO GO! 🚀")
            print("All critical issues resolved. NovaOS is ready for production deployment.")
        else:
            print("\n⚠️  LAUNCH STATUS: CRITICAL ISSUES FOUND")
            print(
                f"❌ {report['critical_failures']} critical issues must be resolved before launch"
            )
            if report['critical_issues']:
                print("\nCritical Issues:")
                for issue in report['critical_issues']:
                    print(f"  • {issue}")

        if report['warnings']:
            print(f"\n🟡 {len(report['warnings'])} warnings to review:")
            for warning in report['warnings']:
                print(f"  • {warning}")

        print(f"\n📋 Detailed report saved to: launch_readiness_report.json")
        print("=" * 60)

        return report['ready_for_launch']


def main():
    """Execute launch validation"""
    validator = NovaOSLaunchValidator()

    try:
        launch_ready = validator.run_full_validation()

        if launch_ready:
            print("\n🚀 NovaOS is ready for launch! Proceed to deployment phase.")
            return 0
        else:
            print("\n🚨 Critical issues must be resolved before launch.")
            return 1

    except Exception as e:
        print(f"\n❌ Launch validation failed with error: {str(e)}")
        return 1


if __name__ == "__main__":
    exit(main())
