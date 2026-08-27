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

install -o root -g root -m 0644 "$SOURCE_CONFIG" "$NGINX_CONFIG"
ln -sfn "$NGINX_CONFIG" "$NGINX_ENABLED"

nginx -t
systemctl reload nginx

echo "Nginx is serving talemistry.com and proxying to Next.js on port 3000."
