# API Reference

All endpoints are relative to the app origin. JSON bodies; mutations require the session
cookie (set by `POST /api/auth/login|register`) and a same-origin request. Errors return
`{ "error": string, "code": string }` with an appropriate HTTP status.

## Auth

| Method | Path | Body / Query | Notes |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | `{email, name, password≥8}` | 5/min. Returns user + `verifyHint` token when SMTP is not configured (honest dev mode). |
| POST | `/api/auth/login` | `{email, password}` | 10/min. Sets `studio_session` cookie. |
| POST | `/api/auth/logout` | — | Clears cookie. |
| GET | `/api/auth/me` | — | `{user, workspace}` or `{user: null}`. |
| PATCH | `/api/auth/me` | `{name?, locale?, theme?, avatarUrl?}` | Update profile. |
| POST | `/api/auth/forgot` | `{email}` | Always 200. With SMTP: queues email. Without: returns `{token}` (dev mode). |
| POST | `/api/auth/reset` | `{token, password}` | Consumes reset token, signs in. |
| POST | `/api/auth/verify` | `{token}` | Marks email verified. |
| POST | `/api/auth/password` | `{current, next}` | Change password (auth). |

## Account

| GET | `/api/account/export` | — | Full data export (JSON download). |
| DELETE | `/api/account` | — | Permanent deletion + cascade + file cleanup. Audited. |

## Projects

| Method | Path | Body / Query | Notes |
| --- | --- | --- | --- |
| GET | `/api/projects` | `?q&type&folderId&favorite&trash&sort=recent\|name\|created&limit&offset` | Owned workspace projects. |
| POST | `/api/projects` | `{presetId}` or `{templateId}` or `{doc}` + `name?, folderId?` | Creates from size preset, template, or raw DesignDoc. |
| GET | `/api/projects/{id}` | `?share=token` | Returns project + your `role`. |
| PATCH | `/api/projects/{id}` | `{name?, contentJson?, thumbnail?, favorite?, folderId?, shareMode?, baseUpdatedAt?, force?}` | `contentJson` requires edit role. Stale `baseUpdatedAt` → **409** `{conflict:true, serverUpdatedAt}`. |
| DELETE | `/api/projects/{id}?hard=1` | — | Soft-trash by default; `hard=1` purges (owner only). |
| POST | `/api/projects/{id}/duplicate` | — | Copy to your workspace. |
| POST | `/api/projects/{id}/restore` | — | Restore from trash. |
| GET | `/api/projects/{id}/versions` | — | Snapshot list (50). |
| POST | `/api/projects/{id}/versions` | `{label?}` | Create snapshot. |
| POST | `/api/projects/{id}/versions/{versionId}/restore` | — | Auto-snapshots current state first. |

## Templates (public)

| GET | `/api/templates` | `?q&category&type&featured&limit` | Library listing; all CC0. |
| GET | `/api/templates/{id}` | — | Full template incl. `contentJson`. |
| POST | `/api/templates/{id}/use` | — | Creates a personal editable project (auth). |

## Folders & Brand kits

| GET/POST | `/api/folders` | `{name, parentId?}` | List/create. |
| PATCH/DELETE | `/api/folders/{id}` | | Rename/delete (workspace admin+). |
| GET/POST | `/api/brandkits` | `{name, colorsJson?, fontsJson?, logosJson?, guidelines?}` | List/create. |
| PATCH/DELETE | `/api/brandkits/{id}` | | Owner-only kit editing. |

## Assets

| GET | `/api/assets` | `?kind&q` | Own uploads + public CC0 packs. |
| POST | `/api/assets` | multipart `file` | 30 MB cap, magic-byte check, SVG sanitized, 30/min. Returns `{asset}` with `/api/files/...` url. |
| DELETE | `/api/assets/{id}` | — | Owner only; removes file + row. |
| GET | `/api/files/{yyyy-mm}/{name}` | — | Streams stored upload (immutable cache). |

## Sharing & comments

| GET | `/api/share?projectId=` | — | Invite links for a project (edit role). |
| POST | `/api/share` | `{projectId, role: viewer\|commenter\|editor}` | Create link token. |
| PATCH/DELETE | `/api/share/{id}` | `{revoked?, role?}` | Revoke/change (owner only). Audited. |
| GET | `/api/share-link/{token}` | — | Resolve token → project + role (no auth). |
| GET | `/api/comments?projectId=&share=` | — | Threaded comments with author info. |
| POST | `/api/comments` | `{projectId, pageId?, elementId?, body, parentId?}` | Requires comment+ role. Notifies owner. |
| PATCH/DELETE | `/api/comments/{id}` | `{resolved?, body?}` | Author or editor/owner. |

## Notifications & bulk jobs

| GET | `/api/notifications` | — | Newest 50 + unread count. |
| PATCH | `/api/notifications` | `{ids?[], all?}` | Mark read. |
| GET/POST | `/api/bulk-jobs` | `{projectId?, total}` | Batch job history. |
| PATCH | `/api/bulk-jobs/{id}` | `{done?, status?, error?}` | Owner progress updates. |

## AI (optional)

| POST | `/api/ai` | `{action, payload}` | Actions: `copy`, `outline`, `palette`, `translate`, `summarize`, `rewrite`. 10/min. **503 with an honest message when the SDK is not configured — never fake output.** |

## Admin (role: admin, server-enforced)

| GET | `/api/admin/stats` | — | User/project/asset/template/version/audit counts. |
| GET | `/api/admin/users` · PATCH/DELETE `/api/admin/users/{id}` | `{role}` | Role management; self-delete blocked. Audited. |
| GET | `/api/admin/projects` | — | Recent 100 with owner. |
| PATCH/DELETE | `/api/admin/templates/{id}` | `{featured?, name?}` | Curate library. Audited. |
| GET | `/api/admin/jobs` | — | Bulk jobs + failure counts. |
| GET | `/api/admin/audit` | `?limit` | Audit trail. |

## Health

| GET | `/api/health` | — | `{ok, services:{app, database}, latencyMs}`. |
