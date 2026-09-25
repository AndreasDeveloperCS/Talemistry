#!/usr/bin/env bash
# One-time server setup: allow the GitHub Actions runner user to install and
# reload the Talemistry Nginx config without a password.
#
# Run as root on the deploy server:
#   sudo bash scripts/setup-runner-sudo.sh <runner-user> [app-path]
#
# It writes /etc/sudoers.d/talemistry-deploy with a NOPASSWD rule that is
# limited to running scripts/install-nginx-config.sh as root.
set -euo pipefail

RUNNER_USER="${1:-}"
APP_PATH="${2:-/var/www/talemistry}"
SUDOERS_FILE="/etc/sudoers.d/talemistry-deploy"
INSTALL_SCRIPT="$APP_PATH/scripts/install-nginx-config.sh"
FREE_PORTS_SCRIPT="$APP_PATH/scripts/free-app-ports.sh"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run this script as root (sudo)."
  exit 1
fi

if [[ -z "$RUNNER_USER" ]]; then
  echo "Usage: sudo bash $0 <runner-user> [app-path]"
  echo "Hint: the runner user is printed by the 'Show environment' step of the deploy workflow."
  exit 1
fi

if ! id "$RUNNER_USER" >/dev/null 2>&1; then
  echo "User does not exist: $RUNNER_USER"
  exit 1
fi

RULE="$RUNNER_USER ALL=(root) NOPASSWD: /bin/bash $INSTALL_SCRIPT $APP_PATH, /bin/bash $FREE_PORTS_SCRIPT"

TMP_FILE="$(mktemp)"
trap 'rm -f "$TMP_FILE"' EXIT
printf '%s\n' "$RULE" > "$TMP_FILE"

# Validate before installing so a typo can never break sudo for the whole host.
visudo -cf "$TMP_FILE"
install -o root -g root -m 0440 "$TMP_FILE" "$SUDOERS_FILE"

echo "Installed $SUDOERS_FILE:"
cat "$SUDOERS_FILE"
echo
echo "Verify as the runner user with:"
echo "  sudo -u $RUNNER_USER sudo -n -l /bin/bash $INSTALL_SCRIPT $APP_PATH"
echo "  sudo -u $RUNNER_USER sudo -n -l /bin/bash $FREE_PORTS_SCRIPT"
