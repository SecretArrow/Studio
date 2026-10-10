# Architecture

## Big picture

Studio is a **single Next.js 16 App Router application** with one user-visible route (`/`).
Navigation between dashboard, editors and settings happens client-side through a hash-based
SPA router (`#/home`, `#/editor/{id}`, …) backed by a Zustand store. API route handlers under
`/api/*` provide the REST backend; a separate **socket.io mini-service** handles realtime
presence and doc-update notifications.

```
Browser (SPA)
 ├─ src/components/studio/studio-app.tsx      root switch (auth / dashboard / editor / shared)
 ├─ dashboard/*                               home, projects, templates, brand, bulk, trash, settings, admin
 ├─ editor-shell.tsx                          load/save/autosave/conflict/export/share chrome
 │   └─ editors/registry.tsx                  lazy editor modules
 │       ├─ canvas-editor  (+ canvas/* panels, src/lib/editor/* engine)
 │       ├─ photo-editor   (+ photo/*)
 │       ├─ presentation-editor / doc-editor (+ presentation/, doc/)
 │       ├─ whiteboard-editor (+ whiteboard/)  chart-editor
 │       ├─ video-editor   (+ video/*)         website-editor (+ website/)
 │       └─ email-editor   (+ email/)
 └─ lib/
     ├─ design/types.ts      ★ THE document model (see below)
     ├─ design/presets.ts    sizes, categories, fonts, palettes
     ├─ design/templates/            439 original templates as DesignDocs (per-category + seasonal-pack modules)
     ├─ design/template-packs.ts     curated pack metadata (11 packs, tag matchers)
     ├─ design/i18n/         template-text localization: locales manifest + pure localize.ts
     ├─ studio/lru.ts        generic LRU map (memory caps for caches)
     ├─ editor/              pure engine: history, snapping, alignment, export, geometry
     ├─ studio/              app store (SPA router), api client, IndexedDB local drafts + preview/thumb caches
     └─ i18n.tsx             en/id dictionaries

Server (same Next.js process)
 ├─ /api/auth/*        register, login, logout, me, forgot/reset/verify, password
 ├─ /api/projects/*    CRUD, duplicate, restore, versions (snapshots), conflict handling
 ├─ /api/templates/*   public template library + use (creates editable project); `?tag=a,b` any-of tag filter for packs; `use` accepts { locale } → server-side doc localization via public/i18n/templates/{locale}.json
 ├─ /api/assets(+files) uploads (magic-byte validated, SVG sanitized), serving
 ├─ /api/comments      threaded comments per project/page/element
 ├─ /api/share(+link)  share links & token resolution
 ├─ /api/notifications bell data     /api/bulk-jobs   batch job records
 ├─ /api/ai            optional z-ai-web-dev-sdk assistant (503 when not configured)
 ├─ /api/admin/*       stats, users, projects, templates, jobs, audit (role-gated)
 └─ /api/health        liveness + database check

mini-services/collab    socket.io on port 3003 — rooms per project: join/presence/doc-update
```

## The document model (`src/lib/design/types.ts`)

Everything an editor produces is a **`DesignDoc`** — plain, versioned JSON:

```ts
DesignDoc {
  schemaVersion: 1
  type: "canvas" | "presentation" | "video" | "photo" | "doc"
      | "whiteboard" | "website" | "email" | "chart"
  width, height          // page/canvas size in px
  background
  pages: PageModel[]     // slides / pages / scenes
  config?: WebsiteConfig | EmailConfig | VideoConfig   // type-specific
}

PageModel  { id, name, background, elements: DesignElement[], notes?, transition?, durationMs? }
```

`DesignElement` is a union of 13 element types (text, shape, image, icon, chart, table, qr,
media, frame, group, sticky, freehand, connector). Array order inside a page is z-order.
**Templates use the same model** — every template is a real, editable doc, never a flattened
image. Changing shapes requires bumping `SCHEMA_VERSION` and adding a migration.

## Editor contract

Editors are lazy-loaded plugins. `EditorShell` owns persistence; editors own the document UI:

```ts
interface EditorProps {
  project: { id, name, type, width, height }
  initialDoc: DesignDoc
  role: "owner" | "editor" | "commenter" | "viewer"   // read-only enforced for commenter/viewer
  onDocChange(doc: DesignDoc): void     // shell debounces autosave (1.4s) + Ctrl+S
  registerHandle(handle | null): void   // export(req) / getThumbnail() / present?()
}
```

