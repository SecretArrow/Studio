import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, route } from "@/lib/api-utils"

export const GET = route(async () => {
  const start = Date.now()
  let database = "down"
  try {
    await db.user.count()
    database = "up"
  } catch {
    database = "down"
  }
  return ok({
    ok: database === "up",
    services: { app: "up", database },
    latencyMs: Date.now() - start,
    time: new Date().toISOString(),
  })
})
