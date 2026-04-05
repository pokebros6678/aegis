#!/usr/bin/env bash
# AEGIS — start the Next.js server (production-style).
# Usage:
#   chmod +x scripts/start-server.sh
#   ./scripts/start-server.sh
#
# Optional environment:
#   SKIP_BUILD=1     — skip `next build` if .next already exists
#   SKIP_MIGRATE=1   — skip `prisma migrate deploy`
#   FRESH_INSTALL=1  — run `npm ci` even when node_modules exists
#   PORT=3000        — listen port (Next.js default 3000)
#   HOST=0.0.0.0     — bind address (default 0.0.0.0 for LAN/VPS)
#   NODE_ENV=production — set automatically if unset
#
# Requires a populated .env (see .env.example): DATABASE_URL, AUTH_SECRET, tiered passwords.
# For HTTPS / correct auth callbacks in production, set AUTH_URL (e.g. https://aegis.example.com).

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

export NODE_ENV="${NODE_ENV:-production}"
export PORT="${PORT:-3000}"
HOST="${HOST:-0.0.0.0}"

if [[ ! -f .env ]]; then
  echo "start-server: error: .env not found in $ROOT" >&2
  echo "  Copy .env.example to .env and set DATABASE_URL, AUTH_SECRET, AEGIS_ADMIN_PASSWORD, AEGIS_MEMBER_PASSWORD." >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "start-server: error: npm not found in PATH" >&2
  exit 1
fi

if [[ ! -d node_modules ]]; then
  echo "start-server: installing dependencies (npm ci)..."
  npm ci
else
  echo "start-server: using existing node_modules (set FRESH_INSTALL=1 to run npm ci first)."
  if [[ "${FRESH_INSTALL:-0}" == "1" ]]; then
    npm ci
  fi
fi

echo "start-server: prisma generate..."
npx prisma generate

if [[ "${SKIP_MIGRATE:-0}" != "1" ]]; then
  echo "start-server: prisma migrate deploy..."
  npx prisma migrate deploy
else
  echo "start-server: skipping prisma migrate deploy (SKIP_MIGRATE=1)."
fi

if [[ "${SKIP_BUILD:-0}" == "1" && -d .next ]]; then
  echo "start-server: skipping next build (SKIP_BUILD=1 and .next exists)."
else
  echo "start-server: next build..."
  npm run build
fi

echo "start-server: listening on http://${HOST}:${PORT} (NODE_ENV=$NODE_ENV)"
exec npm run start -- -H "${HOST}" -p "${PORT}"
