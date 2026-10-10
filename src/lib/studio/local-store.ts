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
