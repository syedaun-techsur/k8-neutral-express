#!/usr/bin/env bash
# Idempotent, detached UAT app launcher (written by verify-express). Re-run after
# any code fix to (re)start the app — it frees the port first.
set -u
PORT="${UAT_PORT:-3000}"
BS="${BUILD_SYSTEM:-}"
LOG=/tmp/pivota-uat-app.log
# Free the port + any prior dev/start server so re-runs are clean.
fuser -k "${PORT}/tcp" 2>/dev/null || true
pkill -f 'next (dev|start)' 2>/dev/null || true
sleep 1
if [ "$BS" = "docker-compose" ] || ls docker-compose.y*ml compose.y*ml >/dev/null 2>&1; then
  docker-compose up -d
  echo "[uat] docker-compose up -d"
  exit 0
fi
if [ ! -f package.json ]; then
  echo "[uat] no compose file or package.json found — start the app manually" >&2
  exit 1
fi
# Run UAT against the PRODUCTION build, NOT `next dev`: next dev's Watchpack hits
# EMFILE on the inotify-constrained K8s sandbox (shared per-uid inotify pool) and
# the app never serves in time. The build already passed in Step 4, so prefer a
# production start (npm start / next start, no file watcher); fall back to a
# polling dev server (no inotify) if there is no start script.
if grep -qE '"start"[[:space:]]*:' package.json 2>/dev/null; then
  RUN_CMD='npm start'
else
  RUN_CMD='WATCHPACK_POLLING=true npm run dev'
fi
setsid bash -c "$RUN_CMD" > "$LOG" 2>&1 < /dev/null &
echo "$!" > /tmp/pivota-uat-app.pid
echo "[uat] launched detached on :${PORT} (log: $LOG)"
