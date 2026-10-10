/**
 * Studio — bounded LRU Map.
 * -------------------------
 * Pure, dependency-free least-recently-used cache used to cap module-level
 * in-memory caches (template preview docs, baked filter canvases, decoded
 * images, QR data URLs). Eviction is insertion-order based: a Map's first key
 * is the least-recently-used entry. Exported for unit tests.
 *
 * A `get` hit re-inserts the key so it counts as "recently used". Behavior on
 * a miss is identical to a plain Map (returns undefined); callers just
 * recompute/refresh, so capping can never change correctness — only memory.
 */
export class LruMap<K, V> {
  private readonly max: number
  private readonly map = new Map<K, V>()

  constructor(max: number) {
    this.max = Math.max(1, Math.floor(max) || 1)
  }

  get size(): number {
    return this.map.size
  }

  has(key: K): boolean {
    return this.map.has(key)
  }

  get(key: K): V | undefined {
    if (!this.map.has(key)) return undefined
    const value = this.map.get(key) as V
    // mark as recently used (refresh insertion order)
    this.map.delete(key)
    this.map.set(key, value)
    return value
  }

  set(key: K, value: V): this {
    if (this.map.has(key)) this.map.delete(key)
    this.map.set(key, value)
    while (this.map.size > this.max) {
      const oldest = this.map.keys().next().value
      if (oldest === undefined) break
      this.map.delete(oldest)
    }
    return this
  }

  delete(key: K): boolean {
    return this.map.delete(key)
  }

  clear(): void {
    this.map.clear()
  }
}
