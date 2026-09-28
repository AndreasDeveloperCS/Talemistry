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

# Root's PATH often lacks pm2 when it was installed via nvm/npm for a user.
find_pm2() {
  command -v pm2 2>/dev/null && return 0
  local candidate
  for candidate in /usr/local/bin/pm2 /usr/bin/pm2 \
    /home/*/.nvm/versions/node/*/bin/pm2 /home/*/.npm-global/bin/pm2; do
    if [[ -x "$candidate" ]]; then
      echo "$candidate"
      return 0
    fi
  done
  return 1
}

PM2_BIN="$(find_pm2 || true)"
RUNNER_HOME=""
if [[ -n "${SUDO_USER:-}" ]]; then
  RUNNER_HOME="$(getent passwd "$SUDO_USER" | cut -d: -f6)"
fi

# Delete the apps from EVERY PM2 daemon on the box (root or any other user),
# otherwise a foreign daemon resurrects the listener right after we kill it.
# The invoking runner's own daemon is skipped: the deploy scripts manage it.
if [[ -n "$PM2_BIN" ]]; then
  for pm2_home in /root/.pm2 /home/*/.pm2; do
    [[ -d "$pm2_home" ]] || continue
    if [[ -n "$RUNNER_HOME" && "$pm2_home" == "$RUNNER_HOME/.pm2" ]]; then
      continue
    fi
    # Only talk to live daemons: a pm2 CLI call with no daemon would spawn a
    # new root-owned daemon and, for user homes, corrupt their permissions.
    if [[ ! -S "$pm2_home/rpc.sock" ]]; then
      continue
    fi
    for app in talemistry-web TALEMISTRY EVRYKA; do
      PM2_HOME="$pm2_home" "$PM2_BIN" delete "$app" >/dev/null 2>&1 || true
    done
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
