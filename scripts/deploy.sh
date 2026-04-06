#!/usr/bin/env bash
# One-command deploy on the VM (after git remote is set up).
#
# Usage (from anywhere):
#   ~/aegis/scripts/deploy.sh
# or:
#   cd ~/aegis && npm run deploy
#
# Environment (optional):
#   DEPLOY_BRANCH=main           — git branch to pull (default: main)
#   SKIP_DEPLOY_PULL=1           — skip git pull (only build + optional restart)
#   SKIP_DEPLOY_INSTALL=1        — skip npm ci (faster if deps unchanged)
#   AEGIS_RESTART_CMD="sudo systemctl restart aegis-next" — run after a successful build
#
# Requires: .env with DATABASE_URL (Postgres must be up for prisma migrate during build).
# For pull: store GitHub credentials (SSH key, or gh auth, or cached HTTPS).

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

BRANCH="${DEPLOY_BRANCH:-main}"

echo "deploy: repo root = $ROOT"

if [[ ! -f .env ]]; then
  echo "deploy: error: .env missing in $ROOT" >&2
  exit 1
fi

if [[ "${SKIP_DEPLOY_PULL:-0}" != "1" ]]; then
  echo "deploy: git pull origin $BRANCH (ff-only)..."
  git fetch origin "$BRANCH"
  git pull --ff-only origin "$BRANCH"
else
  echo "deploy: skipping git pull (SKIP_DEPLOY_PULL=1)."
fi

if [[ "${SKIP_DEPLOY_INSTALL:-0}" != "1" ]]; then
  echo "deploy: npm ci..."
  npm ci
else
  echo "deploy: skipping npm ci (SKIP_DEPLOY_INSTALL=1)."
fi

echo "deploy: npm run build (Prisma validate, generate, migrate deploy, then next build)..."
npm run build

echo "deploy: build finished OK."

if [[ -n "${AEGIS_RESTART_CMD:-}" ]]; then
  echo "deploy: running AEGIS_RESTART_CMD..."
  eval "$AEGIS_RESTART_CMD"
  echo "deploy: restart command completed."
else
  echo ""
  echo "deploy: Restart the Node process so users get the new build, e.g.:"
  echo "    sudo systemctl restart aegis-next"
  echo "  or stop the old \`npm run start\` terminal and run: cd ~/aegis && npm run start"
fi
