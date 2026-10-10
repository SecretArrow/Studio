/**
 * Studio collab mini-service — real-time presence + live-follow notifications.
 *
 * Port: 3003 (reached through the Caddy gateway via ?XTransformPort=3003).
 * socket.io path MUST stay "/" (Caddy forwards it to this port).
 * In-memory only — no persistence, no auth (tokens come later).
 *
 * Client → server events (all payloads validated, oversized/invalid dropped):
 *   join       { projectId, user { id?, name, color } }            ack({ ok, you, members })
 *   presence   { projectId, editing?, cursor? { x, y } }           relayed to room others
 *   doc-update { projectId, contentJson, updatedAt, clientId, userName? } relayed to room others
 *   leave      { projectId }                                       explicit leave
 *
 * Server → client events:
 *   collab:members    { members: Member[] }                 to the joining socket (also via join ack)
 *   collab:joined     { member }                            to room others
 *   collab:left       { sid, userId? }                      to room others
 *   collab:presence   { sid, user, editing, cursor? }       to room others
 *   collab:doc-update { projectId, updatedAt, userName, clientId, contentJson? } to room others
 *
 * doc-update relays include contentJson only when it is small (<= 512 KB);
 * larger docs are announced as metadata and receivers re-fetch from the REST
 * API of record — clients never hot-swap the doc mid-edit anyway.
 */
import { createServer, type IncomingMessage, type ServerResponse } from "http"
import { Server, type Socket } from "socket.io"

const PORT = 3003

/* ------------------------------ types ------------------------------ */

interface CollabUser {
  id: string
  name: string
  color: string
}

interface Member extends CollabUser {
  sid: string
}

interface Membership {
  projectId: string
  user: CollabUser
}

/* --------------------------- validation ---------------------------- */

const isStr = (v: unknown, min: number, max: number): v is string =>
  typeof v === "string" && v.length >= min && v.length <= max

const isFiniteNum = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v)

const HEX_COLOR = /^#[0-9a-fA-F]{3,8}$/

function sanitizeUser(raw: unknown): CollabUser | null {
  if (!raw || typeof raw !== "object") return null
  const r = raw as Record<string, unknown>
  const name = isStr(r.name, 1, 80) ? r.name.trim() : ""
  if (!name) return null
  const id = isStr(r.id, 1, 64) ? r.id : ""
  const color = isStr(r.color, 4, 9) && HEX_COLOR.test(r.color) ? r.color : "#8b5cf6"
  return { id, name, color }
}

function validJoin(p: unknown): { projectId: string; user: CollabUser } | null {
  if (!p || typeof p !== "object") return null
  const r = p as Record<string, unknown>
  if (!isStr(r.projectId, 1, 128)) return null
  const user = sanitizeUser(r.user)
  if (!user) return null
  return { projectId: r.projectId, user }
}

function validCursor(v: unknown): { x: number; y: number } | null {
  if (!v || typeof v !== "object") return null
  const r = v as Record<string, unknown>
  if (!isFiniteNum(r.x) || !isFiniteNum(r.y)) return null
  const x = Math.max(-1e6, Math.min(1e6, r.x))
  const y = Math.max(-1e6, Math.min(1e6, r.y))
  return { x, y }
}

/* --------------------------- room registry ------------------------- */

const membersByRoom = new Map<string, Map<string, Member>>() // projectId -> sid -> member
const membershipBySocket = new Map<string, Membership>() // sid -> membership

function memberList(projectId: string): Member[] {
  const room = membersByRoom.get(projectId)
  return room ? Array.from(room.values()) : []
}

function removeFromRoom(sid: string): { projectId: string; user: CollabUser } | null {
  const membership = membershipBySocket.get(sid)
  if (!membership) return null
  membershipBySocket.delete(sid)
  const room = membersByRoom.get(membership.projectId)
  if (room) {
    room.delete(sid)
    if (room.size === 0) membersByRoom.delete(membership.projectId)
  }
  return membership
}

/* ------------------------------ server ----------------------------- */

const httpServer = createServer((_req: IncomingMessage, res: ServerResponse) => {
  // Only reachable for non-socket.io requests (delegated by exposeHealthEndpoint below).
  res.writeHead(404, { "Content-Type": "application/json" })
  res.end(JSON.stringify({ ok: false, error: "not found" }))
})

const io = new Server(httpServer, {
  // DO NOT change the path — Caddy forwards "/" on this port to this service.
  path: "/",
  cors: { origin: "*", methods: ["GET", "POST"] },
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 4e6, // room for doc-update payloads up to ~3 MB
})

/** Drop presence floods (min 50ms between presence events per socket). */
const lastPresenceAt = new Map<string, number>()

io.on("connection", (socket: Socket) => {
  socket.on("join", (payload: unknown, ack?: unknown) => {
    const parsed = validJoin(payload)
    if (!parsed) {
      if (typeof ack === "function") ack({ ok: false, error: "invalid join payload" })
      return
    }
    const { projectId, user } = parsed

    // A socket lives in exactly one room: leave any previous one first.
    const prev = removeFromRoom(socket.id)
    if (prev && prev.projectId !== projectId) {
      socket.leave(prev.projectId)
      socket.to(prev.projectId).emit("collab:left", { sid: socket.id, userId: prev.user.id })
    }

    const member: Member = { ...user, sid: socket.id }
    let room = membersByRoom.get(projectId)
    if (!room) {
      room = new Map()
      membersByRoom.set(projectId, room)
    }
    room.set(socket.id, member)
    membershipBySocket.set(socket.id, { projectId, user })
    socket.join(projectId)

    // Everyone else learns about the newcomer.
    socket.to(projectId).emit("collab:joined", { member })

    const respond = { ok: true, you: socket.id, members: memberList(projectId) }
    if (typeof ack === "function") ack(respond)
    socket.emit("collab:members", { members: memberList(projectId) })
  })

  socket.on("presence", (payload: unknown) => {
    const membership = membershipBySocket.get(socket.id)
    if (!membership) return
    const now = Date.now()
    const last = lastPresenceAt.get(socket.id) ?? 0
    if (now - last < 50) return // rate-limit cursor floods
    lastPresenceAt.set(socket.id, now)

    const r = (payload && typeof payload === "object" ? payload : {}) as Record<string, unknown>
    const editing = r.editing === true
    const cursor = validCursor(r.cursor)
    socket.to(membership.projectId).emit("collab:presence", {
      sid: socket.id,
      user: membership.user,
      editing,
      ...(cursor ? { cursor } : {}),
    })
  })

  socket.on("doc-update", (payload: unknown) => {
    const membership = membershipBySocket.get(socket.id)
    if (!membership) return
    const r = (payload && typeof payload === "object" ? payload : {}) as Record<string, unknown>
    if (!isStr(r.projectId, 1, 128) || r.projectId !== membership.projectId) return
    if (!isStr(r.updatedAt, 1, 40) || !isStr(r.clientId, 1, 64)) return
    // Only members who can save should broadcast updates.
    const room = membersByRoom.get(membership.projectId)
    if (!room || !room.has(socket.id)) return

    const contentJson = isStr(r.contentJson, 1, 3_000_000) ? r.contentJson : null
    socket.to(membership.projectId).emit("collab:doc-update", {
      projectId: membership.projectId,
      updatedAt: r.updatedAt,
      clientId: r.clientId,
      userName: membership.user.name,
      // Small docs travel inline; big ones are metadata-only (clients refetch).
      ...(contentJson && contentJson.length <= 512_000 ? { contentJson } : {}),
    })
  })

  socket.on("leave", () => {
    const removed = removeFromRoom(socket.id)
    if (removed) {
      socket.leave(removed.projectId)
      socket.to(removed.projectId).emit("collab:left", { sid: socket.id, userId: removed.user.id })
    }
  })

  socket.on("disconnect", () => {
    const removed = removeFromRoom(socket.id)
    lastPresenceAt.delete(socket.id)
    if (removed) {
      socket.to(removed.projectId).emit("collab:left", { sid: socket.id, userId: removed.user.id })
    }
  })

  socket.on("error", (err: unknown) => {
    console.error(`[collab] socket error ${socket.id}:`, err)
  })
})

httpServer.listen(PORT, () => {
  console.log(`[collab] studio collab service listening on :${PORT} (path "/")`)
})

/**
 * socket.io with path "/" intercepts every HTTP request, which would hide our
 * /health route behind engine.io ("Transport unknown"). Re-wrap the request
 * handler: /health is answered first, everything else is delegated back to the
 * engine.io handler (websocket "upgrade" events are untouched and keep working).
 */
function exposeHealthEndpoint(server: typeof httpServer) {
  type Handler = (req: IncomingMessage, res: ServerResponse) => void
  const engineHandlers = (server as unknown as { listeners(name: string): Handler[] })
    .listeners("request")
    .slice(0)
  server.removeAllListeners("request")
  server.on("request", (req: IncomingMessage, res: ServerResponse) => {
    if (req.method === "GET" && req.url && req.url.split("?")[0] === "/health") {
      const rooms: Record<string, number> = {}
      for (const [id, room] of membersByRoom) rooms[id] = room.size
      res.writeHead(200, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ ok: true, service: "studio-collab", rooms, uptimeSec: Math.round(process.uptime()) }))
      return
    }
    for (const h of engineHandlers) h.call(server, req, res)
  })
}
exposeHealthEndpoint(httpServer)

process.on("SIGTERM", () => {
  httpServer.close(() => process.exit(0))
})
process.on("SIGINT", () => {
  httpServer.close(() => process.exit(0))
})
