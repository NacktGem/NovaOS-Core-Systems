#!/bin/bash
# Honeypot lure script - deploys various honeypot traps

set -euo pipefail

GLITCH_DIR="/tmp/glitch"
HONEYPOT_DIR="$GLITCH_DIR/honeypots"
TRAP_ID="trap_$(date +%s)"

# Create directories
mkdir -p "$HONEYPOT_DIR"

echo "[HONEYPOT] Deploying stealth traps - ID: $TRAP_ID"

# Deploy filesystem honeypots
deploy_filesystem_traps() {
    echo "[HONEYPOT] Deploying filesystem traps..."
    
    # Fake SSH keys
    cat > "$HONEYPOT_DIR/${TRAP_ID}_id_rsa" << 'EOF'
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAFwAAAAdzc2gtcn
NhAAAAAwEAAQAAAQEAyWkKzKhJRvgEfCcHqrHh7CfUuNKKJoKC8rA5kF2QcGgJVXmPtLwM
nRzX8T1eJ9l3kF2Qc2VnbXNzaC1yc2EAAAADAQABAAABAQDJaQrMqElG+AR8JweqseHs
J9S40oomioDyszmQXZBwaBVZea+0vAydHNfxPV4n2XeQXZBzVWdtc3NoLXJzYQAAAAMB
AAEAAAEAQm7qGVxKE2jQgBAWx3YwYaZJ8F2Qc2VnbXNzaC1yc2EAAAADAQABAAABAQCw
...truncated for security...
-----END OPENSSH PRIVATE KEY-----
EOF
    
    # Fake credentials file
    cat > "$HONEYPOT_DIR/${TRAP_ID}_credentials.txt" << 'EOF'
# Production Database Credentials - DO NOT SHARE
DATABASE_HOST=prod-db.internal.company.com
DATABASE_USER=admin
DATABASE_PASS=Pr0d_P@ssw0rd_2024!

# API Keys
STRIPE_SECRET_KEY=sk_live_abcdef1234567890
AWS_ACCESS_KEY=AKIA1234567890ABCDEF
AWS_SECRET_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

# Service Accounts
SERVICE_USER=svc_backup
SERVICE_PASS=B@ckup_S3rv1c3_2024
EOF
    
    # Fake config file
    cat > "$HONEYPOT_DIR/${TRAP_ID}_app.conf" << 'EOF'
[database]
host = localhost
port = 5432
username = root
password = password123

[security]
secret_key = sk_test_51234567890abcdef
jwt_secret = my_super_secret_jwt_key_2024

[admin]
admin_user = admin
admin_pass = admin123
debug_mode = true
EOF
    
    # Set appropriate permissions to make them look real
    chmod 600 "$HONEYPOT_DIR/${TRAP_ID}_id_rsa"
    chmod 644 "$HONEYPOT_DIR/${TRAP_ID}_credentials.txt"
    chmod 644 "$HONEYPOT_DIR/${TRAP_ID}_app.conf"
    
    echo "  ✓ Created fake SSH key: ${TRAP_ID}_id_rsa"
    echo "  ✓ Created fake credentials: ${TRAP_ID}_credentials.txt"
    echo "  ✓ Created fake config: ${TRAP_ID}_app.conf"
}

# Deploy network honeypots  
deploy_network_traps() {
    echo "[HONEYPOT] Deploying network traps..."
    
    # Create fake SSH listener script
    cat > "$HONEYPOT_DIR/${TRAP_ID}_ssh_listener.sh" << EOF
#!/bin/bash
# Fake SSH service listener
LOG_FILE="$HONEYPOT_DIR/${TRAP_ID}_network.log"
FAKE_PORT=2222

echo "\$(date): Network honeypot started on port \$FAKE_PORT" >> "\$LOG_FILE"

while true; do
    echo "\$(date): Connection attempt to fake SSH on port \$FAKE_PORT" >> "\$LOG_FILE"
    echo "SSH-2.0-OpenSSH_8.9p1 Ubuntu-3ubuntu0.1" | nc -l -p \$FAKE_PORT -q 1 2>/dev/null || true
    sleep 1
done
EOF
    
    # Create fake FTP listener
    cat > "$HONEYPOT_DIR/${TRAP_ID}_ftp_listener.sh" << EOF
#!/bin/bash
# Fake FTP service listener
LOG_FILE="$HONEYPOT_DIR/${TRAP_ID}_network.log"
FAKE_PORT=2121

echo "\$(date): FTP honeypot started on port \$FAKE_PORT" >> "\$LOG_FILE"

while true; do
    echo "\$(date): FTP connection attempt on port \$FAKE_PORT" >> "\$LOG_FILE"
    echo "220 Welcome to FTP server" | nc -l -p \$FAKE_PORT -q 1 2>/dev/null || true
    sleep 1
done
EOF
    
    chmod +x "$HONEYPOT_DIR/${TRAP_ID}_ssh_listener.sh"
    chmod +x "$HONEYPOT_DIR/${TRAP_ID}_ftp_listener.sh"
    
    echo "  ✓ Created fake SSH listener script"
    echo "  ✓ Created fake FTP listener script"
}

