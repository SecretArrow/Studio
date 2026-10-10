"use client"

/**
 * usePresence — live collaboration presence for the editor shell.
 *
 * Connects ONCE per editor to the collab mini-service (port 3003) through the
 * Caddy gateway. Gateway convention (do not change):
 *   io("/", { query: { XTransformPort: "3003" }, path: "/" })
 *
 * Offline-safe by design: if the socket cannot connect, presence silently
 * degrades to "offline" and editing is never affected. All callbacks are
 * throttled and never throw.
 *
 * React-Compiler safe: setState is only called from socket event callbacks
 * (never synchronously inside effect bodies), refs are never read during
 * render, the socket is fully disconnected on unmount.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { io, type Socket } from "socket.io-client"

export interface PresenceMember {
  /** stable key for rendering (socket id or user id) */
  key: string
  /** user id ("" for guests / share-link visitors) */
  id: string
  name: string
  color: string
  /** true while the member is actively editing (auto-decays ~6s) */
  editing: boolean
}

export type PresenceStatus = "offline" | "connecting" | "live"

/** Fixed identity palette (no indigo/blue per Studio UI rules). */
const PALETTE = [
  "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#14b8a6",
  "#f97316", "#ec4899", "#84cc16", "#a855f7", "#eab308",
] as const

/** Deterministic color for a user identity — same user ⇒ same color everywhere. */
export function colorFor(key: string): string {
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
  return PALETTE[h % PALETTE.length]
}

const AVATAR_BG: Record<string, string> = {
  "#8b5cf6": "bg-violet-500",
  "#10b981": "bg-emerald-500",
  "#f59e0b": "bg-amber-500",
  "#ef4444": "bg-red-500",
  "#14b8a6": "bg-teal-500",
  "#f97316": "bg-orange-500",
  "#ec4899": "bg-pink-500",
  "#84cc16": "bg-lime-500",
  "#a855f7": "bg-purple-500",
  "#eab308": "bg-yellow-500",
}

/** Tailwind class for an avatar background (keeps styling class-based). */
export function avatarClass(color: string): string {
  return AVATAR_BG[color] ?? "bg-primary"
}

export interface RemoteDocUpdate {
  updatedAt: string
  userName: string
}

export interface UsePresenceOptions {
  /** cloud project id; null/undefined keeps presence offline */
  projectId: string | null
  /** display name for this client (user name, email or "Guest") */
  displayName: string
  /** signed-in user id ("" for share-link guests) */
  userId?: string | null
  enabled?: boolean
  /** fired when someone else saved the doc — receivers toast + offer reload */
  onRemoteDocUpdate?: (info: RemoteDocUpdate) => void
}

interface RosterEntry {
  sid: string
  id: string
  name: string
  color: string
  editing: boolean
}

const HEX_COLOR = /^#[0-9a-fA-F]{3,8}$/

function sanitizeMember(raw: unknown): RosterEntry | null {
  if (!raw || typeof raw !== "object") return null
  const r = raw as { sid?: unknown; id?: unknown; name?: unknown; color?: unknown }
  const sid = typeof r.sid === "string" ? r.sid : ""
  if (!sid) return null
  const name = typeof r.name === "string" && r.name.trim() ? r.name.trim().slice(0, 80) : "Guest"
  const id = typeof r.id === "string" ? r.id.slice(0, 64) : ""
  const color = typeof r.color === "string" && HEX_COLOR.test(r.color) ? r.color : colorFor(id || name)
  return { sid, id, name, color, editing: false }
}

function sanitizeRoster(raw: unknown[], selfSid: string): RosterEntry[] {
  const out: RosterEntry[] = []
  const seenIds = new Set<string>()
  for (const item of raw) {
    const m = sanitizeMember(item)
    if (!m || m.sid === selfSid) continue
    if (m.id) {
      if (seenIds.has(m.id)) continue // dedupe multiple tabs of the same user
      seenIds.add(m.id)
    }
    out.push(m)
  }
  return out
}

