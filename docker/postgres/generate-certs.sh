#!/bin/sh
set -e

# Generates a self-signed cert/key pair for local Postgres SSL testing.
# Output files: server.key, server.crt (placed in this directory).

CN=${1:-localhost}
openssl req -new -newkey rsa:2048 -days 365 -nodes -x509 \
  -subj "/CN=$CN" \
  -keyout server.key -out server.crt

chmod 600 server.key
echo "Generated server.key and server.crt (CN=$CN)"
