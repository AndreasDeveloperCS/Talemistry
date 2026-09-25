#!/usr/bin/env bash
# Run as root (via the scoped sudoers rule installed by setup-runner-sudo.sh)
# to free the Talemistry app ports before PM2 starts fresh processes.
# Kills stale/orphaned listeners on the app ports and removes leftover apps
# from a root-owned PM2 daemon if one exists.
set -uo pipefail

PORTS="3000 4000"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "free-app-ports.sh must run as root"
  exit 1
fi

if command -v pm2 >/dev/null 2>&1 && [ -d /root/.pm2 ]; then
  for app in talemistry-web TALEMISTRY EVRYKA; do
    PM2_HOME=/root/.pm2 pm2 delete "$app" >/dev/null 2>&1 || true
  done
fi

for port in $PORTS; do
  if bash -c ">/dev/tcp/127.0.0.1/${port}" 2>/dev/null; then
    echo "Killing listener(s) on port ${port}:"
    ss -ltnp "sport = :${port}" || true
    # psmisc fuser -k sends SIGKILL by default
    fuser -k "${port}/tcp" || true
    sleep 1
  fi
done

for port in $PORTS; do
  if bash -c ">/dev/tcp/127.0.0.1/${port}" 2>/dev/null; then
    echo "Port ${port} is still occupied"
    exit 1
  fi
done

echo "App ports are free"