const EDITING_DECAY_MS = 6000
const CURSOR_THROTTLE_MS = 100
const EDITING_HEARTBEAT_MS = 2000

export function usePresence({ projectId, displayName, userId, enabled = true, onRemoteDocUpdate }: UsePresenceOptions) {
  const [status, setStatus] = useState<PresenceStatus>("offline")
  const [roster, setRoster] = useState<RosterEntry[]>([])

  const socketRef = useRef<Socket | null>(null)
  const selfSidRef = useRef("")
  const identityRef = useRef({ displayName, userId, color: colorFor(userId || displayName) })
  const remoteCbRef = useRef(onRemoteDocUpdate)
  const lastCursorSentRef = useRef(0)
  const lastEditingSentRef = useRef(0)
  const editingTimersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  // Keep identity + callback refs fresh without reconnecting.
  useEffect(() => {
    identityRef.current = { displayName, userId, color: colorFor(userId || displayName) }
  }, [displayName, userId])

  useEffect(() => {
    remoteCbRef.current = onRemoteDocUpdate
  }, [onRemoteDocUpdate])

  const applyPresence = useCallback((entry: RosterEntry, editing: boolean) => {
    setRoster((prev) => {
      const idx = prev.findIndex((m) => m.sid === entry.sid || (entry.id !== "" && m.id === entry.id))
      if (idx === -1) return [...prev, { ...entry, editing }]
      const next = prev.slice()
      next[idx] = { ...next[idx], ...entry, editing }
      return next
    })
    // editing indicator auto-decays unless refreshed by a newer heartbeat
    const timers = editingTimersRef.current
    const existing = timers.get(entry.sid)
    if (existing) clearTimeout(existing)
    if (editing) {
      timers.set(
        entry.sid,
        setTimeout(() => {
          setRoster((prev) => prev.map((m) => (m.sid === entry.sid ? { ...m, editing: false } : m)))
          timers.delete(entry.sid)
        }, EDITING_DECAY_MS),
      )
    }
  }, [])

  /* ---------------- socket lifecycle (one per editor) ---------------- */
  useEffect(() => {
    if (!enabled || !projectId) return
    const timers = editingTimersRef.current

    // deferred initial status (React Compiler: no sync setState in effects)
    const bootTimer = setTimeout(() => setStatus("connecting"), 0)

    const socket = io("/", {
      // Gateway convention: relative URL, port via XTransformPort, path "/".
      query: { XTransformPort: "3003" },
      path: "/",
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1500,
      reconnectionDelayMax: 8000,
      timeout: 10000,
    })
    socketRef.current = socket

    const clearEditingTimers = () => {
      for (const t of timers.values()) clearTimeout(t)
      timers.clear()
    }

    socket.on("connect", () => {
      setStatus("live")
      selfSidRef.current = socket.id ?? ""
      const me = identityRef.current
      socket.emit(
        "join",
        { projectId, user: { id: me.userId ?? "", name: me.displayName, color: me.color } },
        (ack: { ok?: boolean; you?: string; members?: unknown[] } | undefined) => {
          if (!ack || ack.ok !== true || !Array.isArray(ack.members)) return
          if (typeof ack.you === "string" && ack.you) selfSidRef.current = ack.you
          setRoster(sanitizeRoster(ack.members, selfSidRef.current))
        },
      )
    })

    socket.on("disconnect", () => {
      setStatus("connecting") // socket.io keeps retrying in the background
      setRoster([])
      clearEditingTimers()
    })

    socket.on("connect_error", () => {
      setStatus("offline") // silent degradation — editing keeps working
    })

    socket.on("collab:members", (data: unknown) => {
      const members = (data as { members?: unknown[] } | null)?.members
      if (Array.isArray(members)) setRoster(sanitizeRoster(members, selfSidRef.current))
    })

    socket.on("collab:joined", (data: unknown) => {
      const member = sanitizeMember((data as { member?: unknown } | null)?.member)
      if (!member || member.sid === selfSidRef.current) return
      setRoster((prev) =>
        prev.some((m) => m.sid === member.sid || (member.id !== "" && m.id === member.id)) ? prev : [...prev, member],
      )
    })

    socket.on("collab:left", (data: unknown) => {
      const d = (data ?? {}) as { sid?: unknown; userId?: unknown }
      const sid = typeof d.sid === "string" ? d.sid : ""
      const uid = typeof d.userId === "string" ? d.userId : ""
      if (!sid && !uid) return
      setRoster((prev) => prev.filter((m) => m.sid !== sid && (uid === "" || m.id !== uid)))
      const t = timers.get(sid)
      if (t) {
        clearTimeout(t)
        timers.delete(sid)
      }
    })

    socket.on("collab:presence", (data: unknown) => {
      const d = (data ?? {}) as { sid?: unknown; user?: unknown; editing?: unknown }
      if (typeof d.sid !== "string" || !d.sid) return
      const u = (d.user ?? {}) as { id?: unknown; name?: unknown; color?: unknown }
      const member = sanitizeMember({ sid: d.sid, id: u.id, name: u.name, color: u.color })
      if (!member) return
      applyPresence(member, d.editing === true)
    })

    socket.on("collab:doc-update", (data: unknown) => {
      const d = (data ?? {}) as { updatedAt?: unknown; userName?: unknown; clientId?: unknown }
      if (typeof d.clientId === "string" && d.clientId && d.clientId === selfSidRef.current) return
      const updatedAt = typeof d.updatedAt === "string" ? d.updatedAt : ""
      const userName = typeof d.userName === "string" && d.userName ? d.userName : "Someone"
      remoteCbRef.current?.({ updatedAt, userName })
    })

    return () => {
      clearTimeout(bootTimer)
      clearEditingTimers()
      socket.removeAllListeners()
      socket.disconnect()
      socketRef.current = null
    }
  }, [enabled, projectId, applyPresence])

  /* --------------------------- outbound API --------------------------- */

  const emitPresence = useCallback(
    (payload: { editing?: boolean; cursor?: { x: number; y: number } }) => {
      const socket = socketRef.current
      if (!socket || !socket.connected || !projectId) return
      socket.emit("presence", { projectId, ...payload })
    },
    [projectId],
  )

  /** Broadcast a viewport/canvas cursor position (throttled to ~10 Hz). */
  const sendCursor = useCallback(
    (x: number, y: number) => {
      const now = Date.now()
      if (now - lastCursorSentRef.current < CURSOR_THROTTLE_MS) return
      lastCursorSentRef.current = now
      emitPresence({ editing: false, cursor: { x, y } })
    },
    [emitPresence],
  )

  /** Heartbeat: "I am actively editing" (throttled; indicator decays ~6s). */
  const notifyEditing = useCallback(() => {
    const now = Date.now()
    if (now - lastEditingSentRef.current < EDITING_HEARTBEAT_MS) return
    lastEditingSentRef.current = now
    emitPresence({ editing: true })
  }, [emitPresence])

  /**
   * Announce a saved doc revision to the room. Receivers show a
   * "Project updated by …" toast with a reload action — never hot-swapped.
   */
  const sendDocUpdate = useCallback(
    (contentJson: string, updatedAt: string) => {
      const socket = socketRef.current
      if (!socket || !socket.connected || !projectId) return
      if (typeof contentJson !== "string" || contentJson.length === 0 || contentJson.length > 3_000_000) return
      if (typeof updatedAt !== "string" || updatedAt.length === 0) return
      socket.emit("doc-update", {
        projectId,
        contentJson,
        updatedAt,
        clientId: selfSidRef.current || socket.id,
        userName: identityRef.current.displayName,
      })
    },
    [projectId],
  )

  const members = useMemo<PresenceMember[]>(
    () =>
      roster.map((m) => ({ key: m.sid || m.id, id: m.id, name: m.name, color: m.color, editing: m.editing })),
    [roster],
  )

  const selfColor = useMemo(() => colorFor(userId || displayName), [userId, displayName])

  return { status, members, selfColor, sendCursor, notifyEditing, sendDocUpdate }
}
