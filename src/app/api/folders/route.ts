import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { ok, parseBody, route, assertSameOrigin } from "@/lib/api-utils"
import { ensurePersonalWorkspace } from "@/lib/auth"
import { requireUser } from "@/lib/api-utils"

export const GET = route(async () => {
  const user = await requireUser()
  const workspaceId = await ensurePersonalWorkspace(user.id)
  const folders = await db.folder.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, parentId: true, createdAt: true },
  })
  return ok({ folders })
})

const createSchema = z.object({ name: z.string().min(1).max(80), parentId: z.string().optional() })

export const POST = route(async (req: NextRequest) => {
  assertSameOrigin(req)
  const user = await requireUser()
  const workspaceId = await ensurePersonalWorkspace(user.id)
  const body = await parseBody(req, createSchema)
  const folder = await db.folder.create({
    data: { name: body.name, workspaceId, parentId: body.parentId },
    select: { id: true, name: true, parentId: true },
  })
  return ok({ folder }, { status: 201 })
})
