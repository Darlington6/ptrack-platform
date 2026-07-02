#!/bin/sh
set -e

# Auto-sync node_modules when package-lock.json changes.
# Stores a hash of the lockfile inside node_modules so we detect drift
# on restart without needing to rebuild the image or delete the volume.
LOCK_HASH=$(sha256sum package-lock.json | cut -d' ' -f1)
INSTALLED_HASH=$(cat node_modules/.lock-hash 2>/dev/null || echo "")

if [ "$LOCK_HASH" != "$INSTALLED_HASH" ]; then
  echo "[dev] package-lock.json changed — running npm ci..."
  npm ci
  echo "$LOCK_HASH" > node_modules/.lock-hash
fi

exec npm run dev -- --host 0.0.0.0