Autosave writes `contentJson` + `thumbnail` with optimistic concurrency: the client sends
`baseUpdatedAt`; if the server copy is newer it answers **409 + server doc** and the shell
reloads with a toast — no silent lost updates.

## Persistence layers

1. **Cloud** — Prisma/SQLite (`Project.contentJson`), the source of truth for signed-in users.
2. **Local drafts** — IndexedDB via `idb-keyval` (`lib/studio/local-store.ts`). Guests and
   offline sessions work fully; "Save to cloud" migrates a draft via the API.
3. **Assets** — uploads land in `upload/{yyyy-mm}/{id}.{ext}`, served through `/api/files/*`
   with path-traversal guards. Metadata (mime, size, license) lives in the `Asset` table.

## Realtime

`mini-services/collab` keeps in-memory rooms per project. Clients connect through the
gateway with `io("/", { query: { XTransformPort: "3003" }, path: "/" })`. Presence events are
fire-and-forget; `doc-update` is a **notification**, not a hot-swap — receivers see "Project
updated by X" with a Reload action, so concurrent editors are protected by the 409 flow.

## Security model

- Passwords: bcrypt (cost 10). Sessions: JWT (HS256, 7d) in an httpOnly SameSite=Lax cookie.
- Every mutation handler runs `assertSameOrigin` (CSRF) + zod validation (`parseBody`).
- Role checks: `requireUser([...roles])` for admin routes; `getProjectAccess()` resolves
  owner / workspace member / share-link roles for every project read/write.
- Uploads: 30 MB cap, magic-byte sniffing, SVG script/event-handler stripping.
- Rate limiting (in-memory buckets) on auth, uploads and AI endpoints.
- `AuditLog` records auth events, admin actions, share revocations, restores.

## Frontend conventions

- shadcn/ui + Tailwind 4 tokens; violet primary; light/dark via `next-themes` (class).
- Touch targets ≥ 44 px, `env(safe-area-inset-*)` respected, mobile-first breakpoints.
- React-Compiler-friendly patterns: no setState during render/effects (deferred), no ref
  access in render, complete `useCallback` deps.
- i18n through `useI18n()` — English default, Indonesian bundled.

## Device-adaptive layouts (PC / Android / iOS)

One SPA, three form factors. The navigation model switches at `md` (768 px):

- **Desktop (md+)** — collapsible sidebar rail (`Sidebar`, `w-14`/`w-60` via
  `sidebarOpenFor`); header with full-label actions. Behavior unchanged since wave 8.
- **Phone (<md)** — `MobileNav` (dashboard/mobile-nav.tsx) renders as the last flex
  child of the dashboard column (never `fixed`, so it can never cover content):
  Home · Templates · New-design FAB · Projects · **More** bottom Sheet (Brand, Bulk,
  Trash, Settings, conditional Admin). The nav model is a pure function
  (`mobileNavModel(isAdmin)`), unit-tested. The old absolute mobile drawer is retired
  (`max-md:hidden` on the aside) — it had no way to re-open off home/projects and
  stranded deep links; bottom nav is present on every dashboard view incl. cold
  deep links (e2e-pinned). Template detail/pack views highlight the Templates slot
  via `isNavActive`.
- **Editors on phones** — horizontal-scroll tool rails (`flex-row overflow-x-auto`
  → `md:flex-col md:border-r`), property panels as overlay sheets/bottom sheets
  below their desktop breakpoint, touch-visible page controls (`max-md:opacity-100`
  where hover-only controls were undiscoverable), wrapped toolbars, viewport-clamped
  dialogs (`max-w-[calc(100%-2rem)]`), footer controls sized to fit 360 px.
- **Platform layer** (`layout.tsx` + `globals.css`): `viewportFit=cover` +
  `env(safe-area-inset-*)` on header/nav rails; `appleWebApp` standalone meta +
  black-translucent status bar; `interactiveWidget=resizes-content` so the Android
  keyboard resizes the `100dvh` shell; `-webkit-tap-highlight-color: transparent`,
  `touch-action: manipulation` on interactive elements, `touch-action: none` +
  `user-select: none` on Konva canvas surfaces, `overscroll-behavior-y: none`,
  16px control font on `pointer: coarse` (prevents iOS focus zoom), momentum
  scrolling on inner scrollers; PWA manifest with maskable icon, `orientation: any`.
