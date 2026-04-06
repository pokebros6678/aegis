#!/usr/bin/env bash
# Run on the VM. Checks AEGIS + reminds you about cloudflared (public URL needs BOTH).
set -euo pipefail
echo "== 1) AEGIS on loopback (required for Cloudflare ingress http://127.0.0.1:3000) =="
code=$(curl -sS -o /dev/null -w "%{http_code}" "http://127.0.0.1:3000/login" || echo "000")
if echo "$code" | grep -qE '^(200|302|307|308)$'; then
  echo "OK: http://127.0.0.1:3000/login returned HTTP $code"
else
  echo "FAIL: got HTTP $code — start AEGIS: cd ~/aegis && npm run start"
  exit 1
fi

echo ""
echo "== 2) cloudflared (must be running in another terminal or systemd) =="
if pgrep -x cloudflared >/dev/null 2>&1; then
  echo "OK: cloudflared process is running"
else
  echo "NOT RUNNING: start tunnel, e.g.:"
  echo "  cloudflared tunnel --config \$HOME/aegis/cloudflare/config.yml run"
  echo "  (or whatever path your config.yml uses — must list hostname aegis.bi6calirp.xyz)"
  exit 1
fi

echo ""
echo "== 3) Quick DNS check (from this VM) =="
if command -v dig >/dev/null 2>&1; then
  dig +short aegis.bi6calirp.xyz || true
else
  echo "(install dig for DNS check, or test in browser)"
fi

echo ""
echo "If step 1+2 are OK but the site still fails, open Cloudflare → your tunnel →"
echo "confirm Public Hostname matches aegis.bi6calirp.xyz and service is http://127.0.0.1:3000"
