# Studio — Free All-in-One Visual Design Platform

Studio is a free, open-source, browser-based creative workspace: **graphic design, photo
editing, video editing, presentations, documents, whiteboards, charts, websites, email
design and real-time collaboration** in one responsive application.

> **Genuinely free.** No paid plans, no premium locks, no paywalled templates, no forced
> watermarks, no export fees, no credit systems. Deploy operators fund their own hosting;
> end users never pay for core functionality.

## Feature overview

| Module | Highlights |
| --- | --- |
| **Canvas editor** | Konva-powered: text, shapes, images, icons, QR, tables, charts, frames; snapping + smart guides, rulers, grid, safe margins, layers, grouping, inline text edit, context menus, clipboard, alignment/distribution, multi-page, zoom/pan (touch included) |
| **Photo editor** | Adjustments (brightness/contrast/saturation/hue/blur/vignette/…), crop + aspect presets, straighten, flip, filter presets, before/after, overlays, collage layouts, auto-enhance (real histogram stretch), resize/compress export |
| **Presentation editor** | Slide sorter, themes, transitions, presenter notes + presenter view, fullscreen present mode (keyboard/touch), PDF/PNG/ZIP export |
| **Document editor** | Block rich text, headings, lists, images, tables, charts, TOC, page structure, print preview, PDF + Word-compatible HTML export |
| **Video editor** | Multi-track timeline, trim/split/speed/volume/fades, text + subtitle overlays (SRT import), canvas compositor preview, WebM export (MP4 where the browser supports it) with progress + cancel |
| **Whiteboard** | Infinite canvas, pen, shapes, sticky notes, auto-connectors, frames, minimap, brainstorm/flowchart/mind-map/retro templates, votes |
| **Chart editor** | chart.js live preview, editable data grid, CSV import, 7 chart types, always data-linked |
| **Website builder** | 14 responsive section types, desktop/tablet/mobile preview, theme tokens, SEO fields, sanitized custom CSS, static HTML/ZIP export, honest (non-fake) publish state |
| **Email designer** | Email-safe table HTML, 9 block types, desktop/mobile preview, HTML export + test render |
| **Brand kits** | Palettes with WCAG contrast checks, fonts, logos, apply-to-design transform |
| **Bulk generator** | Template + CSV → hundreds of personalized designs (tokens `{{like_this}}`), validation, duplicate detection, chunked rendering, ZIP download |
| **Collaboration** | Share links (view/comment/edit), live presence via socket.io, threaded comments, version snapshots + restore, conflict-safe autosave |
| **Platform** | Auth (JWT + bcrypt), dashboard with folders/favorites/trash/search, template library (234 original CC0 templates in 13 categories), asset uploads (magic-byte validated), AI assistant (optional, honest when unavailable), admin suite, audit log, notifications, PWA + offline drafts (IndexedDB), i18n (English/Indonesian), light/dark theme |

## Tech stack

- **Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 + shadcn/ui** (React 19)
- **Konva.js** canvas engine, **chart.js**, **jsPDF**, **JSZip**, **Papa Parse**
- **Prisma ORM + SQLite** (zero-config; see deployment notes for Postgres hosting)
- **Zustand** client state + **TanStack Query** server state
- **socket.io** mini-service for realtime presence/doc updates
- **z-ai-web-dev-sdk** for optional AI features (server-side only)

## Quick start (local development)

```bash
git clone https://github.com/SecretArrow/Studio.git
cd Studio
bun install                # or npm install / pnpm install
cp .env.example .env       # defaults work out of the box
bun run db:push            # create SQLite database
bun prisma/seed.ts         # demo accounts + 234 starter templates
bun run dev                # http://localhost:3000
```

Demo accounts (created by the seed):

| Account | Password | Notes |
| --- | --- | --- |
| `demo@studio.local` | `demo1234` | Regular user |
| `admin@studio.local` | `admin1234` | Administrator (admin suite) |

Guests can design immediately — drafts are stored locally (IndexedDB) and can be pushed
to the cloud after signing in.

## Scripts

```bash
bun run dev          # development server (port 3000)
bun run lint         # eslint
bun run test         # vitest unit tests (36 tests)
bun run test:e2e     # playwright golden paths (12 tests, chromium + mobile)
bunx tsc --noEmit    # typecheck
bun run db:push      # apply schema
bun prisma/seed.ts   # seed demo data
```

## Docker

```bash
docker compose up --build   # app on http://localhost:3000
```

See `docs/DEPLOYMENT.md` for production (reverse proxy + HTTPS, collab service, backups).

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — module map, design model, data flow
- [API reference](docs/API.md) — every endpoint with payloads
- [Deployment](docs/DEPLOYMENT.md) — self-hosting, HTTPS, collab service, backups
- [Testing](docs/TESTING.md) — unit + E2E strategy and commands
- [Asset licenses](docs/ASSETS-LICENSES.md) — everything bundled is original/CC0

## Freedom guarantees

1. No paid tiers or feature locks — every editor, export format and template is free.
2. No watermarks, ever; exports respect your chosen resolution.
3. Core editing works without AI, email, or any external paid service.
4. Original content only — templates and bundled assets are CC0, created for Studio.
5. Optional integrations (AI, SMTP) degrade honestly: Studio never fakes results.

## License

MIT — see [LICENSE](LICENSE). Third-party notices in [docs/ASSETS-LICENSES.md](docs/ASSETS-LICENSES.md).
