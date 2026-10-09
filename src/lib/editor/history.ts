/**
 * Undo/redo history for the canvas editor.
 * Stores serialized DesignDoc snapshots (JSON strings) with a 60-step limit
 * and coalesces rapid property changes (slider drags, typing, nudges) into a
 * single entry when they share a coalesce key within a 500ms bucket.
 */

export interface HistoryMeta {
  label?: string
}

const COALESCE_WINDOW_MS = 500

export class HistoryStore {
  private stack: string[] = []
  private index = -1
  private limit: number
  private lastKey: string | null = null
  private lastPushAt = 0

  constructor(initial: unknown, limit = 60) {
    this.limit = Math.max(2, limit)
    this.stack.push(JSON.stringify(initial))
    this.index = 0
  }

  /**
   * Record a new snapshot. Pass `key` to coalesce rapid consecutive changes
   * (e.g. "opacity:el_123" while a slider is being dragged).
   */
  push(doc: unknown, key?: string): void {
    const now = Date.now()
    const snap = JSON.stringify(doc)
    if (key && key === this.lastKey && now - this.lastPushAt < COALESCE_WINDOW_MS) {
      // replace the top entry — one history step per key per bucket
      this.stack[this.index] = snap
      this.lastPushAt = now
      return
    }
    if (this.index < this.stack.length - 1) this.stack = this.stack.slice(0, this.index + 1)
    this.stack.push(snap)
    if (this.stack.length > this.limit) this.stack.shift()
    this.index = this.stack.length - 1
    this.lastKey = key ?? null
    this.lastPushAt = now
  }

  undo(): unknown | null {
    if (this.index <= 0) return null
    this.index -= 1
    this.lastKey = null
    return JSON.parse(this.stack[this.index])
  }

  redo(): unknown | null {
    if (this.index >= this.stack.length - 1) return null
    this.index += 1
    this.lastKey = null
    return JSON.parse(this.stack[this.index])
  }

  get canUndo(): boolean {
    return this.index > 0
  }

  get canRedo(): boolean {
    return this.index < this.stack.length - 1
  }

  /** Clear history and start fresh from the given doc (page switches etc.). */
  reset(doc: unknown): void {
    this.stack = [JSON.stringify(doc)]
    this.index = 0
    this.lastKey = null
  }
}
