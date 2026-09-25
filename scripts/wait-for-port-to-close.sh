#!/usr/bin/env bash
set -euo pipefail

PORT="${1:?Port is required}"
TIMEOUT_SECONDS="${2:-30}"

port_is_open() {
  node -e "
    const net = require('net');
    const port = Number(process.argv[1]);
    const socket = net.connect({ host: '127.0.0.1', port });
    const exitClosed = () => process.exit(1);

    socket.setTimeout(500);
    socket.on('connect', () => {
      socket.end();
      process.exit(0);
    });
    socket.on('error', exitClosed);
    socket.on('timeout', () => {
      socket.destroy();
      exitClosed();
    });
  " "$PORT"
}

for ((attempt = 0; attempt < TIMEOUT_SECONDS; attempt++)); do
  if ! port_is_open; then
    exit 0
  fi

  sleep 1
done

echo "Port ${PORT} is still accepting connections after ${TIMEOUT_SECONDS}s" >&2
exit 1
