#!/usr/bin/env bash
set -euo pipefail

APP_PATH="${1:-$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)}"
SOURCE_CONFIG="$APP_PATH/nginx/talemistry.com.conf"
NGINX_CONFIG="/etc/nginx/sites-available/talemistry.com.conf"
NGINX_ENABLED="/etc/nginx/sites-enabled/talemistry.com.conf"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run this script as root so it can install and reload Nginx."
  exit 1
fi

if [[ ! -f "$SOURCE_CONFIG" ]]; then
  echo "Nginx source config not found: $SOURCE_CONFIG"
  exit 1
fi

# Clear stale listeners on the app ports that do not belong to the deploy
# user (e.g. a root-owned orphan next-server from an old npm-wrapped PM2 app).
# Fresh apps run as the invoking (sudo) user and are left untouched.
RUNNER_USER="${SUDO_USER:-}"
for port in 3000 4000; do
  for pass in 1 2; do
    mapfile -t pids < <(ss -ltnp "sport = :${port}" 2>/dev/null | grep -oE 'pid=[0-9]+' | cut -d= -f2 | sort -u)
    stale_found=0
    for pid in "${pids[@]:-}"; do
      [[ -n "$pid" ]] || continue
      owner="$(ps -o user= -p "$pid" 2>/dev/null | tr -d ' ')"
      if [[ -n "$owner" && "$owner" != "$RUNNER_USER" ]]; then
        stale_found=1
        echo "Killing stale listener on port ${port}: pid ${pid} (user ${owner})"
        kill "$pid" 2>/dev/null || true
        sleep 1
        kill -9 "$pid" 2>/dev/null || true
      fi
    done
    if [[ "$pass" == "1" && "$stale_found" == "1" ]]; then
      # A leftover root PM2 daemon would immediately resurrect the process.
      if pgrep -u root -f 'PM2 v' >/dev/null 2>&1; then
        echo "Stopping leftover root PM2 daemon so it cannot resurrect stale apps"
        pkill -u root -f 'PM2 v' || true
      fi
      sleep 1
      continue
    fi
    break
  done
done

install -o root -g root -m 0644 "$SOURCE_CONFIG" "$NGINX_CONFIG"
ln -sfn "$NGINX_CONFIG" "$NGINX_ENABLED"

nginx -t
systemctl reload nginx

echo "Nginx is serving talemistry.com and proxying to Next.js on port 3000."
