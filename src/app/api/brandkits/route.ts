import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { ok, parseBody, route, assertSameOrigin } from "@/lib/api-utils"
import { ensurePersonalWorkspace } from "@/lib/auth"
import { requireUser } from "@/lib/api-utils"

export const GET = route(async () => {
  const user = await requireUser()
  const workspaceId = await ensurePersonalWorkspace(user.id)
  const kits = await db.brandKit.findMany({
    where: { ownerId: user.id },
    orderBy: { updatedAt: "desc" },
  })
  return ok({ kits })
})

const createSchema = z.object({
  name: z.string().min(1).max(80),
  colorsJson: z.string().max(4000).optional(),
  fontsJson: z.string().max(4000).optional(),
  logosJson: z.string().max(100_000).optional(),
  guidelines: z.string().max(10_000).optional(),
})

export const POST = route(async (req: NextRequest) => {
  assertSameOrigin(req)
  const user = await requireUser()
  await ensurePersonalWorkspace(user.id)
  const body = await parseBody(req, createSchema)
  const kit = await db.brandKit.create({
    data: { ownerId: user.id, name: body.name, colorsJson: body.colorsJson ?? "[]", fontsJson: body.fontsJson ?? "[]", logosJson: body.logosJson ?? "[]", guidelines: body.guidelines },
  })
  return ok({ kit }, { status: 201 })
})