# Deploy process honeypots
deploy_process_traps() {
    echo "[HONEYPOT] Deploying process traps..."
    
    # Create fake service process
    cat > "$HONEYPOT_DIR/${TRAP_ID}_service.py" << 'EOF'
#!/usr/bin/env python3
import time
import os
import json

LOG_FILE = f"/tmp/glitch/honeypots/{os.environ.get('TRAP_ID', 'unknown')}_process.log"

def log_event(event):
    timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
    with open(LOG_FILE, 'a') as f:
        f.write(f"{timestamp}: {event}\n")

log_event("Fake service process started")

# Simulate a background service
while True:
    # Check if someone is monitoring processes
    try:
        ps_output = os.popen('ps aux | grep python | wc -l').read().strip()
        if int(ps_output) > 10:  # Many Python processes
            log_event("Possible process monitoring detected")
    except:
        pass
    
    time.sleep(60)
EOF
    
    # Create monitoring script
    cat > "$HONEYPOT_DIR/${TRAP_ID}_monitor.sh" << EOF
#!/bin/bash
# Honeypot monitoring script
LOG_FILE="$HONEYPOT_DIR/${TRAP_ID}_access.log"

echo "\$(date): Honeypot monitoring started for $TRAP_ID" >> "\$LOG_FILE"

while true; do
    # Check for file access
    for file in "$HONEYPOT_DIR/${TRAP_ID}_"*; do
        if [ -f "\$file" ] && [ "\$file" -nt "\$LOG_FILE" ]; then
            echo "\$(date): HONEYPOT TRIGGERED - \$file accessed" >> "\$LOG_FILE"
        fi
    done
    
    # Check for network activity on honeypot ports
    if netstat -tuln 2>/dev/null | grep -q ":2222\|:2121"; then
        echo "\$(date): Network honeypot activity detected" >> "\$LOG_FILE"
    fi
    
    sleep 10
done
EOF
    
    chmod +x "$HONEYPOT_DIR/${TRAP_ID}_service.py"
    chmod +x "$HONEYPOT_DIR/${TRAP_ID}_monitor.sh"
    
    echo "  ✓ Created fake service process"
    echo "  ✓ Created monitoring script"
}

# Start monitoring in background
start_monitoring() {
    echo "[HONEYPOT] Starting background monitoring..."
    
    # Start the monitor script in background
    TRAP_ID="$TRAP_ID" "$HONEYPOT_DIR/${TRAP_ID}_monitor.sh" > /dev/null 2>&1 &
    MONITOR_PID=$!
    
    echo "$MONITOR_PID" > "$HONEYPOT_DIR/${TRAP_ID}_monitor.pid"
    echo "  ✓ Monitor started with PID: $MONITOR_PID"
}

# Save trap metadata
save_trap_info() {
    cat > "$HONEYPOT_DIR/${TRAP_ID}_info.json" << EOF
{
    "trap_id": "$TRAP_ID",
    "deployed_at": "$(date -Iseconds)",
    "type": "multi_vector",
    "components": {
        "filesystem": ["id_rsa", "credentials.txt", "app.conf"],
        "network": ["ssh_listener.sh", "ftp_listener.sh"],
        "process": ["service.py", "monitor.sh"]
    },
    "status": "active",
    "monitor_pid": $(cat "$HONEYPOT_DIR/${TRAP_ID}_monitor.pid" 2>/dev/null || echo "null")
}
EOF
    
    echo "  ✓ Trap metadata saved"
}

# Main deployment
main() {
    echo "[HONEYPOT] Starting honeypot deployment..."
    
    deploy_filesystem_traps
    deploy_network_traps  
    deploy_process_traps
    start_monitoring
    save_trap_info
    
    echo
    echo "[HONEYPOT] Deployment complete!"
    echo "  Trap ID: $TRAP_ID"
    echo "  Location: $HONEYPOT_DIR"
    echo "  Components: 7 files deployed"
    echo "  Status: Active monitoring"
    echo
    echo "Honeypot files deployed:"
    ls -la "$HONEYPOT_DIR/${TRAP_ID}_"*
}

# Handle cleanup on exit
cleanup() {
    if [ -f "$HONEYPOT_DIR/${TRAP_ID}_monitor.pid" ]; then
        MONITOR_PID=$(cat "$HONEYPOT_DIR/${TRAP_ID}_monitor.pid")
        if kill -0 "$MONITOR_PID" 2>/dev/null; then
            echo "  Stopping monitor process..."
            kill "$MONITOR_PID" 2>/dev/null || true
        fi
    fi
}

trap cleanup EXIT

# Check if running as standalone script
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi