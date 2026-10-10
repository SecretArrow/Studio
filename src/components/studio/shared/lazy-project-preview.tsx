"use client"

/**
 * LazyProjectPreview — real DesignDoc preview for PROJECT cards
 * ------------------------------------------------------------
 * Mirrors LazyDocPreview (templates-card.tsx) but fetches the project document
 * from GET /api/projects/{id}. Used only when a cloud project has neither a
 * server thumbnail nor a locally captured IndexedDB thumb (e.g. created on
 * another device).
 *
 * Caching: project docs CHANGE as the user edits, so entries live in memory
 * for the session only, keyed by (projectId, updatedAt) — when the row's
 * updatedAt changes the key changes and the doc refetches. The Map is capped
 * at 60 entries with FIFO eviction (Map preserves insertion order). There is
 * deliberately NO IndexedDB layer and no negative caching: a failed/forbidden
 * fetch (401/403/404 — guest session, revoked access, missing project)
 * resolves to null and the card silently keeps its existing icon fallback.
 *
 * Concurrency: network fetches go through a dedicated limiter(3) (template
 * previews use their own limiter(4) inside preview-cache.ts). In-flight
 * requests are deduped per cache key so many cards for the same project share
 * one fetch.
 *
 * React-Compiler-safe: state is only set from async callbacks (observer
 * callback / promise .then), never synchronously in an effect body, and every
 * async resolution is guarded by an `alive` flag so nothing setState's after
 * unmount.
 */
import { useEffect, useRef, useState } from "react"
import { createLimiter } from "@/lib/studio/preview-cache"
import { api } from "@/lib/studio/api-client"
import { DocPreview } from "@/components/studio/shared/doc-preview"
import { findScrollRoot } from "@/components/studio/dashboard/views/templates-card"
import type { DesignDoc } from "@/lib/design/types"
import { cn } from "@/lib/utils"

/* ------------------------------ doc fetching ------------------------------ */

const PROJECT_MEM_LIMIT = 60
const projectMem = new Map<string, DesignDoc>()
const projectInflight = new Map<string, Promise<DesignDoc | null>>()
const projectLimiter = createLimiter(3)

const projectKey = (id: string, updatedAt?: string): string =>
  updatedAt ? `proj:${id}@${updatedAt}` : `proj:${id}`

/** FIFO eviction past the session cap (Map iteration order = insertion order). */
function rememberDoc(key: string, doc: DesignDoc): void {
  projectMem.delete(key) // re-insert to refresh recency for existing keys
  projectMem.set(key, doc)
  while (projectMem.size > PROJECT_MEM_LIMIT) {
    const oldest = projectMem.keys().next()
    if (oldest.done) break
    projectMem.delete(oldest.value)
  }
}

/** Light structural check so corrupt payloads can never crash a preview. */
function isDesignDoc(value: unknown): value is DesignDoc {
  if (!value || typeof value !== "object") return false
  const d = value as Partial<DesignDoc>
  return typeof d.width === "number" && typeof d.height === "number" && Array.isArray(d.pages)
}

interface ProjectDocResponse {
  project: { contentJson?: string | null }
}

async function fetchProjectDoc(projectId: string): Promise<DesignDoc | null> {
  try {
    const res = await api.get<ProjectDocResponse>(`/api/projects/${projectId}`)
    const raw = res.project?.contentJson
    if (typeof raw !== "string" || raw.length === 0) return null
    const doc = JSON.parse(raw) as DesignDoc
    return isDesignDoc(doc) ? doc : null
  } catch {
    // 401/403/404 (guest, revoked access, deleted project) and network errors
    // all resolve to null → the card keeps its existing fallback. Never throws.
    return null
  }
}

/**
 * Resolve the full DesignDoc for a project id (concurrency-limited, deduped,
 * session-cached per (id, updatedAt)). Never throws — returns null when the
 * project doc is unavailable.
 */
export async function getProjectDoc(projectId: string, updatedAt?: string): Promise<DesignDoc | null> {
  if (!projectId) return null

  const key = projectKey(projectId, updatedAt)
  const mem = projectMem.get(key)
  if (mem) return mem

  const running = projectInflight.get(key)
  if (running) return running

  const task = (async (): Promise<DesignDoc | null> => {
    try {
      const doc = await projectLimiter.run(() => fetchProjectDoc(projectId))
      if (doc) rememberDoc(key, doc)
      return doc
    } catch {
      return null
    }
  })()

  projectInflight.set(key, task)
  try {
    return await task
  } finally {
    projectInflight.delete(key)
  }
}

/* -------------------------------- component -------------------------------- */

export function LazyProjectPreview({
  projectId,
  updatedAt,
  width,
  height,
  boxAspect,
}: {
  projectId: string
  /** row updatedAt (ISO) — refetches via a new (id, updatedAt) cache key when edited */
  updatedAt?: string
  width: number
  height: number
  /** aspect ratio (w/h) of the card's media box */
  boxAspect: number
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [loaded, setLoaded] = useState<{ id: string; doc: DesignDoc } | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let alive = true
    let started = false
    const io = new IntersectionObserver(
      (entries) => {
        // setState only inside the observer callback (never synchronously here)
        if (started || !entries.some((e) => e.isIntersecting)) return
        started = true
        io.disconnect()
        getProjectDoc(projectId, updatedAt)
          .then((doc) => {
            if (alive && doc) setLoaded({ id: projectId, doc })
          })
          .catch(() => {
            /* keep icon fallback */
          })
      },
      { root: findScrollRoot(el), rootMargin: "300px" },
    )
    io.observe(el)
    return () => {
      alive = false
      io.disconnect()
    }
  }, [projectId, updatedAt])

  // Guard against a stale doc if the card is ever reused for another project.
  const doc = loaded && loaded.id === projectId ? loaded.doc : null

  // object-cover math (same as LazyDocPreview): widen the preview beyond the
  // box when the doc is wider than the box aspect, so the real design fills
  // the card edge-to-edge instead of showing letterbox bars.
  const docAspect = height > 0 ? width / height : 1
  const overflow = docAspect > boxAspect
  const coverPct = overflow ? (docAspect / boxAspect) * 100 : 100

  return (
    <div
      ref={ref}
      className={cn(
        "pointer-events-none absolute inset-y-0 flex items-center justify-center transition-transform duration-200 group-hover:scale-[1.03]",
        overflow ? "" : "inset-x-0",
        "[&>div>div]:rounded-none [&>div>div]:border-0 [&>div>div]:shadow-none",
      )}
      style={overflow ? { width: `${coverPct}%`, left: `${(100 - coverPct) / 2}%` } : undefined}
      aria-hidden="true"
    >
      {doc ? <DocPreview doc={doc} /> : null}
    </div>
  )
}
