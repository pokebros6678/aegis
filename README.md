This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Public HTTPS access (Cloudflare Tunnel)

To expose AEGIS on the internet without port-forwarding, use Cloudflare Tunnel. Set **`AUTH_URL`** in `.env` to your public `https://` URL. Keep tunnel ingress in **`~/aegis/cloudflare/config.yml`** (from [cloudflare/config.example.yml](cloudflare/config.example.yml)); on the VM run **`npm run tunnel`** from the repo or `cloudflared tunnel --config ~/aegis/cloudflare/config.yml run`. Full steps: [cloudflare/SETUP.md](cloudflare/SETUP.md).

## Deploy updates (self-hosted VM)

On the server, from the repo (e.g. `~/aegis`):

```bash
chmod +x scripts/deploy.sh   # once
npm run deploy
```

This runs **`git pull`** (`main`, fast-forward only), **`npm ci`**, and **`npm run build`** (including Prisma validate, generate, and migrate deploy). Postgres must be running; `.env` must exist.

**Optional:** restart the app automatically after deploy:

```bash
export AEGIS_RESTART_CMD='sudo systemctl restart aegis-next'
npm run deploy
```

(Install [scripts/aegis-next.service.example](scripts/aegis-next.service.example) as `aegis-next.service` first, or use your own command.)

Other env vars: `DEPLOY_BRANCH`, `SKIP_DEPLOY_PULL=1`, `SKIP_DEPLOY_INSTALL=1` — see comments in [scripts/deploy.sh](scripts/deploy.sh).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
