/**
 * Local store — guest/local project drafts persisted in IndexedDB via idb-keyval.
 * Local drafts are browser-only by design (private, no account needed) and can be
 * migrated to the cloud with migrateLocalToCloud().
 */
import { get, set, del, keys } from "idb-keyval"
import type { DesignDoc } from "@/lib/design/types"
import { api } from "@/lib/studio/api-client"

export interface LocalProject {
  id: string
  name: string
  type: string
  width: number
  height: number
  doc: DesignDoc
  thumbnail?: string | null
  favorite?: boolean
  createdAt: number
  updatedAt: number
}

const PREFIX = "studio:local-project:"

const keyOf = (id: string) => `${PREFIX}${id}`

export function newLocalProjectId(): string {
  const rnd = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2)
  return `local_${rnd}`
}

export async function localSaveProject(project: LocalProject): Promise<void> {
  await set(keyOf(project.id), project)
}

export async function localGetProject(id: string): Promise<LocalProject | undefined> {
  const hit = await get<LocalProject>(keyOf(id))
  return hit ?? undefined
}

export async function localDeleteProject(id: string): Promise<void> {
  await del(keyOf(id))
}

export async function localListProjects(): Promise<LocalProject[]> {
  try {
    const all = await keys()
    const rowKeys = all.filter((k): k is string => typeof k === "string" && k.startsWith(PREFIX))
    const rows = await Promise.all(rowKeys.map((k) => get<LocalProject>(k)))
    return rows
      .filter((p): p is LocalProject => Boolean(p))
      .sort((a, b) => b.updatedAt - a.updatedAt)
  } catch {
    return []
  }
}

/** Push a local draft to the user's cloud account. Returns the new cloud project id, or null on failure. */
export async function migrateLocalToCloud(local: LocalProject): Promise<string | null> {
  try {
    const res = await api.post<{ project: { id: string } }>("/api/projects", {
      name: local.name,
      doc: local.doc,
      thumbnail: local.thumbnail ?? undefined,
    })
    if (res?.project?.id) {
      await localDeleteProject(local.id)
      return res.project.id
    }
    return null
  } catch {
    return null
  }
}

/* ------------------------------ project thumbnails ------------------------------ */

/**
 * Client-side project thumbnails, stored next to local drafts in IndexedDB.
 * Editor saves capture a small JPEG dataURL and store it here so dashboard
 * cards can show a real preview even when the server has no thumbnail.
 * Keys embed the save timestamp (`proj-thumb:{ts}:{id}`) so the LRU cap can
 * evict the oldest entries without reading any (large) dataURL values.
 */

const THUMB_PREFIX = "proj-thumb:"
const THUMB_CAP = 300
const TS_PAD = 15

export interface ThumbRecord {
  t: number
  d: string
}

export interface ParsedThumbKey {
  ts: number
  id: string
}

/** Pure: `proj-thumb:{paddedTs}:{id}` → { ts, id } (null for other keys). */
export function parseThumbKey(key: string): ParsedThumbKey | null {
  if (!key.startsWith(THUMB_PREFIX)) return null
  const rest = key.slice(THUMB_PREFIX.length)
  const sep = rest.indexOf(":")
  if (sep !== TS_PAD) return null
  const tsPart = rest.slice(0, sep)
  const id = rest.slice(sep + 1)
  if (!/^\d+$/.test(tsPart) || !id) return null
  return { ts: Number(tsPart), id }
}

export interface ThumbKeyEntry extends ParsedThumbKey {
  key: string
}

/** Pure: given all thumb keys with timestamps, return the keys to delete so at most `cap` remain (oldest evicted first). */
export function thumbsToEvict(entries: ThumbKeyEntry[], cap: number): string[] {
  if (entries.length <= cap) return []
  const sorted = [...entries].sort((a, b) => a.ts - b.ts)
  return sorted.slice(0, entries.length - cap).map((e) => e.key)
}

function thumbKeyOf(id: string, ts: number): string {
  return `${THUMB_PREFIX}${String(ts).padStart(TS_PAD, "0")}:${id}`
}

async function listThumbKeys(): Promise<string[]> {
  const all = await keys()
  return all.filter((k): k is string => typeof k === "string" && k.startsWith(THUMB_PREFIX))
}

/** Store (or replace) a project's thumbnail dataURL. Best-effort — never throws. */
export async function saveProjectThumb(id: string, dataUrl: string): Promise<void> {
  try {
    if (!id || !dataUrl) return
    const ts = Date.now()
    const existing = await listThumbKeys()
    const entries: ThumbKeyEntry[] = []
    const staleKeys: string[] = []
    for (const k of existing) {
      const parsed = parseThumbKey(k)
      if (!parsed) continue
      if (parsed.id === id) staleKeys.push(k)
      else entries.push({ key: k, ts: parsed.ts, id: parsed.id })
    }
    // replace any previous entry for this project (its key embeds the old timestamp)
    for (const k of staleKeys) await del(k)
    const newKey = thumbKeyOf(id, ts)
    await set(newKey, { t: ts, d: dataUrl } satisfies ThumbRecord)
    // enforce the LRU cap (evict oldest by stored timestamp)
    entries.push({ key: newKey, ts, id })
    for (const k of thumbsToEvict(entries, THUMB_CAP)) await del(k)
  } catch {
    /* thumbnails are best-effort; never surface errors */
  }
}

/** Fetch a project's locally stored thumbnail dataURL, or null. Never throws. */
export async function getProjectThumb(id: string): Promise<string | null> {
  try {
    if (!id) return null
    const all = await listThumbKeys()
    for (const k of all) {
      const parsed = parseThumbKey(k)
      if (parsed?.id === id) {
        const rec = await get<ThumbRecord>(k)
        return rec?.d ?? null
      }
    }
    return null
  } catch {
    return null
  }
}
