#!/usr/bin/env bash
set -euo pipefail

APP_PATH="${1:-$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)}"
BACKEND_PATH="$APP_PATH/backend"
PM2_BIN="${PM2_BIN:-$(command -v pm2)}"
export PM2_HOME="${PM2_HOME:-$HOME/.pm2}"
SKIP_FRONTEND_RESTART="${2:-}"

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

SUDO=""
if command -v sudo >/dev/null 2>&1 && sudo -n true >/dev/null 2>&1; then
  SUDO="sudo -n"
fi

FREE_PORTS_SCRIPT="$APP_PATH/scripts/free-app-ports.sh"

# Scoped sudoers rule (see scripts/setup-runner-sudo.sh) lets the runner free
# ports held by another user even without general sudo rights.
can_sudo_free_ports() {
  command -v sudo >/dev/null 2>&1 \
    && sudo -n -l /bin/bash "$FREE_PORTS_SCRIPT" >/dev/null 2>&1
}

# A stale PM2 daemon under another user (e.g. root) can keep old apps bound to
# our ports; remove them there before starting under the runner's PM2_HOME.
if [ -n "$SUDO" ] && [ -d /root/.pm2 ]; then
  for stale_app in talemistry-web TALEMISTRY EVRYKA; do
    $SUDO env PM2_HOME=/root/.pm2 "$PM2_BIN" delete "$stale_app" >/dev/null 2>&1 || true
  done
fi

port_busy() {
  bash -c ">/dev/tcp/127.0.0.1/$1" 2>/dev/null
}

port_pids() {
  # || true guards keep set -e/pipefail from killing the script when no match.
  { $SUDO ss -ltnp "sport = :$1" 2>/dev/null || ss -ltnp "sport = :$1" 2>/dev/null || true; } \
    | { grep -oE 'pid=[0-9]+' || true; } | cut -d= -f2 | sort -u
}

# After PM2 cleanup, anything still on the port is a rogue/stale process that
# would crash the new app with EADDRINUSE. Terminate it.
free_port() {
  local port="$1"
  if ! port_busy "$port"; then
    return 0
  fi
  echo "Port ${port} is still occupied after PM2 cleanup; terminating the listener"
  local pids
  pids="$(port_pids "$port")"
  if [ -z "$pids" ] && can_sudo_free_ports; then
    sudo -n /bin/bash "$FREE_PORTS_SCRIPT" || true
  fi
  for pid in $pids; do
    $SUDO kill "$pid" 2>/dev/null || kill "$pid" 2>/dev/null || true
  done
  sleep 2
  if port_busy "$port"; then
    pids="$(port_pids "$port")"
    for pid in $pids; do
      $SUDO kill -9 "$pid" 2>/dev/null || kill -9 "$pid" 2>/dev/null || true
    done
    sleep 1
  fi
  if port_busy "$port"; then
    echo "Unable to free port ${port}; current listener:"
    $SUDO ss -ltnp "sport = :${port}" 2>/dev/null || ss -ltnp "sport = :${port}" 2>/dev/null || true
    echo
    echo "The listener belongs to another user and the runner lacks permission to stop it."
    echo "Run ONCE on the server as root to fix this permanently:"
    echo "  sudo fuser -k ${port}/tcp"
    echo "  sudo bash $APP_PATH/scripts/setup-runner-sudo.sh $(whoami) $APP_PATH"
    exit 1
  fi
}

if [[ "$SKIP_FRONTEND_RESTART" != "--skip-frontend" ]]; then
  pm2_cmd stop talemistry-web || true
  pm2_cmd delete talemistry-web || true
  free_port 3000
  pm2_cmd start "$APP_PATH/ecosystem.config.js" --only talemistry-web --update-env
fi

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

  if [[ "$SKIP_FRONTEND_RESTART" == "--skip-frontend" ]] \
    || curl --fail --silent --show-error http://127.0.0.1:3000 >/dev/null 2>&1; then
    frontend_ready=true
  fi

  if bash -c '>/dev/tcp/127.0.0.1/4000' 2>/dev/null; then
    backend_ready=true
  fi

  if [[ "$frontend_ready" == true && "$backend_ready" == true ]] \
    && ([[ "$SKIP_FRONTEND_RESTART" == "--skip-frontend" ]] \
      || pm2_cmd describe talemistry-web | grep -q "status.*online") \
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
