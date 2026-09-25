#!/usr/bin/env bash
set -euo pipefail

APP_PATH="${1:-$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)}"
BACKEND_PATH="$APP_PATH/backend"
PM2_BIN="${PM2_BIN:-$(command -v pm2)}"
export PM2_HOME="${PM2_HOME:-$HOME/.pm2}"

if [[ ! -f "$APP_PATH/.next/BUILD_ID" ]]; then
  echo "Next.js build not found at $APP_PATH/.next/BUILD_ID"
  exit 1
fi

if [[ ! -f "$BACKEND_PATH/dist/main.js" ]]; then
  echo "NestJS build not found at $BACKEND_PATH/dist/main.js"
  exit 1
fi

pm2_cmd() {
  "$PM2_BIN" "$@"
}

# After PM2 cleanup, anything still on the port is a rogue/stale process that
# would crash the new app with EADDRINUSE. Terminate it.
free_port() {
  local port="$1"
  if ! bash -c ">/dev/tcp/127.0.0.1/${port}" 2>/dev/null; then
    return 0
  fi
  echo "Port ${port} is still occupied after PM2 cleanup; terminating the listener"
  if command -v sudo >/dev/null 2>&1 && sudo -n true >/dev/null 2>&1; then
    sudo -n fuser -k "${port}/tcp" || true
  else
    fuser -k "${port}/tcp" 2>/dev/null || true
  fi
  sleep 2
  if bash -c ">/dev/tcp/127.0.0.1/${port}" 2>/dev/null; then
    echo "Unable to free port ${port}; the process may belong to another user"
    ss -ltnp "sport = :${port}" 2>/dev/null || true
    exit 1
  fi
}

pm2_cmd stop talemistry-web || true
pm2_cmd delete talemistry-web || true
free_port 3000
pm2_cmd start "$APP_PATH/ecosystem.config.js" --only talemistry-web --update-env

pm2_cmd stop TALEMISTRY || true
pm2_cmd delete TALEMISTRY || true
free_port 4000
# Flush old logs so failure diagnostics below show only the current boot.
pm2_cmd flush || true
pm2_cmd start "$BACKEND_PATH/ecosystem.config.js" --only TALEMISTRY --update-env
pm2_cmd save

for attempt in {1..40}; do
  frontend_ready=false
  backend_ready=false

  if curl --fail --silent --show-error http://127.0.0.1:3000 >/dev/null 2>&1; then
    frontend_ready=true
  fi

  if bash -c '>/dev/tcp/127.0.0.1/4000' 2>/dev/null; then
    backend_ready=true
  fi

  if [[ "$frontend_ready" == true && "$backend_ready" == true ]] \
    && pm2_cmd describe talemistry-web | grep -q "status.*online" \
    && pm2_cmd describe TALEMISTRY | grep -q "status.*online"; then
    echo "Next.js is running on localhost:3000"
    echo "NestJS is running on localhost:4000"
    pm2_cmd list
    exit 0
  fi

  sleep 3
done

echo "Production applications failed readiness checks"
pm2_cmd describe talemistry-web || true
pm2_cmd describe TALEMISTRY || true
pm2_cmd logs talemistry-web --lines 80 --nostream || true
pm2_cmd logs TALEMISTRY --lines 80 --nostream || true
exit 1
