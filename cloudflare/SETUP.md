# Cloudflare Tunnel for AEGIS

Expose AEGIS over **HTTPS** without opening router ports. The tunnel connects **outbound** from your VM to Cloudflare; Next.js stays on `http://127.0.0.1:3000`.

**Tunnel config file (canonical):** always **`~/aegis/cloudflare/config.yml`** (copy from `config.example.yml`, fill tunnel UUID + `credentials-file`). Do not rely on `~/.cloudflared/config.yml` for ingress — run cloudflared with `--config ~/aegis/cloudflare/config.yml` (or `npm run tunnel` from `~/aegis`). The JSON credentials from `cloudflared tunnel create` still live under `~/.cloudflared/`; point `credentials-file:` at that path in YAML.

## Before you start

- AEGIS runs and answers on the VM: `curl -sI http://127.0.0.1:3000` should return `200` or `307` (redirect to login).
- In `.env`, set **`AUTH_URL`** to the **exact public URL** people will use (including `https://` and no trailing slash), then restart AEGIS. Example: `AUTH_URL="https://aegis.yourdomain.com"`.

---

## Option A — Quick tunnel (good for testing)

URL changes every time you restart the command. No custom domain.

1. **Install `cloudflared`** on the Ubuntu VM (official package):

   ```bash
   sudo mkdir -p --mode=0755 /usr/share/keyrings
   curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
   echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared any main" | sudo tee /etc/apt/sources.list.d/cloudflared.list
   sudo apt update && sudo apt install -y cloudflared
   ```

2. **Start AEGIS** in one terminal (`npm run start` or `./scripts/start-server.sh`).

3. In **another** terminal, run:

   ```bash
   cloudflared tunnel --url http://127.0.0.1:3000
   ```

4. Copy the printed **`https://....trycloudflare.com`** URL.

5. On the VM, edit **`~/aegis/.env`**:

   ```bash
   nano ~/aegis/.env
   ```

   Set (use **your** URL):

   ```env
   AUTH_URL="https://something-random.trycloudflare.com"
   ```

   Save (`Ctrl+O`, Enter, `Ctrl+X`).

6. **Restart AEGIS** (stop with `Ctrl+C`, start again).

7. Open the **trycloudflare** URL in a browser and log in.

---

## Option B — Named tunnel + your domain (stable URL)

Your domain’s DNS must be on **Cloudflare** (nameservers at Cloudflare).

1. Install `cloudflared` (same commands as Option A, step 1).

2. Log in and create a tunnel:

   ```bash
   cloudflared tunnel login
   cloudflared tunnel create aegis
   ```

   Note the **tunnel UUID** and the **credentials JSON** path (under `~/.cloudflared/`).

3. Point a hostname at the tunnel (replace zone and name):

   ```bash
   cloudflared tunnel route dns aegis aegis.yourdomain.com
   ```

4. Copy the example config and edit it:

   ```bash
   cd ~/aegis/cloudflare
   cp config.example.yml config.yml
   nano config.yml
   ```

   Fill in:

   - `tunnel:` → your tunnel UUID  
   - `credentials-file:` → full path to the `.json` from step 2  
   - `hostname:` → same as in `tunnel route dns` (e.g. `aegis.yourdomain.com`)

5. Run the tunnel (from `~/aegis`):

   ```bash
   cloudflared tunnel --config ~/aegis/cloudflare/config.yml run
   ```

   Equivalent:

   ```bash
   cd ~/aegis && npm run tunnel
   ```

6. Set in **`~/aegis/.env`**:

   ```env
   AUTH_URL="https://aegis.yourdomain.com"
   ```

7. Restart AEGIS, then browse to `https://aegis.yourdomain.com`.

8. Optional: run the tunnel as a service using `aegis-tunnel.service.example` (fix `User` and paths, then `systemctl enable --now`).

---

## Troubleshooting

- **Login redirect loop or wrong host:** `AUTH_URL` must match the URL in the browser exactly (`https`, hostname, no trailing slash).
- **502 / connection refused:** AEGIS is not running, or not listening on `127.0.0.1:3000`.
- **Staff passwords:** set `AEGIS_ADMIN_PASSWORD` and `AEGIS_MEMBER_PASSWORD` in `.env` (unchanged by the tunnel). If `AEGIS_ADMIN_PASSWORD` is unset, `AEGIS_STAFF_PASSWORD` still works as admin-only for migration.

