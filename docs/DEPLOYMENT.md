# Deployment Guide

Studio is self-hostable with zero paid dependencies. Two processes matter:

1. **app** — the Next.js server (port 3000)
2. **collab** — the socket.io mini-service (port 3003, optional; realtime presence only)

## 1. Bare metal / VM

```bash
git clone https://github.com/SecretArrow/Studio.git && cd Studio
bun install                      # Node 20+ / Bun 1.1+
cp .env.example .env
# edit .env: set AUTH_SECRET to a long random string; set DATABASE_URL to a persistent path
bun run db:push
bun prisma/seed.ts               # optional: demo accounts + starter templates
bun run build && bun run start   # production server on :3000
cd mini-services/collab && bun install && bun index.ts   # realtime service on :3003
```

## 2. Docker

```bash
docker compose up --build          # app on :3000, collab on :3003, volumes for db/uploads
# production proxy + HTTPS:
docker compose --profile prod up caddy
```

## 3. Reverse proxy & HTTPS

The bundled `Caddyfile` shows the pattern used by the reference deployment:

```
your-domain.com {
    @collab query XTransformPort=*
    handle @collab { reverse_proxy localhost:3003 }
    handle { reverse_proxy localhost:3000 }
}
```

Caddy provisions certificates automatically. Nginx works too — proxy `/` to :3000 and pass
`Upgrade`/`Connection` headers for websocket upgrades. Client realtime connections always
use the **same origin** with `?XTransformPort=3003`, so no extra domains or ports are needed.

## 4. Database

SQLite by default (`DATABASE_URL=file:/app/db/custom.db`) — simple and fast for single-node
deployments. Back it up by copying the file (or use Litestream for continuous replication):

```bash
sqlite3 db/custom.db ".backup 'backups/studio-$(date +%F).db'"
```

For multi-node deployments switch the Prisma datasource to PostgreSQL in
`prisma/schema.prisma` (`provider = "postgresql"`), run `bun run db:push` against your
cluster, and keep `DATABASE_URL` in the environment. No code changes are required — no
SQLite-specific features are used (enums/JSON columns are plain strings by design).

## 5. Object storage (optional)

Uploads are stored on disk under `upload/` and served by `/api/files/*`. To use S3-compatible
storage, mount your bucket (e.g. `s3fs`) at `upload/` or adapt `src/app/api/assets/route.ts`
and `src/app/api/files/[...path]/route.ts` — both are isolated behind the `Asset` metadata
table, so the rest of the app is unaffected.

## 6. Email (optional)

Without SMTP, password-reset and verification tokens are displayed in the UI (clearly
labelled — Studio never claims an email was sent). Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`,
`SMTP_PASS`, `SMTP_FROM` to queue real reset emails through the notification pipeline.

## 7. AI (optional)

Set the provider credentials for `z-ai-web-dev-sdk` in the environment. When unset, the
`/api/ai` endpoint answers **503 "AI service is not available on this deployment"** and every
AI surface in the UI degrades gracefully. Core editing never touches AI.

## 8. Operations checklist

- [ ] `AUTH_SECRET` changed from the default
- [ ] Health: `GET /api/health` → `{"ok":true}`
- [ ] Collab health: `GET :3003/health`
- [ ] `db/` and `upload/` on persistent volumes + nightly backups
- [ ] Admin account created (promote via `PATCH /api/admin/users/{id}` from a seeded admin,
      or flip `role` on your user directly in SQLite)
- [ ] Log rotation for the app process

## 9. Upgrading

```bash
git pull
bun install
bun run db:push        # applies schema migrations (additive)
bun run build && bun run start
```

Document contents are versioned (`schemaVersion`); breaking design-model changes ship with
migrations in `src/lib/design/migrate.ts`.
