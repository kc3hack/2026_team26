#!/bin/sh
set -e

# This script runs during container init (only when DB is initialized).
# It moves supplied certs into PGDATA so Postgres starts with SSL enabled.

if [ -f /tmp/server.crt ] && [ -f /tmp/server.key ]; then
  echo "Installing SSL certs into $PGDATA"
  mv /tmp/server.crt "$PGDATA/server.crt"
  mv /tmp/server.key "$PGDATA/server.key"
  chown postgres:postgres "$PGDATA/server.crt" "$PGDATA/server.key"
  chmod 600 "$PGDATA/server.key"
else
  echo "No SSL certs provided; skipping SSL setup"
fi
