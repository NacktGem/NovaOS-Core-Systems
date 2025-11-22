#!/bin/bash
# NovaOS Repository Cleanup Script - SAFE VERSION
# Only removes clearly temporary development artifacts

echo "🧹 Safe cleanup of NovaOS repository..."

# Create backup directory first
mkdir -p ".cleanup_backup/$(date +%Y%m%d_%H%M%S)"
BACKUP_DIR=".cleanup_backup/$(date +%Y%m%d_%H%M%S)"

echo "📦 Creating backup in $BACKUP_DIR"

# SAFE TO REMOVE - Only clearly temporary files
SAFE_TO_REMOVE=(
    # Test result files (JSON outputs from test runs)
    "agent_validation_results.json"
    "audit_system_test_results.json"
    "rbac_validation_results.json"
    "enhanced_launch_readiness_report.json"
    "final_launch_readiness_report.json"
    "launch_readiness_report.json"
    "critical_fixes_report.json"
    "local_security_audit_report.json"
    "security_hardening_report.json"
    "security_audit_report_20250919_225626.json"
    "NovaOS_Audit_Results.json"

    # Temporary/backup files
    "temp_tokens.txt"
    "emergency_auth_config.json"
    "docker-compose.yml.backup"
    ".gitignore.bak"
    ".gitignore.tmp"

    # One-off test scripts (not core functionality)
    "test_redis_namespace_simple.py"
    "redis_namespace_demo.py"
    "check_infrastructure.py"
)

# Function to safely remove files
cleanup_safe_files() {
    echo "🗂️  Processing safe-to-remove files..."

    for file in "${SAFE_TO_REMOVE[@]}"; do
        if [ -f "$file" ]; then
            echo "  Moving $file to backup..."
            cp "$file" "$BACKUP_DIR/"
            rm "$file"
        fi
    done
}

# Run safe cleanup
cleanup_safe_files

# Clean up Python cache (always safe)
echo "🐍 Cleaning Python cache..."
find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name "*.pyc" -delete 2>/dev/null || true

echo ""
echo "✅ Safe repository cleanup completed!"
echo "📦 Backup created in: $BACKUP_DIR"
echo ""
echo "KEPT (Essential files):"
echo "  • All documentation (.md files)"
echo "  • All application code (apps/, agents/, services/)"
echo "  • All configuration files (.env, docker-compose.yml, etc.)"
echo "  • DigitalOcean deployment files (do-appspec-*.yaml)"
echo "  • Production deployment scripts"
echo "  • All package management files"
echo ""
echo "REMOVED (Only temporary artifacts):"
echo "  • Test result JSON files"
echo "  • Backup/temporary files (.bak, .tmp, etc.)"
echo "  • One-off demo scripts"
echo "  • Python cache files"
echo ""
echo "🚀 Ready for clean local testing!"
