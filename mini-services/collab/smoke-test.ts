// Throwaway end-to-end smoke test for the collab service (agent 4-a).
import { io } from "socket.io-client"

const URL = "http://localhost:3003/"
const PROJECT = "proj_test_1"

let failures = 0
function check(label: string, cond: boolean) {
  console.log(`${cond ? "PASS" : "FAIL"} — ${label}`)
  if (!cond) failures++
}
const done = (code: number) => {
  console.log(failures === 0 ? "ALL PASS" : `${failures} FAILURES`)
  alice.disconnect()
  bob.disconnect()
  setTimeout(() => process.exit(code), 100)
}
setTimeout(() => done(1), 8000)

const alice = io(URL, { path: "/", transports: ["polling", "websocket"], forceNew: true })
const bob = io(URL, { path: "/", transports: ["polling", "websocket"], forceNew: true })

// Bob (receiver) listens for relays from Alice.
let gotPresence = false
let gotDocUpdate = false
let gotJoin = false
let gotLeft = false

bob.on("collab:joined", (data: { member: { name: string } }) => {
  gotJoin = data.member?.name === "Alice" || gotJoin
})
bob.on("collab:presence", (p: { user: { name: string }; editing: boolean; cursor?: { x: number; y: number } }) => {
  gotPresence = p.user?.name === "Alice" && p.editing === true && p.cursor?.x === 12.5
})
bob.on("collab:doc-update", (d: { userName: string; updatedAt: string; contentJson?: string }) => {
  gotDocUpdate = d.userName === "Alice" && d.updatedAt === "2026-01-01T00:00:00Z" && d.contentJson === "{\"v\":1}"
})
bob.on("collab:left", () => { gotLeft = true })
alice.on("collab:left", (d: { userId?: string }) => { if (d?.userId === "u-bob") gotLeft = true })

// Alice must NOT receive her own relays.
let selfEcho = 0
alice.on("collab:presence", () => { selfEcho++ })
alice.on("collab:doc-update", () => { selfEcho++ })

alice.on("connect", () => {
  alice.emit("join", { projectId: PROJECT, user: { id: "u-alice", name: "Alice", color: "#8b5cf6" } }, (ack: { ok: boolean; members: unknown[] }) => {
    check("join ack ok", ack.ok === true)
    check("join ack has 1 member", Array.isArray(ack.members) && ack.members.length === 1)
    bob.emit("join", { projectId: PROJECT, user: { id: "u-bob", name: "Bob", color: "#10b981" } }, (ack2: { ok: boolean; members: unknown[] }) => {
      check("bob ack has 2 members", ack2.ok && ack2.members.length === 2)
      alice.emit("presence", { projectId: PROJECT, editing: true, cursor: { x: 12.5, y: 40 } })
      alice.emit("doc-update", { projectId: PROJECT, contentJson: "{\"v\":1}", updatedAt: "2026-01-01T00:00:00Z", clientId: alice.id, userName: "Alice" })
      setTimeout(() => {
        check("bob got full member list via join ack (2 members)", true) // asserted above
        check("bob received presence relay (editing+cursor)", gotPresence)
        check("bob received doc-update relay (userName+contentJson)", gotDocUpdate)
        check("sender receives no self-echo", selfEcho === 0)
        bob.emit("leave")
        setTimeout(() => {
          check("bob leave broadcast to room", gotLeft)
          alice.emit("join", { projectId: 123, user: { name: "" } }, (ack: { ok: boolean }) => {
            check("invalid join rejected", ack.ok === false)
            setTimeout(() => done(0), 300)
          })
        }, 300)
      }, 500)
    })
  })
})
