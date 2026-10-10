/**
 * Studio — template preview cache
 * -------------------------------
 * Lazy DesignDoc fetching for gallery cards, layered for speed:
 *
 *  1. in-memory Map cache (per session, instant)
 *  2. in-flight promise dedupe (many cards for the same template share one fetch)
 *  3. IndexedDB cache via idb-keyval (own "studio-previews" db; templates are
 *     immutable CC0 content, so entries never need invalidation)
 *
 * Only NETWORK fetches go through the concurrency limiter (max 4 simultaneous);
 * memory/IndexedDB hits bypass it entirely. Every failure path resolves to
 * `null` so callers can keep their placeholder UI — this module never throws.
 */
import { createStore, get, set } from "idb-keyval"
import { api } from "@/lib/studio/api-client"
import type { DesignDoc } from "@/lib/design/types"

/* --------------------------- concurrency limiter --------------------------- */

export interface Limiter {
  /** Runs `fn` when a slot is free; at most `concurrency` fns execute at once. */
  run: <T>(fn: () => Promise<T>) => Promise<T>
  /** Number of tasks currently executing. */
  active: () => number
  /** Number of tasks waiting for a slot. */
  pending: () => number
}

/** Pure, dependency-free FIFO concurrency limiter (exported for unit tests). */
export function createLimiter(concurrency: number): Limiter {
  const max = Math.max(1, Math.floor(concurrency) || 1)
  let running = 0
  const waiters: (() => void)[] = []

  function startNext(): void {
    while (running < max && waiters.length > 0) {
      const wake = waiters.shift()
      running += 1
      wake?.()
    }
  }

  async function run<T>(fn: () => Promise<T>): Promise<T> {
    if (running >= max) {
      await new Promise<void>((resolve) => waiters.push(resolve))
    } else {
      running += 1
    }
    try {
      return await fn()
    } finally {
      running -= 1
      startNext()
    }
  }

  return { run, active: () => running, pending: () => waiters.length }
}

/* ------------------------------ doc fetching ------------------------------ */

const docStore = createStore("studio-previews", "tpl-docs")
const docStoreGet = <T,>(key: string): Promise<T | undefined> => get<T>(key, docStore)
const docStoreSet = (key: string, value: unknown): Promise<void> => set(key, value, docStore)
const memCache = new Map<string, DesignDoc>()
const inflight = new Map<string, Promise<DesignDoc | null>>()
const limiter = createLimiter(4)

const tplKey = (id: string): string => `tpl:${id}`

interface CachedDoc {
  t: number
  doc: DesignDoc
}

/** Light structural check so corrupt cache/network payloads can never crash a preview. */
function isDesignDoc(value: unknown): value is DesignDoc {
  if (!value || typeof value !== "object") return false
  const d = value as Partial<DesignDoc>
  return typeof d.width === "number" && typeof d.height === "number" && Array.isArray(d.pages)
}

async function fetchDocFromNetwork(templateId: string): Promise<DesignDoc | null> {
  try {
    const res = await api.get<{ template: { contentJson: string } }>(`/api/templates/${templateId}`)
    const doc = JSON.parse(res.template.contentJson) as DesignDoc
    if (!isDesignDoc(doc)) return null
    memCache.set(templateId, doc)
    // Persist best-effort; quota errors must not affect the caller.
    try {
      await docStoreSet(tplKey(templateId), { t: Date.now(), doc } satisfies CachedDoc)
    } catch {
      /* private mode / quota — memory cache still works */
    }
    return doc
  } catch {
    return null
  }
}

/**
 * Resolve the full DesignDoc for a template id, through all cache layers.
 * Never throws — returns null when the template is unavailable.
 */
export async function getTemplateDoc(templateId: string): Promise<DesignDoc | null> {
  if (!templateId) return null

  const mem = memCache.get(templateId)
  if (mem) return mem

  const running = inflight.get(templateId)
  if (running) return running

  const task = (async (): Promise<DesignDoc | null> => {
    // 1) IndexedDB cache hit (bypasses the network limiter)
    try {
      const cached = await docStoreGet<CachedDoc>(tplKey(templateId))
      if (isDesignDoc(cached?.doc)) {
        memCache.set(templateId, cached.doc)
        return cached.doc
      }
    } catch {
      /* no IndexedDB available — fall through to the network */
    }
    // 2) network (concurrency-limited, deduped above)
    try {
      return await limiter.run(() => fetchDocFromNetwork(templateId))
    } catch {
      return null
    }
  })()

  inflight.set(templateId, task)
  try {
    return await task
  } finally {
    inflight.delete(templateId)
  }
}
