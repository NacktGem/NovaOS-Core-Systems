#!/usr/bin/env bash
set -euo pipefail
mkdir -p backups
TS=$(date +"%Y%m%d-%H%M%S")
# create archive; ignore missing dirs
 tar czf "backups/backup-$TS.tgz" logs artifacts 2>/dev/null || true
# remove older backups beyond last 7
ls -1t backups/backup-*.tgz | tail -n +8 | xargs -r rm --