### Custom domain (e.g. `aegis.bi6calirp.xyz`) does not load

Public HTTPS needs **two** things running on the **same** VM:

| Process | Role |
|---------|------|
| **AEGIS** (`npm run start` in `~/aegis`) | Serves the app on port **3000** |
| **cloudflared** | Connects to Cloudflare and forwards traffic to `http://127.0.0.1:3000` |

1. **Confirm AEGIS answers locally**

   ```bash
   curl -sI http://127.0.0.1:3000/login
   ```

   You should see `HTTP/1.1` with `200`, `302`, or `307`. If `Connection refused`, start AEGIS first.

2. **Confirm cloudflared is running**

   ```bash
   pgrep -a cloudflared
   ```

   If this prints nothing, the tunnel is **not** connected — the domain will not reach your server. Start it using **only** the repo config:

   ```bash
   cloudflared tunnel --config ~/aegis/cloudflare/config.yml run
   ```

   or `cd ~/aegis && npm run tunnel`.

   **Important:** Edit **`~/aegis/cloudflare/config.yml`** (not a separate `~/.cloudflared/config.yml` unless you symlink). It must list **`hostname: aegis.bi6calirp.xyz`** (exact match) and **`service: http://127.0.0.1:3000`**.

3. **Match tunnel ID to DNS**  
   In the Cloudflare dashboard, the **Tunnel** attached to `aegis.bi6calirp.xyz` must be the **same** tunnel UUID as in your `config.yml` top-level `tunnel:` and `credentials-file`.

4. **Optional check on the VM**

   ```bash
   chmod +x scripts/verify-tunnel-ready.sh
   ./scripts/verify-tunnel-ready.sh
   ```

- **`MissingCSRF` in AEGIS logs:** set `AUTH_URL="https://aegis.bi6calirp.xyz"` in `.env` (no trailing slash), restart AEGIS, try again in a private window.

### Tunnel looks “running” but the site does not load

You need **both** processes. `cloudflared` only proxies to your VM; **Next.js must still be listening on port 3000**.

1. **Start AEGIS from the repo folder** (not from `$HOME`):

   ```bash
   cd ~/aegis && npm run start
   ```

   If you run `npm run start` from `/home/user` you get **`ENOENT` / no package.json** — nothing listens on `:3000`, so Cloudflare often shows **502 Bad Gateway** even when the tunnel is healthy.

2. **Closing SSH stops the app** if Next is running in that terminal. Use **tmux**/**screen**, or install the example systemd unit **[`scripts/aegis-next.service.example`](../scripts/aegis-next.service.example)** so `aegis-next` stays up after logout.

3. **Quick health check on the VM**

   ```bash
   chmod +x scripts/check-aegis-stack.sh
   ./scripts/check-aegis-stack.sh
   ```

4. **Browser error hints**

   | Symptom | Likely cause |
   |---------|----------------|
   | **502** from Cloudflare | Next.js not running, or not on `127.0.0.1:3000` |
   | **404** from Cloudflare | Hostname you opened is not listed under `ingress:` in `~/aegis/cloudflare/config.yml` |
   | **Timeout** | Tunnel not actually connected, or wrong DNS |

- **`Tunnel credentials file ... doesn't exist or is not a file`:** The path in `credentials-file:` must be a real file on **this** VM, owned by the user running `cloudflared`. Fix it:

  ```bash
  ls -la ~/.cloudflared/*.json
  ```

  Use the **exact** filename you see (it is always `<tunnel-uuid>.json`). Put that full path in `~/aegis/cloudflare/config.yml`:

  ```yaml
  tunnel: <same-uuid-as-the-filename-without-.json>
  credentials-file: /home/user/.cloudflared/<uuid>.json
  ```

  Replace `user` with your Linux username (`whoami`). The UUID on the `tunnel:` line must match the JSON filename. If `ls` shows **no** `.json` files, create the tunnel on **this** machine (or copy the credential file from the machine where you ran `cloudflared tunnel create`):

  ```bash
  cloudflared tunnel login
  cloudflared tunnel create aegis
  ```

  Then note the printed path, update `config.yml`, and run `cloudflared tunnel route dns aegis aegis.bi6calirp.xyz` again if DNS is missing.
