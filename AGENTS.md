<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Electron desktop shell

- Thin client: `electron/main.cjs` loads the Next app from `AEGIS_SERVER_URL`, `aegis-server.json` (beside the `.exe` or project root), or defaults to `http://127.0.0.1:3000`.
- Dev: `npm run electron:dev` (starts `next dev` + Electron). Prod-style local: `npm run build && npm run electron:start`.
- Packaging: `npm run electron:dist` produces installers under `dist-electron/` (does not bundle Next; users still need a reachable server unless they use localhost + local `next start`).

## Data model (CaliRP plan)

- **PostgreSQL** via `DATABASE_URL`. Run `docker compose up -d` then `npx prisma migrate deploy` (or `migrate dev`).
- **Player**, **Vehicle**, **Affiliation** (optional `relatedPlayerId` → Player), **EmploymentRecord**. Affiliations tab on `/players/[id]`.
