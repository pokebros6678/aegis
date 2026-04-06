#!/usr/bin/env bash
# Run on the VM. Tunnel "running" still needs Next.js in ~/aegis answering on :3000.
set -euo pipefail
echo "=== 1) Next.js (must run from ~/aegis, not ~) ==="
code=$(curl -sS -o /dev/null -w "%{http_code}" "http://127.0.0.1:3000/login" 2>/dev/null || echo "000")
if echo "$code" | grep -qE '^(200|302|307|308)$'; then
  echo "OK: http://127.0.0.1:3000/login -> HTTP $code"
else
  echo "FAIL: HTTP $code — open a second SSH session and run:"
  echo "       cd ~/aegis && npm run start"
  echo "  (Running npm from ~ alone fails: no package.json there.)"
  exit 1
fi

echo ""
echo "=== 2) cloudflared ==="
if pgrep -a cloudflared >/dev/null 2>&1; then
  echo "OK:"
  pgrep -a cloudflared || true
else
  echo "FAIL: no cloudflared — cd ~/aegis && npm run tunnel"
  exit 1
fi

echo ""
echo "=== 3) Config path reminder ==="
echo "Tunnel should use: cloudflared tunnel --config \$HOME/aegis/cloudflare/config.yml run"
echo "If browser still errors, note: 502 = Next down; 404 = hostname not in ingress YAML."
