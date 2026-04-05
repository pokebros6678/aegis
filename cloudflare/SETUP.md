# Cloudflare Tunnel for AEGIS

Expose AEGIS over **HTTPS** without opening router ports. The tunnel connects **outbound** from your VM to Cloudflare; Next.js stays on `http://127.0.0.1:3000`.

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

5. Run the tunnel:

   ```bash
   cloudflared tunnel --config ~/aegis/cloudflare/config.yml run
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
- **Staff password:** still `AEGIS_STAFF_PASSWORD` in `.env` (unchanged by the tunnel).
